import {
  ObjectRef,
  Position,
  RadioModulation,
  SomeObject,
  Vec3,
} from "./common.ts";
import { runTask } from "./runtime.ts";

export type Task = {};

export namespace Callsign {
  export type Type = Aircraft | A10 | AWACS | Tanker | JTAC;

  export enum Aircraft {
    ENFIELD = 1,
    SPRINGFIELD = 2,
    UZI = 3,
    COLT = 4,
    DODGE = 5,
    FORD = 6,
    CHEVY = 7,
    PONTIAC = 8,
  }

  export enum A10 {
    HAWG = 9,
    BOAR = 10,
    PIG = 11,
    TUSK = 12,
  }

  export enum AWACS {
    OVERLORD = 1,
    MAGIC = 2,
    WIZARD = 3,
    FOCUS = 4,
    DARKSTAR = 5,
  }

  export enum Tanker {
    TEXACO = 1,
    ARCO = 2,
    SHELL = 3,
  }

  export enum JTAC {
    AXEMAN = 1,
    DARKNIGHT = 2,
    WARRIOR = 3,
    POINTER = 4,
    EYEBALL = 5,
    MOONBEAM = 6,
    WHIPLASH = 7,
    FINGER = 8,
    PINPOINT = 9,
    FERRET = 10,
    SHABA = 11,
    PLAYBOY = 12,
    HAMMER = 13,
    JAGUAR = 14,
    DEATHSTAR = 15,
    ANVIL = 16,
    FIREFLY = 17,
    MANTIS = 18,
    BADGER = 19,
  }
}

export namespace AICommand {
  export type ActivateBeacon = {
    id: "ActivateBeacon";
    params: {
      type: BeaconType;
      system: SystemType;
      callsign: string;
      frequency: number;
      name?: string;
    };
  };

  export type DeactivateBeacon = {
    id: "DeactivateBeacon";
  };

  export type EPLRS = {
    id: "EPLRS";
    params: {
      value: boolean;
      groupId?: number;
    };
  };

  export type Script = {
    id: "Script";
    params: {
      command: string;
    };
  };

  export type SetCallsign = {
    id: "SetCallsign";
    params: {
      callname: Callsign.Type;
      number: number;
    };
  };

  export type SetFrequency = {
    id: "SetFrequency";
    params: {
      frequence: number;
      modulation: RadioModulation;
    };
  };

  export type SetImmortal = {
    id: "SetImmortal";
    params: {
      value: boolean;
    };
  };

  export type SetInvisible = {
    id: "SetInvisible";
    params: {
      value: boolean;
    };
  };

  export type Start = {
    id: "Start";
  };

  export type StopRoute = {
    id: "StopRoute";
    params: {
      value: boolean;
    };
  };

  export type SwitchAction = {
    id: "SwitchAction";
    params: {
      actionIndex: number;
    };
  };

  export type SwitchWaypoint = {
    id: "SwitchWaypoint";
    params: {
      fromWaypointIndex: number;
      goToWaypointIndex: number;
    };
  };

  export type TransmitMessage = {
    id: "TransmitMessage";
    params: {
      file: string;
      duration?: number;
      subtitle?: string;
      loop?: boolean;
    };
  };

  export type StopTransmission = {
    id: "stopTransmission"; // lol this one is lower case...
  };

  export type ToggleSmoke = {
    id: "SMOKE_ON_OFF"; // and fuck it this one is snake case ???
    params: {
      value: boolean;
    };
  };

  export type Type =
    | ActivateBeacon
    | DeactivateBeacon
    | EPLRS
    | Script
    | SetCallsign
    | SetFrequency
    | SetImmortal
    | SetInvisible
    | Start
    | StopRoute
    | SwitchAction
    | SwitchWaypoint
    | TransmitMessage
    | StopTransmission
    | ToggleSmoke;
}

export type DetectedTarget = {
  object: SomeObject;
  visible: boolean;
  type: boolean;
  distance: boolean;
};

