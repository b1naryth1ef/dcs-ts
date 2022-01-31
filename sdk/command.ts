import {
  ChannelDirection,
  ChannelHandle,
  createChannel,
  runTask,
  waitChannel,
} from "./runtime.ts";
import { GroupOrCoalition } from "./common.ts";

export type CommandHandle = {
  path: [string, ...string[]];
  target?: GroupOrCoalition;
};

export function addCommand(
  path: [string, ...string[]],
  channel: ChannelHandle,
  target?: GroupOrCoalition,
): Promise<CommandHandle> {
  return runTask("missionCommandsAddCommand", {
    name: path[path.length - 1],
    path: path.length > 1 ? path.slice(0, path.length - 1) : undefined,
    target,
    channel,
  });
}

export function addSubMenu(
  path: [string, ...string[]],
  target?: GroupOrCoalition,
): Promise<CommandHandle> {
  return runTask("missionCommandsAddSubMenu", {
    name: path[path.length - 1],
    path: path.length > 1 ? path.slice(0, path.length - 1) : undefined,
    target,
  });
}

export function removeItem(
  path: [string, ...string[]] | CommandHandle,
  target?: GroupOrCoalition,
): Promise<void> {
  if (!Array.isArray(path)) {
    target = path.target;
    path = path.path;
  }

  return runTask("missionCommandsRemove", {
    path,
    target,
  });
}

export type CommandPath = [string, ...string[]];

export const commandPathToString = (path: CommandPath) => {
  return path.join(".");
};

export type CommandEvent = {
  path: [string, ...string[]];
  target?: GroupOrCoalition;
};

export class CommandManager {
  commands: Map<string, (e: CommandEvent) => unknown> = new Map();
  private channel: ChannelHandle;

  constructor(autoStartStream: boolean = true) {
    this.channel = createChannel(ChannelDirection.FROM_LUA);
    if (autoStartStream) {
      this.stream();
    }
  }

  async stream() {
    for await (const event of this.streamCommandEvents()) {
      const fn = this.commands.get(commandPathToString(event.path));
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
    nameOrPath: string | [string, ...string[]],
    fn: (e: CommandEvent) => unknown,
    target?: GroupOrCoalition,
  ): Promise<CommandHandle> {
    const handle = await addCommand(
      typeof nameOrPath === "string" ? [nameOrPath] : nameOrPath,
      this.channel,
      target,
    );
    this.commands.set(commandPathToString(handle.path), fn);
    return handle;
  }

  async remove(
    handle: CommandHandle,
  ) {
    this.commands.delete(commandPathToString(handle.path));
    await removeItem(handle);
  }
}

export type GroupCommandEvent = CommandEvent & {
  target: { group: string };
};

type GroupCommandHandler = (e: GroupCommandEvent) => Promise<void>;

type GroupCommand = {
  path: [string, ...string[]];
  handler?: GroupCommandHandler;
};

export class GroupCommandSet {
  private groups: Set<string> = new Set();
  private commands: Map<string, GroupCommand> = new Map();
  private channel: ChannelHandle = createChannel(ChannelDirection.FROM_LUA);

  constructor() {
    this.run();
  }

  private async run() {
    while (true) {
      const event = await waitChannel<CommandEvent>(this.channel);
      const command = this.commands.get(commandPathToString(event.path));
      if (command === undefined) {
        console.error(
          `[GroupCommandSet] event references un-registered command ${event.path}`,
        );
        continue;
      }

      if (command.handler) command.handler(event as GroupCommandEvent);
    }
  }

  async addCommand(
    path: [string, ...string[]],
    handler?: GroupCommandHandler,
  ): Promise<string> {
    const id = commandPathToString(path);
    if (this.commands.has(id)) {
      throw new Error(
        `addCommand called for command that already exists (${path})`,
      );
    }

    this.commands.set(id, {
      path,
      handler,
    });

    await Promise.all(
      Array.from(this.groups).map((group) => {
        if (handler !== undefined) {
          return addCommand(path, this.channel, { group });
        } else {
          return addSubMenu(path, { group });
        }
      }),
    );

    return id;
  }

  async removeCommand(target: string): Promise<void> {
    const command = this.commands.get(target);
    if (command === undefined) {
      throw new Error(
        `removeCommand called for command that has already been removed (${target})`,
      );
    }

    this.commands.delete(target);
    await Promise.all(
      Array.from(this.groups).map((group) => {
        return removeItem(command.path, { group });
      }),
    );
  }

  async addGroup(group: string): Promise<void> {
    if (this.groups.has(group)) {
      return;
    }

    this.groups.add(group);
    await Promise.all(
      Array.from(this.commands.values()).sort((a, b) => {
        if (a.handler === undefined && b.handler === undefined) {
          return 0;
        } else if (a.handler === undefined) {
          return -1;
        } else if (b.handler === undefined) {
          return 1;
        }

        return 0;
      }).map((command) => {
        if (command.handler !== undefined) {
          addCommand(command.path, this.channel, { group });
        } else {
          addSubMenu(command.path, { group });
        }
      }),
    );
  }

  async removeGroup(group: string): Promise<void> {
    if (!this.groups.has(group)) {
      return;
    }

    this.groups.delete(group);
    await Promise.all(
      Array.from(this.commands.values()).map((command) => {
        if (command.handler !== undefined) {
          removeItem(command.path);
        }
      }),
    );
  }
}
