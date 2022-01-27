import { runTask } from "./runtime.ts";
import { Position, SurfaceType, Vec2, Vec3 } from "./common.ts";

export type RoadType = "roads" | "railroads";

/**
 * Converts a DCS internal point into a geographic position. This is useful for
 * converting mission data into a useable format.
 */
export function convertPoint(point: Vec3): Promise<Position> {
  return runTask<Position>("landConvertPoint", { point });
}

export function getHeight(pos: Vec2): Promise<number> {
  return runTask<number>("landGetHeight", {
    pos,
  });
}

export function getSurfaceHeightWithSeabed(
  pos: Vec2,
): Promise<number> {
  return runTask<number>("landGetSurfaceHeightWithSeabed", {
    pos,
  });
}

export function getSurfaceType(pos: Vec2): Promise<SurfaceType> {
  return runTask<SurfaceType>("landGetSurfaceType", {
    pos,
  });
}

export function isVisible(
  origin: Position,
  destination: Position,
): Promise<boolean> {
  return runTask<boolean>("landIsVisible", {
    origin,
    destination,
  });
}

export function raytrace(
  origin: Position,
  direction: Vec3,
  distance: number,
): Promise<Position | null> {
  return runTask<Position | null>("landGetIP", {
    origin,
    direction,
    distance,
  });
}

export function getClosestPointOnRoads(
  roadType: RoadType,
  pos: Vec2,
): Promise<Position> {
  return runTask<Position>("landGetClosestPointOnRoads", {
    roadType,
    pos,
  });
}

export function findPathOnRoads(
  roadType: RoadType,
  origin: Vec2,
  destination: Vec2,
): Promise<Array<Position>> {
  return runTask<Array<Position>>("landFindPathOnRoads", {
    roadType,
    origin,
    destination,
  });
}
