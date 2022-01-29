#![feature(backtrace)]

mod runtime;

use mlua::prelude::*;
use mlua::Value;
use once_cell::sync::Lazy;
use runtime::TaskResult;
use runtime::{Config, Runtime};
use std::fs::File;
use std::io::BufReader;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use thiserror::Error;

use crate::runtime::GlobalEvent;
use crate::runtime::TaskResultValue;

static INITIALIZED: Lazy<AtomicBool> = Lazy::new(|| AtomicBool::new(false));
static RUNTIME: Lazy<Mutex<Option<Runtime>>> = Lazy::new(|| Mutex::new(None));

pub fn init(config: &Config) {
    if INITIALIZED
        .compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed)
        .unwrap_or(true)
    {
        return;
    }

    use log::LevelFilter;
    use log4rs::append::file::FileAppender;
    use log4rs::config::{Appender, Config, Logger, Root};
    use log4rs::encode::pattern::PatternEncoder;

    let write_dir = config.write_dir.clone().unwrap();
    let mut log_file = PathBuf::from(&write_dir);
    log_file.push("Logs/dcs-ts.log");

    let requests = FileAppender::builder()
        .encoder(Box::new(PatternEncoder::new(
            "{d(%Y-%m-%d %H:%M:%S%.3f)} {l:<7} {t}: {m}{n}",
        )))
        .append(false)
        .build(log_file)
        .unwrap();

    let log_level = if config.debugging {
        LevelFilter::Debug
    } else {
        LevelFilter::Info
    };

    let log_config = Config::builder()
        .appender(Appender::builder().build("file", Box::new(requests)))
        .logger(Logger::builder().build("dcs_ts", log_level))
        .build(Root::builder().appender("file").build(LevelFilter::Off))
        .unwrap();

    log4rs::init_config(log_config).unwrap();
}

#[no_mangle]
pub fn initialize(lua: &Lua, write_dir: String) -> LuaResult<()> {
    {
        if RUNTIME.lock().unwrap().is_none() {
            let mut config_path = PathBuf::from(&write_dir);
            config_path.push("Config/ts.json");

            let file = File::open(config_path)?;
            let reader = BufReader::new(file);
            let mut config: Config = match serde_json::from_reader(reader) {
                Ok(config) => config,
                Err(error) => {
                    log::error!("failed to load config: {}", error);
                    return Err(error.to_lua_err());
                }
            };
            config.write_dir = Some(write_dir);

            init(&config);

            let runtime = Runtime::new(config.clone());
            *(RUNTIME.lock().unwrap()) = Some(runtime);
            log::info!("runtime created");

            RUNTIME.lock().unwrap().as_mut().unwrap().initialize();
            log::info!("runtime initialized");
        } else {
            let mut runtime = RUNTIME.lock().unwrap();
            runtime
                .as_mut()
                .unwrap()
                .dispatch_global_event(GlobalEvent::Loaded);
        }
    }

    let bytes = include_bytes!("bridge.lua");
    log::debug!("loading bridge code");
    let chunk = lua.load(bytes);
    log::debug!("executing bridge code");
    chunk.exec()?;
    log::debug!("initialization complete");
    Ok(())
}

#[no_mangle]
pub fn get_queued_tasks(lua: &Lua, _: ()) -> LuaResult<mlua::Value> {
    let runtime_lock = RUNTIME.lock();
    return match runtime_lock {
        Err(_) => {
            log::debug!("failed to get lock for queued tasks");
            Ok(mlua::Nil)
        }
        Ok(mut runtime) => {
            if runtime.is_none() {
                return Err("invalid runtime".to_lua_err());
            }

            let table = runtime.as_mut().unwrap().get_queued_tasks(lua);
            if table.is_some() {
                log::debug!("get_queued_tasks()",);
            }
            Ok(table.unwrap_or(mlua::Nil))
        }
    };
}

#[no_mangle]
pub fn add_task_results(lua: &Lua, results: mlua::Table) -> LuaResult<()> {
    log::debug!("add_task_results");
    let mut runtime = RUNTIME.lock().unwrap();
    if runtime.is_some() {
        for result in results.sequence_values() {
            if let Value::Table(table) = result? {
                let id: u64 = table.get("id")?;

                let maybe_result: LuaResult<TaskResultValue> = lua.from_value(table.get("result")?);

                match maybe_result {
                    Ok(result) => {
                        runtime
                            .as_mut()
                            .unwrap()
                            .complete_task(TaskResult { id, result });
                    }
                    Err(error) => {
                        runtime.as_mut().unwrap().complete_task(TaskResult {
                            id,
                            result: TaskResultValue::Error(format!(
                                "failed to process task result: {}",
                                error
                            )),
                        });
                    }
                }
            }
        }
        return Ok(());
    }
    Err("invalid runtime".to_lua_err())
}

#[no_mangle]
pub fn lua_channel_send(lua: &Lua, (channel, msg): (mlua::Number, mlua::Table)) -> LuaResult<bool> {
    log::trace!("lua_channel_send (channel = {})", channel);
    let mut runtime = RUNTIME.lock().unwrap();
    if runtime.is_some() {
        let msg_json: serde_json::Value = lua.from_value(mlua::Value::Table(msg))?;
        return Ok(runtime
            .as_mut()
            .unwrap()
            .send_user_channel_message(channel.round() as u64, msg_json));
    }
    Err("invalid runtime".to_lua_err())
}

#[no_mangle]
pub fn lua_mission_end(_: &Lua, _: ()) -> LuaResult<()> {
    log::debug!("lua_mission_end()");
    let mut runtime = RUNTIME.lock().unwrap();
    if runtime.is_some() {
        runtime
            .as_mut()
            .unwrap()
            .dispatch_global_event(GlobalEvent::MissionEnd);
    }
    Ok(())
}

#[no_mangle]
pub fn lua_log(_: &Lua, err: String) -> LuaResult<()> {
    log::info!("[lua] {}", err);
    Ok(())
}

#[derive(Debug, Error)]
pub enum Error {
    #[error("Failed to deserialize params: {0}")]
    DeserializeParams(#[source] mlua::Error),
    #[error("Failed to deserialize result for method {method}: {err}\n{result}")]
    DeserializeResult {
        #[source]
        err: mlua::Error,
        method: String,
        result: String,
    },
    #[error("Failed to serialize params: {0}")]
    SerializeParams(#[source] mlua::Error),
}

#[mlua::lua_module]
pub fn dcs_ts(lua: &Lua) -> LuaResult<LuaTable> {
    log::info!("dcs_ts lua init called!");
    let exports = lua.create_table()?;
    exports.set("log", lua.create_function(lua_log)?)?;
    exports.set("initialize", lua.create_function(initialize)?)?;
    exports.set("mission_end", lua.create_function(lua_mission_end)?)?;
    exports.set("get_queued_tasks", lua.create_function(get_queued_tasks)?)?;
    exports.set("add_task_results", lua.create_function(add_task_results)?)?;
    exports.set("channel_send", lua.create_function(lua_channel_send)?)?;
    Ok(exports)
}