export enum SystemType {
  PAR_10 = 1,
  RSBN_5 = 2,
  TACAN = 3,
  TACAN_TANKER = 4,
  ILS_LOCALIZER = 5,
  ILS_GLIDESLOPE = 6,
  BROADCAST_STATION = 7,
}

export enum BeaconType {
  NULL = 0,
  VOR = 1,
  DME = 2,
  VOR_DME = 3,
  TACAN = 4,
  VORTAC = 5,
  RSBN = 32,
  BROADCAST_STATION = 1024,
  HOMER = 8,
  AIRPORT_HOMER = 4104,
  AIRPORT_HOMER_WITH_MARKER = 4136,
  ILS_FAR_HOMER = 16408,
  ILS_NEAR_HOMER = 16456,
  ILS_LOCALIZER = 16640,
  ILS_GLIDESLOPE = 16896,
  NAUTICAL_HOMER = 32776,
}

export enum Detection {
  VISUAL = 1,
  OPTIC = 2,
  RADAR = 4,
  IRST = 8,
  RWR = 16,
  DLINK = 32,
}

export enum AirOption {
  ROE = 0,
  REACTION_ON_THREAT = 1,
  RADAR_USING = 3,
  FLARE_USING = 4,
  Formation = 5,
  RTB_ON_BINGO = 6,
  SILENCE = 7,
  RTB_ON_OUT_OF_AMMO = 10,
  ECM_USING = 13,
  PROHIBIT_AA = 14,
  PROHIBIT_JETT = 15,
  PROHIBIT_AB = 16,
  PROHIBIT_AG = 17,
  MISSILE_ATTACK = 18,
  PROHIBIT_WP_PASS_REPORT = 19,
  RADIO_USAGE_CONTACT = 21,
  RADIO_USAGE_ENGAGE = 22,
  RADIO_USAGE_KILL = 23,
  JETT_TANKS_IF_EMPTY = 25,
  FORCED_ATTACK = 26,
}

export enum GroundOption {
  ROE = 0,
  FORMATION = 5,
  DISPERSE_ON_ATTACK = 8,
  ALARM_STATE = 9,
  ENGAGE_AIR_WEAPONS = 20,
  AC_ENGAGEMENT_RANGE_RESTRICTION = 24,
  RESTRICT_AAA_MIN = 27,
  RESTRICT_TARGETS = 28,
  RESTRICT_AAA_MAX = 29,
}

export enum NavalOption {
  ROE = 0,
}

export enum ROE {
  OPEN_FIRE = 2,
  RETURN_FIRE = 3,
  WEAPON_HOLD = 4,
}

export enum AirROE {
  WEAPON_FREE = 0,
  OPEN_FIRE_WEAPON_FREE = 1,
  OPEN_FIRE = 2,
  RETURN_FIRE = 3,
  WEAPON_HOLD = 4,
}

export enum ReactionOnThreat {
  NO_REACTION = 0,
  PASSIVE_DEFENCE = 1,
  EVADE_FIRE = 2,
  BYPASS_AND_ESCAPE = 3,
  ALLOW_ABORT_MISSION = 4,
}

export enum RadarUsing {
  NEVER = 0,
  FOR_ATTACK_ONLY = 1,
  FOR_SEARCH_IF_REQUIRED = 2,
  FOR_CONTINUOUS_SEARCH = 3,
}

export enum FlareUsing {
  NEVER = 0,
  AGAINST_FIRED_MISSILE = 1,
  WHEN_FLYING_IN_SAM_WEZ = 2,
  WHEN_FLYING_NEAR_ENEMIES = 3,
}

export enum ECMUsing {
  NEVER_USE = 0,
  USE_IF_ONLY_LOCK_BY_RADAR = 1,
  USE_IF_DETECTED_LOCK_BY_RADAR = 2,
  ALWAYS_USE = 3,
}

