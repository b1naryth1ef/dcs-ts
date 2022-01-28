export enum CoalitionType {
  ALL = -1,
  NEUTRAL = 0,
  RED = 1,
  BLUE = 2,
}

// [latitude, longitude, altitude]
export type Position = [number, number, number];
export type CoordLike = [number, number, ...number[]];

export type Vec2 = {
  x: number;
  y: number;
};

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

export enum RadioModulation {
  AM = 0,
  FM = 1,
}

export enum GroupCategory {
  AIRPLANE = 0,
  HELICOPTER = 1,
  GROUND = 2,
  SHIP = 3,
  TRAIN = 4,
}

export type Unit = {
  id: number;
  name: string;
  callsign: string;
  coalition: CoalitionType;
  type: string;
  position: Position;
  playerName?: string;
  groupName: string;
  numberInGroup: number;
  speed: number;
  heading: number;
  category: GroupCategory;
};

export enum AirbaseCategory {
  UNSPECIFIED = 0,
  AIRDROME = 1,
  HELIPAD = 2,
  SHIP = 3,
}

export type Airbase = {
  id?: number;
  name: string;
  callsign: string;
  coalition: CoalitionType;
  position: Position;
  airbaseCategory: AirbaseCategory;
  displayName: string;
};

export enum SurfaceType {
  LAND = 1,
  SHALLOW_WATER = 2,
  WATER = 3,
  ROAD = 4,
  RUNWAY = 5,
}

export enum ObjectCategory {
  UNIT = 1,
  WEAPON = 2,
  STATIC = 3,
  BASE = 4,
  SCENERY = 5,
  CARGO = 6,
}

export enum VolumeType {
  SEGMENT = 0,
  BOX = 1,
  SPHERE = 2,
  PYRAMID = 3,
}

// todo: expand this type based on the above enum
export type Volume = {
  id: VolumeType;
  params: unknown;
};

export type Group = {
  id: number;
  name: string;
  coalition: CoalitionType;
  category: GroupCategory;
};

export type ObjectRef = (
  | { unit: string }
  | { weapon: string }
  | { airbase: string }
  | { staticObject: string }
  | { sceneryObject: string }
  | { id: number }
);

export enum WeaponCategory {
  SHELL = 0,
  MISSILE = 1,
  ROCKET = 2,
  BOMB = 3,
}

export enum WeaponGuidanceType {
  INS = 1,
  IR = 2,
  RADAR_ACTIVE = 3,
  RADAR_SEMI_ACTIVE = 4,
  RADAR_PASSIVE = 5,
  TV = 6,
  LASER = 7,
  TELE = 8,
}

export enum WeaponMissileCategory {
  AAM = 1,
  SAM = 2,
  BM = 3,
  ANTI_SHIP = 4,
  CRUISE = 5,
  OTHER = 6,
}

export enum WeaponWarheadType {
  AP = 0,
  HE = 1,
  SHAPED_EXPLOSIVE = 2,
}

export type WeaponDescription = {
  category: WeaponCategory;
  warhead: {
    type: WeaponWarheadType;
    mass: number;
    caliber: number;
    explosiveMass?: number;
    shapedExplosiveMass?: number;
    shapedExplosiveArmorThickness?: number;
  };
};

export type WeaponMissileDescription = {
  guidance: WeaponGuidanceType;
  rangeMin: number;
  rangeMaxAltMin: number;
  rangeMaxAltMax: number;
  altMin: number;
  altMax: number;
  Nmax: number;
  fuseDist: number;
};

export type WeaponRocketDescription = {
  distMin: number;
  distMax: number;
};

export type WeaponBombDescription = {
  guidance: WeaponGuidanceType;
  altMin: number;
  altMax: number;
};

export type Weapon = {
  id: number;
  type: string;
  position: Position;
  launcher: Unit;
  target?: SomeObject;
};

export type MarkPanel = {
  idx: number;
  initiator: Unit;
  coalition: CoalitionType | 255;
  text: string;
  pos: Vec3;
  groupID: number; // todo: i think this is pretty much useless to provide
};

export type SomeObject =
  | {}
  | { unit: Unit }
  | { weapon: Weapon }
  | { airbase: Airbase }
  | { staticObject: unknown }
  | { sceneryObject: unknown };

export type GroupOrCoalition = {
  group: string;
} | {
  coalition: CoalitionType;
};

export enum Country {
  RUSSIA = 0,
  UKRAINE = 1,
  USA = 2,
  TURKEY = 3,
  UK = 4,
  FRANCE = 5,
  GERMANY = 6,
  AGGRESSORS = 7,
  CANADA = 8,
  SPAIN = 9,
  THE_NETHERLANDS = 10,
  BELGIUM = 11,
  NORWAY = 12,
  DENMARK = 13,
  ISRAEL = 15,
  GEORGIA = 16,
  INSURGENTS = 17,
  ABKHAZIA = 18,
  SOUTH_OSETIA = 19,
  ITALY = 20,
  AUSTRALIA = 21,
  SWITZERLAND = 22,
  AUSTRIA = 23,
  BELARUS = 24,
  BULGARIA = 25,
  CHEZH_REPUBLIC = 26,
  CHINA = 27,
  CROATIA = 28,
  EGYPT = 29,
  FINLAND = 30,
  GREECE = 31,
  HUNGARY = 32,
  INDIA = 33,
  IRAN = 34,
  IRAQ = 35,
  JAPAN = 36,
  KAZAKHSTAN = 37,
  NORTH_KOREA = 38,
  PAKISTAN = 39,
  POLAND = 40,
  ROMANIA = 41,
  SAUDI_ARABIA = 42,
  SERBIA = 43,
  SLOVAKIA = 44,
  SOUTH_KOREA = 45,
  SWEDEN = 46,
  SYRIA = 47,
  YEMEN = 48,
  VIETNAM = 49,
  VENEZUELA = 50,
  TUNISIA = 51,
  THAILAND = 52,
  SUDAN = 53,
  PHILIPPINES = 54,
  MOROCCO = 55,
  MEXICO = 56,
  MALAYSIA = 57,
  LIBYA = 58,
  JORDAN = 59,
  INDONESIA = 60,
  HONDURAS = 61,
  ETHIOPIA = 62,
  CHILE = 63,
  BRAZIL = 64,
  BAHRAIN = 65,
  THIRDREICH = 66,
  YUGOSLAVIA = 67,
  USSR = 68,
  ITALIAN_SOCIAL_REPUBLIC = 69,
  ALGERIA = 70,
  KUWAIT = 71,
  QATAR = 72,
  OMAN = 73,
  UNITED_ARAB_EMIRATES = 74,
  SOUTH_AFRICA = 75,
  CUBA = 76,
  PORTUGAL = 77,
  GDR = 78,
  LEBANON = 79,
  CJTF_BLUE = 80,
  CJTF_RED = 81,
  UN_PEACEKEEPERS = 82,
  ARGENTINA = 83,
  CYPRUS = 84,
  SLOVENIA = 85,
}

declare global {
  interface Window {
    dataDir: string;
  }
}
