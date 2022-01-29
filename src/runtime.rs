use std::{
    backtrace::Backtrace,
    borrow::Cow,
    cell::RefCell,
    collections::{HashMap, VecDeque},
    panic,
    path::PathBuf,
    rc::Rc,
    sync::Arc,
    thread,
};

use deno_core::{
    anyhow::Error,
    error::{generic_error, AnyError},
    op_async, op_sync, CompiledWasmModuleStore, Extension, FsModuleLoader, OpState, Resource,
    ResourceId,
};
use deno_runtime::{
    deno_broadcast_channel::InMemoryBroadcastChannel,
    deno_web::BlobStore,
    inspector_server::InspectorServer,
    permissions::Permissions,
    worker::{MainWorker, WorkerOptions},
    BootstrapOptions,
};
use either::Either;
use mlua::LuaSerdeExt;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tokio::{
    runtime,
    sync::{
        mpsc::{self, channel},
        oneshot::{self, Sender},
    },
    task,
    time::timeout,
};

use crate::RUNTIME;

fn get_error_class_name(e: &AnyError) -> &'static str {
    deno_runtime::errors::get_error_class_name(e).unwrap_or("Error")
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TaskRequest {
    pub target: String,
    pub args: Option<serde_json::Value>,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: u64,
    pub target: String,
    pub args: Option<serde_json::Value>,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TaskResult {
    pub id: u64,
    pub result: TaskResultValue,
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(tag = "type", content = "value")]
pub enum TaskResultValue {
    Ok(Option<serde_json::Value>),
    Error(String),
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
pub enum UserChannelDirection {
    ToLua = 1,
    FromLua = 2,
}

impl UserChannelDirection {
    fn from_u8(value: u8) -> Result<UserChannelDirection, Error> {
        match value {
            1 => Ok(UserChannelDirection::ToLua),
            2 => Ok(UserChannelDirection::FromLua),
            _ => Err(generic_error(format!(
                "unknown UserChannelDirection value {}",
                value
            ))),
        }
    }
}

pub struct UserChannel {
    side: Either<mpsc::Sender<serde_json::Value>, mpsc::Receiver<serde_json::Value>>,
}

#[derive(PartialEq, Debug)]
pub enum GlobalEvent {
    Loaded,
    MissionEnd,
    Reload,
}

pub struct Runtime {
    task_queue: VecDeque<Task>,
    task_waiters: HashMap<u64, Sender<TaskResultValue>>,
    user_channels: HashMap<u64, UserChannel>,
    id: u64,
    config: Option<Config>,
    global_events: Option<mpsc::Sender<GlobalEvent>>,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct Config {
    pub write_dir: Option<String>,
    pub sdk_path: Option<String>,
    pub development: bool,
    pub debugging: bool,
    pub scripts: Vec<String>,
    pub break_on_first_statement: Option<bool>,
}

impl Runtime {
    pub fn new(config: Config) -> Self {
        let task_queue = VecDeque::new();
        let task_waiters = HashMap::new();
        let user_channels = HashMap::new();
        Self {
            task_queue,
            task_waiters,
            user_channels,
            id: 0,
            config: Some(config),
            global_events: None,
        }
    }

    pub fn initialize(&mut self) {
        let config = self.config.clone().unwrap();

        thread::spawn(move || {
            let mut rt = runtime::Runtime::new().unwrap();
            let local = task::LocalSet::new();

            local.block_on(&mut rt, async move {
                let mut wait_for_init = false;

                loop {
                    let (tx, mut rx) = mpsc::channel(1);
                    {
                        let mut runtime = RUNTIME.lock().unwrap();
                        let rt = runtime.as_mut().unwrap();
                        rt.global_events = Some(tx);

                        // reset everything as its state is now invalid
                        rt.id = 0;
                        rt.user_channels.clear();
                        rt.task_waiters.clear();
                        rt.task_queue.clear();
                    }

                    if wait_for_init {
                        // wait for initialization event
                        let init_event = rx.recv().await.unwrap();
                        if init_event != GlobalEvent::Loaded {
                            log::error!(
                                "got unexpected event waiting for loaded: {:?}",
                                init_event
                            );
                            return;
                        }
                    }

                    let config_copy = config.clone();
                    match run(rx, config_copy).await {
                        Ok(should_reload) => {
                            wait_for_init = !should_reload;
                        }
                        Err(e) => {
                            log::error!("error running js runtime: {}", e);
                            return;
                        }
                    }
                }
            });
        });
    }

    pub fn dispatch_global_event(&mut self, event: GlobalEvent) -> bool {
        if let Some(tx) = &self.global_events {
            return tx.try_send(event).is_ok();
        }
        return false;
    }

    pub fn get_queued_tasks<'lua>(&mut self, lua: &'lua mlua::Lua) -> Option<mlua::Value<'lua>> {
        if self.task_queue.is_empty() {
            return None;
        }

        let tasks: Vec<Task> = self.task_queue.drain(..).collect();
        return Some(lua.to_value(&tasks).unwrap());
    }

    pub fn complete_task(&mut self, result: TaskResult) {
        log::debug!("complete_task({:?})", result);
        if let Some(tx) = self.task_waiters.remove(&result.id) {
            tx.send(result.result).unwrap();
        }
    }

    pub fn add_queued_task(&mut self, request: TaskRequest, waiter: Sender<TaskResultValue>) {
        log::debug!("add_queued_task({:?})", request);
        let id = self.id;
        self.id += 1;
        self.task_queue.push_back(Task {
            id,
            target: request.target,
            args: request.args,
        });
        self.task_waiters.insert(id, waiter);
    }

    pub fn add_user_channel(
        &mut self,
        side: Either<mpsc::Sender<serde_json::Value>, mpsc::Receiver<serde_json::Value>>,
    ) -> u64 {
        let id = self.id;
        self.id += 1;

        log::debug!("add_user_channel {}", id);
        self.user_channels.insert(id, UserChannel { side });
        return id;
    }

    pub fn send_user_channel_message(&mut self, id: u64, message: serde_json::Value) -> bool {
        if let Some(user_channel) = self.user_channels.get(&id) {
            if let Either::Left(tx) = &user_channel.side {
                return tx.try_send(message).is_ok();
            }
        }
        return false;
    }

    pub fn remove_user_channel(&mut self, id: u64) {
        self.user_channels.remove(&id);
    }
}

impl<'lua> mlua::FromLua<'lua> for Config {
    fn from_lua(lua_value: mlua::Value<'lua>, lua: &'lua mlua::Lua) -> mlua::Result<Self> {
        let config: Config = lua.from_value(lua_value)?;
        Ok(config)
    }
}

impl<'lua> mlua::FromLua<'lua> for TaskResult {
    fn from_lua(lua_value: mlua::Value<'lua>, lua: &'lua mlua::Lua) -> mlua::Result<Self> {
        let result: TaskResult = lua.from_value(lua_value)?;
        Ok(result)
    }
}

async fn op_dcs_run_queued_task(
    _state: Rc<RefCell<OpState>>,
    request: TaskRequest,
    _: (),
) -> Result<serde_json::Value, Error> {
    let (tx, rx) = oneshot::channel();
    {
        let mut runtime = RUNTIME.lock().unwrap();
        runtime.as_mut().unwrap().add_queued_task(request, tx);
    }

    match rx.await.unwrap() {
        TaskResultValue::Ok(value) => Ok(value.unwrap_or(json!(null))),
        TaskResultValue::Error(message) => Err(generic_error(message)),
    }
}

#[derive(Debug)]
pub struct UserChannelResource {
    id: u64,
    side: Rc<RefCell<Either<mpsc::Sender<serde_json::Value>, mpsc::Receiver<serde_json::Value>>>>,
}

impl Resource for UserChannelResource {
    fn name(&self) -> Cow<str> {
        "UserChannel".into()
    }

    fn close(self: Rc<Self>) {
        {
            let mut runtime = RUNTIME.lock().unwrap();
            runtime.as_mut().unwrap().remove_user_channel(self.id);
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UserChannelWait {
    channel: UserChannelHandle,
    timeout: Option<u64>,
}

async fn op_dcs_user_channel_wait(
    state: Rc<RefCell<OpState>>,
    user_channel_wait: UserChannelWait,
    _: (),
) -> Result<serde_json::Value, Error> {
    let user_channel = state
        .borrow()
        .resource_table
        .get::<UserChannelResource>(user_channel_wait.channel.resource_id)?;

    let mut side = user_channel.side.try_borrow_mut()?;
    match side.as_mut() {
        Either::Left(_) => Err(generic_error("cannot send on a receiver channel")),
        Either::Right(rx) => {
            let result = if let Some(to) = user_channel_wait.timeout {
                timeout(tokio::time::Duration::from_secs(to), rx.recv()).await?
            } else {
                rx.recv().await
            };
            return Ok(match result {
                Some(value) => value,
                None => json!(null),
            });
        }
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CreateUserChannel {
    pub direction: u8,
    pub capacity: usize,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UserChannelHandle {
    id: u64,
    resource_id: ResourceId,
}

fn op_dcs_create_user_channel(
    state: &mut OpState,
    args: CreateUserChannel,
    _: (),
) -> Result<UserChannelHandle, Error> {
    let (tx, rx) = channel::<serde_json::Value>(args.capacity);
    let direction = UserChannelDirection::from_u8(args.direction)?;
    let mut runtime = RUNTIME.lock().unwrap();

    // ToLua means our resource will be a Sender and our UserChannel will be a receiver
    let resource = if direction == UserChannelDirection::ToLua {
        let id = runtime
            .as_mut()
            .unwrap()
            .add_user_channel(Either::Right(rx));
        UserChannelResource {
            id,
            side: Rc::new(RefCell::new(Either::Left(tx))),
        }
    } else {
        let id = runtime.as_mut().unwrap().add_user_channel(Either::Left(tx));
        UserChannelResource {
            id,
            side: Rc::new(RefCell::new(Either::Right(rx))),
        }
    };

    let id = resource.id;
    let resource_id = state.resource_table.add(resource);
    return Ok(UserChannelHandle { id, resource_id });
}

fn trim_newline(s: &mut String) {
    if s.ends_with('\n') {
        s.pop();
        if s.ends_with('\r') {
            s.pop();
        }
    }
}

pub fn op_print(_state: &mut OpState, msg: String, is_err: bool) -> Result<(), Error> {
    let mut msg_clean = msg.clone();
    trim_newline(&mut msg_clean);
    if is_err {
        log::error!("[deno] {}", msg_clean);
    } else {
        log::info!("[deno] {}", msg_clean);
    }
    Ok(())
}

async fn run(mut rx: mpsc::Receiver<GlobalEvent>, config: Config) -> Result<bool, Error> {
    let mut data_dir = PathBuf::from(&config.write_dir.unwrap());
    data_dir.push("Data");

    let ext = Extension::builder()
        .middleware(|name, opfn| match name {
            "op_print" => op_sync(op_print),
            _ => opfn,
        })
        .ops(vec![
            (
                "op_dcs_print",
                op_sync(|_state, message: String, _: ()| {
                    log::info!("[deno] {}", message);
                    Ok(())
                }),
            ),
            ("op_dcs_run_queued_task", op_async(op_dcs_run_queued_task)),
            (
                "op_dcs_create_user_channel",
                op_sync(op_dcs_create_user_channel),
            ),
            (
                "op_dcs_user_channel_wait",
                op_async(op_dcs_user_channel_wait),
            ),
            (
                "op_dcs_reload",
                op_sync(|_: &mut OpState, _: (), _: ()| {
                    log::debug!("user requested reload");
                    let mut runtime = RUNTIME.lock().unwrap();
                    runtime
                        .as_mut()
                        .unwrap()
                        .dispatch_global_event(GlobalEvent::Reload);
                    Ok(())
                }),
            ),
        ])
        .build();

    let module_loader = Rc::new(FsModuleLoader);
    let create_web_worker_cb = Arc::new(|_| {
        todo!("no web workers");
    });

    let server = Arc::new(InspectorServer::new(
        "0.0.0.0:50009".parse().unwrap(),
        "DCSTS".to_string(),
    ));

    let options = WorkerOptions {
        bootstrap: BootstrapOptions {
            apply_source_maps: true,
            args: vec![],
            cpu_count: 1,
            debug_flag: true,
            enable_testing_features: false,
            location: None,
            no_color: true,
            runtime_version: "x".to_string(),
            ts_version: "x".to_string(),
            unstable: true,
        },
        extensions: vec![ext],
        unsafely_ignore_certificate_errors: None,
        root_cert_store: None,
        user_agent: "DCSTS".to_string(),
        seed: None,
        js_error_create_fn: None,
        create_web_worker_cb,
        // for some reason this doesn't work
        maybe_inspector_server: None,
        should_break_on_first_statement: config.break_on_first_statement.unwrap_or(false),
        module_loader,
        get_error_class_fn: Some(&get_error_class_name),
        origin_storage_dir: Some(data_dir.clone()),
        blob_store: BlobStore::default(),
        broadcast_channel: InMemoryBroadcastChannel::default(),
        shared_array_buffer_store: None,
        compiled_wasm_module_store: Some(CompiledWasmModuleStore::default()),
    };
    let permissions = Permissions::allow_all();

    let sdk_module = if let Some(sdk_path) = config.sdk_path {
        match deno_core::resolve_path(&sdk_path) {
            Ok(sdk_module) => sdk_module,
            Err(e) => {
                log::error!("error resolving sdk module: {:#?}", e);
                return Err(generic_error(e.to_string()));
            }
        }
    } else {
        deno_core::resolve_path("sdk.js").unwrap()
    };

    let mut worker = MainWorker::bootstrap_from_options(sdk_module.clone(), permissions, options);

    panic::set_hook(Box::new(|_panic_info| {
        let backtrace = Backtrace::force_capture();
        log::error!("panic: {}", backtrace);
    }));

    worker
        .execute_script(
            "<handler>",
            r#"
        Deno.core.setPromiseRejectCallback((type, promise, reason) => {
            if (type === 0 && reason !== undefined) {
                console.error("[Promise Rejected]", String(reason));
            }
        });
    "#,
        )
        .unwrap();

    let data_dir_script = format!(
        "window.dataDir = \"{}\";",
        data_dir
            .into_os_string()
            .into_string()
            .unwrap()
            .replace("\\", "\\\\")
    );
    worker
        .execute_script("<datadir>", &data_dir_script)
        .unwrap();

    if config.development {
        // manually register inspector and create a new session
        server.register_inspector(sdk_module.to_string(), &mut worker.js_runtime, false);
        worker.create_inspector_session().await;

        // make sure we stay alive even if our script doesn't do anything active
        worker
            .execute_script("<alive>", "setInterval(() => {}, 600000);")
            .unwrap();
    }

    if sdk_module.path() != "file:///sdk.js" {
        worker.execute_main_module(&sdk_module).await?;
    }

    let modules =
        config
            .scripts
            .iter()
            .map(|script_path| match deno_core::resolve_path(&script_path) {
                Ok(main_module) => Some(main_module),
                Err(e) => {
                    log::error!("error resolving script path: {:#?} ({})", e, script_path);
                    return None;
                }
            });

    for maybe_module in modules {
        if let Some(module) = maybe_module {
            worker.execute_side_module(&module).await?;
        }
    }

    worker.dispatch_load_event("")?;

    loop {
        tokio::select! {
            result = worker.run_event_loop(true) => {
                match result {
                    Ok(_) => {
                        log::info!("done running js loop");
                        return Ok(false);
                    }
                    Err(error) => {
                        log::error!("error running js loop: {}", error);
                        return Err(error);
                    }
                }
            }
            event = rx.recv() => {
                worker.dispatch_unload_event("")?;

                if event.is_none() {
                    return Err(generic_error("global events channel was closed"));
                }

                match event.unwrap() {
                    GlobalEvent::Loaded => {
                        return Err(generic_error("unexpected Loaded event"));
                    }
                    GlobalEvent::MissionEnd => {
                        worker.execute_script("<global>", "dispatchEvent(new CustomEvent('missionEnd'))")?;
                        return Ok(false);
                    }
                    GlobalEvent::Reload => {
                        return Ok(true);
                    }
                }
            }
        }
    }
}
