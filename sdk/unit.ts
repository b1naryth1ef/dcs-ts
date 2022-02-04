import { SomeObject, Unit } from "./common.ts";
import {
  ChannelDirection,
  ChannelHandle,
  createChannel,
  runTask,
  waitChannel,
} from "./runtime.ts";

export type UnitLife = {
  current: number;
  initial: number;
};

export type Ammo = {
  count: number;
  desc: Record<string, unknown>;
};
export type UnitAmmo = Record<number, Ammo>;

export type UnitRadar = {
  active: boolean;
  target: SomeObject;
};

export function getUnit(name: Unit | string): Promise<Unit> {
  if (typeof name === "object") {
    name = name.name;
  }
  return runTask<Unit>("unitGetByName", { name });
}

/**
 * UnitView provides object-based access to a units properties and functions for
 * ease of use.
 */
export class UnitView {
  public name: string;

  constructor(data: Unit | string) {
    if (typeof data === "string") {
      this.name = data;
    } else {
      this.name = data.name;
    }
  }

  get(): Promise<Unit> {
    return runTask<Unit>("unitGetByName", { name: this.name });
  }

  isActive(): Promise<boolean> {
    return runTask<boolean>("unitGetIsActive", { name: this.name });
  }

  getLife(): Promise<UnitLife> {
    return runTask<UnitLife>("unitGetLife", { name: this.name });
  }

  getAmmo(): Promise<UnitAmmo> {
    return runTask<UnitAmmo>("unitGetAmmo", { name: this.name });
  }

  getSensors(): Promise<Record<number, unknown>> {
    return runTask<Record<number, unknown>>("unitGetSensors", {
      name: this.name,
    });
  }

  getRadar(): Promise<UnitRadar> {
    return runTask<UnitRadar>("unitGetRadar", {
      name: this.name,
    });
  }

  getFuel(): Promise<number> {
    return runTask<number>("unitGetFuel", { name: this.name });
  }

  getDrawArgumentValue(arg: number): Promise<number> {
    return runTask<number>("unitGetDrawArgumentValue", {
      name: this.name,
      arg,
    });
  }

  setEmission(value: boolean): Promise<void> {
    return runTask<void>("unitSetEmission", {
      name: this.name,
      value,
    });
  }
}

export function isActive(name: string): Promise<boolean> {
  return runTask<boolean>("unitGetIsActive", { name });
}

export function getLife(name: string): Promise<UnitLife> {
  return runTask<UnitLife>("unitGetLife", { name });
}

export function getAmmo(name: string): Promise<UnitAmmo> {
  return runTask<UnitAmmo>("unitGetAmmo", { name });
}

export function getSensors(name: string): Promise<Record<number, unknown>> {
  return runTask<Record<number, unknown>>("unitGetSensors", {
    name: name,
  });
}

export function getRadar(name: string): Promise<UnitRadar> {
  return runTask<UnitRadar>("unitGetRadar", {
    name: name,
  });
}

export function getFuel(name: string): Promise<number> {
  return runTask<number>("unitGetFuel", { name });
}

export function getDrawArgumentValue(
  name: string,
  arg: number,
): Promise<number> {
  return runTask<number>("unitGetDrawArgumentValue", {
    name,
    arg,
  });
}

export function setEmission(name: string, value: boolean): Promise<void> {
  return runTask<void>("unitSetEmission", {
    name,
    value,
  });
}

export type UnitWatcherUpdate = {
  updated?: Array<Unit>;
  removed?: Array<string>;
};

export interface UnitWatcherOptions {
  extra?: Record<"life" | "ammo" | "radar" | "fuel", boolean>;
}

/**
 * UnitWatcher watches a set of units, streaming updates and removals on a configurable
 * interval. This stream of events can be processed manually or piped directly into
 * a map.
 */
export class UnitWatcher {
  constructor(private id: number, private channel: ChannelHandle) {}

  static async create(
    updateIntervalSeconds = 1,
    opts: UnitWatcherOptions = {},
  ): Promise<UnitWatcher> {
    const channel = createChannel(ChannelDirection.FROM_LUA);
    const id = await runTask<number>("unitWatcherCreate", {
      updateIntervalSeconds,
      channel,
      opts,
    });
    return new UnitWatcher(id, channel);
  }

  async *streamUpdates() {
    while (true) {
      yield await waitChannel<UnitWatcherUpdate>(this.channel);
    }
  }

  async *streamUnits() {
    while (true) {
      for await (const update of this.streamUpdates()) {
        if (update.updated !== undefined) {
          for (const unit of update.updated) {
            yield unit;
          }
        }
        if (update.removed !== undefined) {
          for (const unitName of update.removed) {
            yield unitName;
          }
        }
      }
    }
  }

  async streamInto(units: Map<string, Unit | null>, keepRemoved = false) {
    for await (const update of this.streamUpdates()) {
      if (update.updated !== undefined) {
        for (const unit of update.updated) {
          units.set(unit.name, unit);
        }
      }
      if (update.removed !== undefined) {
        for (const unitName of update.removed) {
          if (keepRemoved) {
            units.set(unitName, null);
          } else {
            units.delete(unitName);
          }
        }
      }
    }
  }

  async add(name: string | Array<string>): Promise<boolean> {
    const names = typeof name === "string" ? [name] : name;
    return await runTask("unitWatcherAdd", { id: this.id, names });
  }

  async remove(name: string | Array<string>): Promise<boolean> {
    const names = typeof name === "string" ? [name] : name;
    return await runTask("unitWatcherRemove", { id: this.id, names });
  }
}
