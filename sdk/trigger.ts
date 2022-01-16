import {
  Country,
  GroupOrCoalition,
  Position,
  RadioModulation,
  Unit,
} from "./common.ts";
import { runTask } from "./runtime.ts";

type GroupOrCoalitionOrCountry = GroupOrCoalition | { country: Country };

export function outText(
  text: string,
  displayTime = 10,
  clearView = false,
  target?: GroupOrCoalitionOrCountry,
): Promise<void> {
  return runTask("triggerActionOutText", {
    text,
    displayTime,
    clearView,
    target,
  });
}

export function setUnitInternalCargo(
  unit: Unit | string | { unit: Unit },
  mass: number,
): Promise<void> {
  let name = unit;
  if (typeof unit === "object") {
    if ("unit" in unit) {
      name = unit.unit.name;
    } else {
      name = unit.name;
    }
  }
  return runTask("triggerActionSetUnitInternalCargo", {
    name,
    mass,
  });
}

export function stopRadioTransmission(name: string): Promise<void> {
  return runTask("triggerActionStopRadioTransmission", { name });
}

export function startRadioTransmission(
  filename: string,
  position: Position,
  modulation: RadioModulation,
  loop: boolean,
  frequency: number,
  power: number,
  name?: string,
): Promise<void> {
  return runTask("triggerActionRadioTransmission", {
    filename,
    position,
    modulation,
    loop,
    frequency,
    power,
    name,
  });
}

export enum FlareColor {
  GREEN = 0,
  RED = 1,
  WHITE = 2,
  YELLOW = 3,
}

export function signalFlare(
  position: Position,
  color: FlareColor,
  azimuth: number,
): Promise<void> {
  return runTask("triggerActionSignalFlare", {
    position,
    color,
    azimuth,
  });
}

export function illuminationBomb(
  position: Position,
  power: number,
): Promise<void> {
  return runTask("triggerActionIlluminationBomb", {
    position,
    power,
  });
}

export enum BigSmokeType {
  SMALL_SMOKE_AND_FIRE = 1,
  MEDIUM_SMOKE_AND_FIRE = 2,
  LARGE_SMOKE_AND_FIRE = 3,
  HUGE_SMOKE_AND_FIRE = 4,
  SMALL_SMOKE = 5,
  MEDIUM_SMOKE = 6,
  LARGE_SMOKE = 7,
  HUGE_SMOKE = 8,
}

export function bigSmoke(
  type: BigSmokeType,
  position: Position,
  density: number,
  name?: string,
): Promise<void> {
  return runTask("triggerActionEffectSmokeBig", {
    type,
    position,
    density,
    name,
  });
}

export enum SmokeColor {
  GREEN = 0,
  RED = 1,
  WHITE = 2,
  ORANGE = 3,
  BLUE = 4,
}

export function smoke(
  position: Position,
  color: SmokeColor,
): Promise<void> {
  return runTask("triggerActionSmoke", {
    position,
    color,
  });
}

export function explosion(
  position: Position,
  power: number,
): Promise<void> {
  return runTask("triggerActionExplosion", {
    position,
    power,
  });
}

export type TriggerZone = {
  position: Position;
  radius: number;
};

export function getZone(
  name: string,
): Promise<TriggerZone> {
  return runTask<TriggerZone>("triggerActionGetZone", {
    name,
  });
}

export enum SmokeTrailColor {
  DISABLE = 0,
  GREEN = 1,
  RED = 2,
  WHITE = 3,
  ORANGE = 4,
  BLUE = 5,
}

export function smokeTrail(
  unit: Unit | string | { unit: Unit },
  color: SmokeTrailColor,
  altitude?: number,
): Promise<void> {
  let name = unit;
  if (typeof unit === "object") {
    if ("unit" in unit) {
      name = unit.unit.name;
    } else {
      name = unit.name;
    }
  }
  return runTask("triggerActionSmokeTrail", {
    name,
    color,
    altitude,
  });
}

export function outSound(
  name: string,
  target?: GroupOrCoalitionOrCountry,
): Promise<void> {
  return runTask("triggerActionOutSound", {
    name,
    target,
  });
}

export function createMark(
  id: number,
  text: string,
  position: Position,
  args?: {
    readOnly?: boolean;
    message?: string;
    target?: GroupOrCoalition;
  },
) {
  return runTask("triggerActionMarkToAll", {
    id,
    text,
    position,
    readOnly: args?.readOnly === undefined ? false : args.readOnly,
    message: args?.message,
    target: args?.target,
  });
}

export function removeMark(id: number) {
  return runTask("triggerActionRemoveMark", {
    id,
  });
}
