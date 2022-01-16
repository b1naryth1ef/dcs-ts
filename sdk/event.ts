import {
  ChannelDirection,
  createChannel,
  createEventProducer,
  waitChannel,
} from "./runtime.ts";
import { Airbase, MarkPanel, SomeObject, Unit, Weapon } from "./common.ts";

export enum EventType {
  INVALID = 0,
  SHOT = 1,
  HIT = 2,
  TAKEOFF = 3,
  LAND = 4,
  CRASH = 5,
  EJECTION = 6,
  REFUELING = 7,
  DEAD = 8,
  PILOT_DEAD = 9,
  BASE_CAPTURED = 10,
  MISSION_START = 11,
  MISSION_END = 12,
  TOOK_CONTROL = 13,
  REFUELING_STOP = 14,
  BIRTH = 15,
  HUMAN_FAILURE = 16,
  DETAILED_FAILURE = 17,
  ENGINE_STARTUP = 18,
  ENGINE_SHUTDOWN = 19,
  PLAYER_ENTER_UNIT = 20,
  PLAYER_LEAVE_UNIT = 21,
  PLAYER_COMMENT = 22,
  SHOOTING_START = 23,
  SHOOTING_END = 24,
  MARK_ADDED = 25,
  MARK_CHANGE = 26,
  MARK_REMOVED = 27,
  KILL = 28,
  SCORE = 29,
  UNIT_LOST = 30,
  LANDING_AFTER_EJECTION = 31,
  PARATROOPER_LENDING = 32,
  DISCARD_CHAIR_AFTER_EJECTION = 33,
  WEAPON_ADD = 34,
  TRIGGER_ZONE = 35,
  LANDING_QUALITY_MARK = 36,
  BDA = 37,
  MAX = 38,
}

export namespace Events {
  export type Shot = {
    id: EventType.SHOT;
    weapon: Weapon;
  };

  export type Hit = {
    id: EventType.HIT;
    weapon: Weapon;
    target: SomeObject;
  };

  export type TakeOff = {
    id: EventType.TAKEOFF;
    place: SomeObject;
    subPlace: number;
  };

  export type Land = {
    id: EventType.LAND;
    place: SomeObject;
    subPlace: number;
  };

  export type Crash = {
    id: EventType.CRASH;
  };

  export type Ejection = {
    id: EventType.EJECTION;
    target: SomeObject;
  };

  export type Refueling = {
    id: EventType.REFUELING;
  };

  export type Dead = {
    id: EventType.DEAD;
  };

  export type PilotDead = {
    id: EventType.PILOT_DEAD;
  };

  export type BaseCaptured = {
    id: EventType.BASE_CAPTURED;
    place: { airbase: Airbase };
    subPlace: number;
  };

  export type MissionStart = {
    id: EventType.MISSION_START;
  };

  export type MissionEnd = {
    id: EventType.MISSION_END;
  };

  export type RefuelingStop = {
    id: EventType.REFUELING_STOP;
  };

  export type Birth = {
    id: EventType.BIRTH;
    place: SomeObject;
  };

  export type HumanFailure = {
    id: EventType.HUMAN_FAILURE;
  };

  export type DetailedFailure = {
    id: EventType.DETAILED_FAILURE;
  };

  export type EngineStartup = {
    id: EventType.ENGINE_STARTUP;
  };

  export type EngineShutdown = {
    id: EventType.ENGINE_SHUTDOWN;
  };

  export type PlayerEnterUnit = {
    id: EventType.PLAYER_ENTER_UNIT;
  };

  export type PlayerLeaveUnit = {
    id: EventType.PLAYER_LEAVE_UNIT;
  };

  export type PlayerComment = {
    id: EventType.PLAYER_COMMENT;
    comment: string;
  };

  export type ShootingStart = {
    id: EventType.SHOOTING_START;
    target: Unit;
    weaponName: string;
  };

  export type ShootingEnd = {
    id: EventType.SHOOTING_END;
    weaponName: string;
  };

  export type MarkAdded = {
    id: EventType.MARK_ADDED;
  } & MarkPanel;

  export type MarkChange = {
    id: EventType.MARK_CHANGE;
  } & MarkPanel;

  export type MarkRemoved = {
    id: EventType.MARK_REMOVED;
  } & MarkPanel;

  export type Kill = {
    id: EventType.KILL;
    target: Unit;
    weapon: Weapon;
    weaponName: string;
  };

  export type Score = {
    id: EventType.SCORE;
  };

  export type UnitLost = {
    id: EventType.UNIT_LOST;
  };

  export type LandingAfterEjection = {
    id: EventType.LANDING_AFTER_EJECTION;
    place: Unit;
    subPlace: 0;
  };

  export type DiscardChairAfterEjection = {
    id: EventType.DISCARD_CHAIR_AFTER_EJECTION;
    target: Unit;
  };

  export type WeaponAdd = {
    id: EventType.WEAPON_ADD;
    weaponName: string;
  };

  export type LandingQualityMark = {
    id: EventType.LANDING_QUALITY_MARK;
    place: SomeObject;
    comment: string;
    subPlace: number;
  };
}

export type Event = (
  | {
    id: number;
    time: number;
  }
    & (
      & { initiator: SomeObject }
      & (
        | Events.Shot
        | Events.Hit
        | Events.TakeOff
        | Events.Land
        | Events.Crash
        | Events.Ejection
        | Events.Refueling
        | Events.Dead
        | Events.PilotDead
        | Events.BaseCaptured
        | Events.RefuelingStop
        | Events.Birth
        | Events.HumanFailure
        | Events.DetailedFailure
        | Events.EngineStartup
        | Events.EngineShutdown
        | Events.PlayerEnterUnit
        | Events.PlayerLeaveUnit
        | Events.ShootingStart
        | Events.ShootingEnd
        | Events.MarkAdded
        | Events.MarkChange
        | Events.MarkRemoved
        | Events.Kill
        | Events.UnitLost
        | Events.LandingAfterEjection
        | Events.DiscardChairAfterEjection
        | Events.WeaponAdd
        | Events.LandingQualityMark
      )
    )
  | (
    | Events.MissionStart
    | Events.MissionEnd
    | Events.PlayerComment
    | Events.Score
  )
);

export async function* streamEvents(
  events?: Array<EventType>,
  queueSize: number = 512,
) {
  const channel = createChannel(ChannelDirection.FROM_LUA, queueSize);
  await createEventProducer(channel, events);

  while (true) {
    const event = await waitChannel<Event>(channel);
    if (event === null) {
      return;
    }
    yield event;
  }
}
