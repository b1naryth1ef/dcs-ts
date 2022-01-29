import { Vec2 } from "./common.ts";
import { runTask } from "./runtime.ts";
import { parseLuaTable } from "./util/lua.ts";

export interface MissionData {
  trig: Trig;
  date: MissionDate;
  result: unknown;
  groundControl: GroundControl;
  maxDictId: number;
  drawings: Drawings;
  descriptionNeutralsTask: string;
  weather: Weather;
  theatre: string;
  triggers: Triggers;
  map: Map;
  coalitions: Coalitions;
  descriptionText: string;
  descriptionBlueTask: string;
  descriptionRedTask: string;
  coalition: Coalition;
  sortie: string;
  version: number;
  currentKey: number;
  start_time: number;
  failures: { [key: string]: Failure };
}

export interface Triggers {
  zones: Array<TriggerZone>;
}

export interface TriggerZone {
  color: [number, number, number, number];
  hidden: boolean;
  name: string;
  properties: Record<string, unknown>;
  radius: number;
  type: number;
  x: number;
  y: number;
  zoneId: number;
  verticies?: [Vec2, Vec2, Vec2, Vec2];
}

export interface Coalition {
  neutrals: CoalitionData;
  blue: CoalitionData;
  red: CoalitionData;
}

export interface CoalitionData {
  bullseye: Bullseye;
  name: string;
  country?: CountryData[];
}

export interface CountryData {
  name: string;
  id: number;
  plane?: { group: Array<PlaneGroup> };
  vehicle?: { group: Array<VehicleGroup> };
  helicopter?: { group: Array<HelicopterGroup> };
  ship?: { group: Array<ShipGroup> };
  static?: { group: Array<StaticGroup> };
}

export interface StaticGroup {
  heading: number;
  groupId: number;
  y: number;
  x: number;
  name: string;
  dead: boolean;
  units: Array<StaticUnit>;
  route: Route;
}

export interface StaticUnit {
  category: string;
  type: string;
  unitId: number;
  y: number;
  x: number;
  name: string;
  heading: number;
}

export interface VehicleUnit {
  transportable: Transportable;
  skill: Skill;
  type: string;
  unitId: number;
  y: number;
  x: number;
  name: string;
  heading: number;
  modulation?: number;
  frequency?: number;
  playerCanDrive?: boolean;
}

export interface VehicleGroup {
  visible: boolean;
  uncontrollable: boolean;
  task: string;
  taskSelected: boolean;
  groupId: number;
  hidden: boolean;
  y: number;
  x: number;
  name: string;
  start_time: number;
  units: Array<VehicleUnit>;
  route: Route;
}

export interface Route {
  points: Array<Waypoint>;
}

export interface Waypoint {
  x: number;
  y: number;
  alt: number;
  type: string; // todo: enum
  action: string; // todo: enum
  alt_type: AltitudeType;
  task?: unknown; // todo: type
  formation_template?: string;
  ETA?: number;
  ETA_locked?: boolean;
  speed?: number;
  speed_locked?: boolean;
  airdromeId?: number;
  name?: string;
}

export interface Pylon {
  CLSID: string;
}

export interface PlanePayload {
  fuel: number | string;
  flare: number;
  chaff: number;
  gun: number;
  pylons?: { [key: string]: { CLSID: string } };
  ammo_type?: number;
}

export interface PlaneUnit {
  name: string;
  type: string;
  x: number;
  y: number;
  alt: number;
  alt_type: AltitudeType;
  speed: number;
  payload: PlanePayload;
  callsign: Callsign;
  livery_id?: string;
  skill?: Skill;
  parking?: string;
  Radio?: Radio[];
  unitId?: number;
  psi?: number;
  parking_id?: string;
  heading?: number;
  onboard_num?: string;
  hardpoint_racks?: boolean;
  AddPropAircraft?: Record<string, any>;
}

export interface PlaneGroup {
  name: string;
  task: string;
  units: Array<PlaneUnit>;
  groupId?: number;
  y?: number;
  x?: number;
  modulation?: number;
  radioSet?: boolean;
  uncontrolled?: boolean;
  hidden?: boolean;
  communication?: boolean;
  start_time?: number;
  uncontrollable?: boolean;
  frequency?: number;
  route?: Route;
}

export interface HelicopterGroup {
  modulation: number;
  radioSet: boolean;
  task: string;
  uncontrolled: boolean;
  groupId: number;
  hidden: boolean;
  y: number;
  x: number;
  name: string;
  communication: boolean;
  start_time: number;
  uncontrollable: boolean;
  frequency: number;
  units: Array<HelicopterUnit>;
  route: Route;
}

