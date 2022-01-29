const DenoCore = (Deno as any).core;

let monitorTaskPerformanceEnabled = false;

/**
 * Set whether to measure and print task performance monitoring information for
 * task calls.
 */
export function setMonitorTaskPerformance(value: boolean) {
  monitorTaskPerformanceEnabled = value;
}

/**
 * Executes a Lua function exported from within the support scripts. This is the
 * primary way to interact with the mission scripting environment.
 *
 * @param target - the target function name to call.
 * @param args - argument payload for the function.
 * @returns the result of the function call.
 */
export async function runTask<T>(target: string, args?: any): Promise<T> {
  if (monitorTaskPerformanceEnabled) {
    performance.mark("start");
  }
  try {
    return await DenoCore.opAsync("op_dcs_run_queued_task", {
      target,
      args,
    }) as T;
  } finally {
    if (monitorTaskPerformanceEnabled) {
      performance.mark("end");
      const duration =
        performance.measure("start -> end", "start", "end").duration;
      console.log(`[task] ${target} took ${duration}ms`);
    }
  }
}

/**
 * Run Lua code directly within the mission scripting environment. This is intended
 * for debugging purposes and should probably not be used for anything else.
 */
export async function luaEval(code: string): Promise<unknown> {
  return await runTask<unknown>("eval", {
    code,
  });
}

/**
 * Creates a new event producer which will send all mission events matching the
 * provided list of event ids into a channel.
 *
 * @param channel - the channel events will be sent to.
 * @param events - an optional array of event ids which will be used to filter sent
 * events.
 */
export async function createEventProducer(
  channel: ChannelHandle,
  events?: Array<number>,
) {
  return await runTask("createEventProducer", {
    channel,
    events,
  });
}

export enum ChannelDirection {
  TO_LUA = 1,
  FROM_LUA = 2,
}

export type ChannelHandle = {
  id: number;
  resourceId: number;
};

/**
 * Creates a new communication channel with the specified direction. Channels
 * are uni-directional pipes that are used to communicate between the TypeScript
 * runtime and Lua.
 *
 * @param direction - which way messages in this channel will flow
 * @param capacity - the capacity of this channel, overflowing this capacity
 *   will cause messages to be dropped, and in most cases the channel to be closed.
 */
export function createChannel(
  direction: ChannelDirection,
  capacity: number = 32,
): ChannelHandle {
  return DenoCore.opSync("op_dcs_create_user_channel", {
    direction,
    capacity,
  });
}

/**
 * Waits for a message to arrive on a channel opened with ChannelDirection.FROM_LUA.
 *
 * @param channel - the channel to wait on
 */
export async function waitChannel<T = unknown>(
  channel: ChannelHandle,
): Promise<T>;
export async function waitChannel<T = unknown>(
  channel: ChannelHandle,
  timeout?: number,
): Promise<T | null> {
  return await DenoCore.opAsync("op_dcs_user_channel_wait", {
    channel,
    timeout,
  });
}

/**
 * Sends a message on a channel opened with ChannelDirection.TO_LUA.
 *
 * @param channel - the destination channel
 * @param value - the message value
 */
export async function sendChannel(
  channel: ChannelHandle,
  value: unknown,
): Promise<void> {
  return await DenoCore.opAsync("op_dcs_user_channel_send", {
    channel,
    value,
  });
}

/**
 * Reload the TypeScript runtime.
 */
export function reload() {
  DenoCore.opSync("op_dcs_reload");
}

(window as any).reload = reload;
(window as any).runTask = runTask;
(window as any).luaEval = luaEval;
