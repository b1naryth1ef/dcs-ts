import {
  ChannelDirection,
  ChannelHandle,
  createChannel,
  runTask,
  waitChannel,
} from "./runtime.ts";
import { GroupOrCoalition } from "./common.ts";

export type CommandHandle = {
  id: number;
  path: Array<string>;
  target?: GroupOrCoalition;
};

export function add(
  name: string,
  channel: ChannelHandle,
  path?: Array<string>,
  target?: GroupOrCoalition,
): Promise<CommandHandle> {
  return runTask("missionCommandsAddCommand", {
    name,
    channel,
    path,
    target,
  });
}

export function addSubMenu(
  path: [string, ...string[]],
  target?: GroupOrCoalition,
): Promise<{ path: Array<string> }> {
  return runTask("missionCommandsAddSubMenu", {
    name: path[path.length - 1],
    path: path.length > 1 ? path.slice(0, path.length - 1) : null,
    target,
  });
}

export function remove(
  path: Array<string> | CommandHandle,
  target?: GroupOrCoalition,
): Promise<void> {
  if ("id" in path) {
    target = path.target;
    path = path.path;
  }

  return runTask("missionCommandsRemove", {
    path,
    target,
  });
}

export type CommandEvent = {
  id: number;
};

export class CommandManager {
  commands: Map<number, (e: CommandEvent) => unknown> = new Map();
  private channel: ChannelHandle;

  constructor(autoStartStream: boolean = true) {
    this.channel = createChannel(ChannelDirection.FROM_LUA);
    if (autoStartStream) {
      this.stream();
    }
  }

  async stream() {
    for await (const event of this.streamCommandEvents()) {
      const fn = this.commands.get(event.id);
      if (fn !== undefined) {
        fn(event);
      }
    }
  }

  private async *streamCommandEvents() {
    while (true) {
      yield await waitChannel<CommandEvent>(this.channel);
    }
  }

  async add(
    nameOrPath: string | Array<string>,
    fn: (e: CommandEvent) => unknown,
    target?: GroupOrCoalition,
  ): Promise<CommandHandle> {
    let name = "";
    let path: Array<string> = [];
    if (typeof nameOrPath !== "string") {
      if (nameOrPath.length <= 1) {
        name = name[0];
      } else {
        name = nameOrPath[nameOrPath.length - 1];
        path = nameOrPath.slice(0, nameOrPath.length - 1);
      }
    } else {
      name = nameOrPath;
    }

    const handle = await add(name, this.channel, path, target);
    this.commands.set(handle.id, fn);
    return handle;
  }

  async remove(
    handle: CommandHandle,
  ) {
    this.commands.delete(handle.id);
    await remove(handle);
  }
}