export enum MissileAttack {
  MAX_RANGE = 0,
  NEZ_RANGE = 1,
  HALF_WAY_RMAX_NEZ = 2,
  TARGET_THREAT_EST = 3,
  RANDOM_RANGE = 4,
}

export enum AlarmState {
  AUTO = 0,
  GREEN = 1,
  RED = 2,
}

type Option = AirOption | GroundOption | NavalOption;

export type UnitOrGroup = (
  { unit: string } | { group: string }
);

export function setTask(controller: UnitOrGroup, task: Task): Promise<void> {
  return runTask("controllerSetTask", { controller, task });
}

export function pushTask(controller: UnitOrGroup, task: Task): Promise<void> {
  return runTask("controllerPushTask", { controller, task });
}

export function resetTask(controller: UnitOrGroup): Promise<void> {
  return runTask("controllerResetTask", { controller });
}

export function popTask(controller: UnitOrGroup): Promise<void> {
  return runTask("controllerPopTask", { controller });
}

export function hasTask(controller: UnitOrGroup): Promise<boolean> {
  return runTask<boolean>("controllerHasTask", { controller });
}

export function setCommand(
  controller: UnitOrGroup,
  command: AICommand.Type,
): Promise<boolean> {
  return runTask<boolean>("controllerSetCommand", { controller, command });
}

export function setOption(
  controller: UnitOrGroup,
  option: GroundOption.ROE | NavalOption.ROE,
  value: ROE,
): Promise<void>;
export function setOption(
  controller: UnitOrGroup,
  option: GroundOption.ALARM_STATE,
  value: AlarmState,
): Promise<void>;
export function setOption(
  controller: UnitOrGroup,
  option: AirOption.ROE,
  value: AirROE,
): Promise<void>;
export function setOption(
  controller: UnitOrGroup,
  option: AirOption.REACTION_ON_THREAT,
  value: ReactionOnThreat,
): Promise<void>;
export function setOption(
  controller: UnitOrGroup,
  option: AirOption.RADAR_USING,
  value: RadarUsing,
): Promise<void>;
export function setOption(
  controller: UnitOrGroup,
  option: AirOption.FLARE_USING,
  value: FlareUsing,
): Promise<void>;
export function setOption(
  controller: UnitOrGroup,
  option: AirOption.FLARE_USING,
  value: FlareUsing,
): Promise<void>;
export function setOption(
  controller: UnitOrGroup,
  option: AirOption.ECM_USING,
  value: ECMUsing,
): Promise<void>;
export function setOption(
  controller: UnitOrGroup,
  option: AirOption.MISSILE_ATTACK,
  value: ECMUsing,
): Promise<void>;
export function setOption(
  controller: UnitOrGroup,
  option: Option,
  value: number,
): Promise<void> {
  return runTask("controllerSetOption", { controller, option, value });
}

export function setEnabled(
  controller: UnitOrGroup,
  value: boolean,
): Promise<void> {
  return runTask("controllerSetOnOff", { controller, value });
}

export function addDetectedTarget(
  controller: UnitOrGroup,
  target: UnitOrGroup,
  typeKnown?: boolean,
  distanceKnown?: boolean,
): Promise<void> {
  return runTask("controllerKnowTarget", {
    controller,
    target,
    typeKnown,
    distanceKnown,
  });
}

export type DetectedTargetDetails = {
  lastTime: number;
  lastPos: Position;
  lastVel: Vec3;
};
export function isTargetDetected(
  controller: UnitOrGroup,
  target: ObjectRef,
  ...args: Array<Detection>
): Promise<(DetectedTarget & DetectedTargetDetails) | null> {
  return runTask<(DetectedTarget & DetectedTargetDetails) | null>(
    "controllerIsTargetDetected",
    {
      controller,
      target,
      args,
    },
  );
}

export function getDetectedTargets(
  controller: UnitOrGroup,
  ...args: Array<Detection>
): Promise<Array<DetectedTarget>> {
  return runTask<Array<DetectedTarget>>("controllerGetDetectedTargets", {
    controller,
    args,
  });
}
