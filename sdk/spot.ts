import { runTask } from "./runtime.ts";
import { Position, SomeObject, Vec3 } from "./common.ts";

export enum SpotType {
  INFRA_RED = 0,
  LASER = 1,
}

export type Spot = {
  type: SpotType;
  id: number;
  target: Position;
  code: number;
};

export function createSpot(
  type: SpotType.INFRA_RED,
  source: SomeObject,
  target: Position,
  offset?: Vec3,
): Promise<Spot>;
export function createSpot(
  type: SpotType,
  source: SomeObject,
  target: Position,
  offset?: Vec3,
  code?: number,
): Promise<Spot> {
  if (type === SpotType.LASER) {
    return runTask<Spot>("spotCreateLaser", {
      source,
      target,
      offset,
      code,
    });
  } else {
    return runTask<Spot>("spotCreateInfraRed", {
      source,
      target,
      offset,
    });
  }
}

export function setSpotTarget(spot: Spot, target: Position) {
  return runTask("spotSetPoint", {
    id: spot.id,
    target,
  });
}

export function setSpotCode(
  spot: Spot & { type: SpotType.LASER },
  code: number,
) {
  return runTask("spotSetCode", {
    id: spot.id,
    code,
  });
}
