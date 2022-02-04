import { Country, GroupCategory, Position, Unit, Vec2 } from "./common.ts";
import {
  HelicopterGroup,
  HelicopterUnit,
  PlaneGroup,
  PlanePayload,
  PlaneUnit,
  Route,
  ShipGroup,
  ShipUnit,
  VehicleGroup,
  VehicleUnit,
  Waypoint,
} from "./mission.ts";
import { runTask } from "./runtime.ts";

export function getGroupUnits(name: string): Promise<Array<Unit>> {
  return runTask("groupGetUnits", { name });
}

export type CreatePlanePayload = Omit<PlanePayload, "pylons"> & {
  pylons?: Array<{ id: number; clsid: string }>;
};

export type CreateWaypoint = Omit<Waypoint, "x" | "y" | "alt"> & {
  position: Position;
};

export type CreateRoute = Omit<Route, "points"> & {
  points: Array<CreateWaypoint>;
};

export interface CreateCallsign {
  id: Array<number>;
  name: string;
}

type PositionOrPoint = { position: Position } | Vec2;

export type CreateShipUnit = Omit<ShipUnit, "x" | "y"> & PositionOrPoint;

export type CreatePlaneUnit =
  & Omit<PlaneUnit, "x" | "y" | "alt" | "callsign" | "payload">
  & {
    callsign: CreateCallsign;
    payload: CreatePlanePayload;
  }
  & PositionOrPoint;

export type CreateVehicleUnit =
  & Omit<VehicleUnit, "x" | "y">
  & PositionOrPoint;

export type CreateHelicopterUnit =
  & Omit<HelicopterUnit, "x" | "y" | "alt" | "callsign" | "payload">
  & {
    callsign: CreateCallsign;
    payload: CreatePlanePayload;
  }
  & PositionOrPoint;

export type CreateShipGroup = Omit<ShipGroup, "units" | "x" | "y"> & {
  units: Array<CreateShipUnit>;
  position?: Position;
};

export type CreatePlaneGroup =
  & Omit<PlaneGroup, "units" | "x" | "y" | "route">
  & {
    units: Array<CreatePlaneUnit>;
    position?: Position;
    route?: CreateRoute;
  };

export type CreateVehicleGroup =
  & Omit<VehicleGroup, "units" | "x" | "y">
  & {
    units: Array<CreateVehicleUnit>;
    position?: Position;
  };

export type CreateHelicopterGroup =
  & Omit<HelicopterGroup, "units" | "x" | "y">
  & {
    units: Array<CreateHelicopterUnit>;
    position?: Position;
  };

// todo: support train groups
export function addGroup(
  country: Country,
  category: GroupCategory.SHIP,
  data: CreateShipGroup,
): Promise<number>;
export function addGroup(
  country: Country,
  category: GroupCategory.HELICOPTER,
  data: CreateHelicopterGroup,
): Promise<number>;
export function addGroup(
  country: Country,
  category: GroupCategory.GROUND,
  data: CreateVehicleGroup,
): Promise<number>;
export function addGroup(
  country: Country,
  category: GroupCategory.AIRPLANE,
  data: CreatePlaneGroup,
): Promise<number>;
export function addGroup(
  country: Country,
  category: GroupCategory,
  data: unknown,
): Promise<number> {
  return runTask<number>("coalitionAddGroup", {
    country,
    category,
    data,
  });
}