export interface HelicopterUnit {
  alt: number;
  alt_type: AltitudeType;
  livery_id: string;
  skill: Skill;
  parking: string;
  ropeLength: number;
  speed: number;
  type: string;
  Radio: Radio[];
  unitId: number;
  psi: number;
  parking_id: string;
  x: number;
  name: string;
  payload: PlanePayload;
  y: number;
  heading: number;
  callsign: Callsign;
  onboard_num: string;
  hardpoint_racks?: boolean;
  AddPropAircraft?: Record<string, any>;
}

export interface ShipGroup {
  visible: boolean;
  uncontrollable: boolean;
  groupId: number;
  hidden: boolean;
  y: number;
  x: number;
  name: string;
  start_time: number;
  units: ShipUnit[];
  route: Route;
}

export interface ShipUnit {
  transportable: Transportable;
  skill: Skill;
  type: string;
  unitId: number;
  y: number;
  x: number;
  name: string;
  heading: number;
  modulation?: number;
  frequency?: number;
  playerCanDrive?: boolean;
}

export interface Ship {
}

export interface Static {
}

export interface Bullseye {
  y: number;
  x: number;
}

export interface Radio {
  channels: number[];
  modulations?: number[];
}

export interface Callsign {
  "1": number;
  "2": number;
  "3": number;
  name: string;
}

export interface Transportable {
  randomTransportable: boolean;
}

export interface Trig {
  actions: {};
  conditions: {};
  custom: {};
  customStartup: {};
  events: {};
  flag: {};
  func: {};
  funcStartup: {};
}

export interface Coalitions {
  neutrals: number[];
  blue: number[];
  red: number[];
}

export interface MissionDate {
  Day: number;
  Year: number;
  Month: number;
}

export interface Drawings {
  options: Options;
  layers: Layer[];
}

export interface Layer {
  visible: boolean;
  name: string;
}

export interface Options {
  hiddenOnF10Map: HiddenOnF10Map;
}

export interface HiddenOnF10Map {
  Observer: HiddenOptions;
  Instructor: HiddenOptions;
  ForwardObserver: HiddenOptions;
  Spectrator: HiddenOptions;
  ArtilleryCommander: HiddenOptions;
  Pilot: HiddenOptions;
}

export interface HiddenOptions {
  Neutral: boolean;
  Blue: boolean;
  Red: boolean;
}

export interface Failure {
  hh: number;
  prob: number;
  enable: boolean;
  mmint: number;
  id: string;
  mm: number;
}

export interface GroundControl {
  isPilotControlVehicles: boolean;
  roles: Roles;
}

export interface Roles {
  artillery_commander: RoleOptions;
  instructor: RoleOptions;
  observer: RoleOptions;
  forward_observer: RoleOptions;
}

export interface RoleOptions {
  neutrals: number;
  blue: number;
  red: number;
}

export interface Map {
  centerY: number;
  zoom: number;
  centerX: number;
}

export interface Weather {
  atmosphere_type: number;
  groundTurbulence: number;
  enable_fog: boolean;
  wind: Wind;
  enable_dust: boolean;
  season: Season;
  type_weather: number;
  modifiedTime: boolean;
  name: string;
  dust_density: number;
  qnh: number;
  fog: Fog;
  visibility: Visibility;
  clouds: Clouds;
}

export interface Clouds {
  density: number;
  thickness: number;
  base: number;
  iprecptns: number;
}

export interface Fog {
  thickness: number;
  visibility: number;
}

export interface Season {
  temperature: number;
}

export interface Visibility {
  distance: number;
}

export interface Wind {
  at8000: WindData;
  at2000: WindData;
  atGround: WindData;
}

export interface WindData {
  speed: number;
  dir: number;
}

export enum Skill {
  Client = "Client",
  Player = "Player",
  Average = "Average",
  Excellent = "Excellent",
  High = "High",
}

export enum AltitudeType {
  BARO = "BARO",
  RADIO = "RADIO",
}
export type MissionFile = {
  data: MissionData;
  theatre: string;
  options: unknown;
  warehouses: unknown;
};

/**
 * Read the data from a DCS mission file (.miz) located at the provided path.
 */
export async function readMissionFile(path: string): Promise<MissionFile> {
  const { readZip } = await import("https://deno.land/x/jszip/mod.ts");
  const zip = await readZip(path);

  const [theatre, optionsRaw, dataRaw, warehousesRaw] = await Promise.all([
    zip.file("theatre").async("string"),
    zip.file("options").async("string"),
    zip.file("mission").async("string"),
    zip.file("warehouses").async("string"),
  ]);

  const data = parseLuaTable<MissionData>(dataRaw, {
    emitArrays: true,
    emptyObjectUndefined: true,
  });

  const options = parseLuaTable(optionsRaw);
  const warehouses = parseLuaTable(warehousesRaw);

  return {
    data,
    theatre,
    options,
    warehouses,
  };
}

export async function getMissionData(): Promise<MissionData> {
  const missionDataJSON = await runTask<string>("envGetMission");
  return JSON.parse(missionDataJSON) as MissionData;
}
