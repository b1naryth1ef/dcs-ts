import { runTask } from "./runtime.ts";
import {
  Airbase,
  CoalitionType,
  Group,
  GroupCategory,
  Unit,
} from "./common.ts";

export function getPlayers(
  coalition: CoalitionType,
): Promise<Array<Unit>> {
  return runTask<Array<Unit>>("coalitionGetPlayers", { coalition });
}

export function getAirbases(
  coalition: CoalitionType,
): Promise<Array<Airbase>> {
  return runTask<Array<Airbase>>("coalitionGetAirbases", { coalition });
}

export function getGroups(
  coalition = CoalitionType.ALL,
  category?: GroupCategory,
): Promise<Array<Group>> {
  return runTask<Array<Group>>("coalitionGetGroups", {
    coalition,
    category,
  });
}

export function getUnits(
  coalition = CoalitionType.ALL,
  category?: GroupCategory,
): Promise<Array<Unit>> {
  return runTask<Array<Unit>>("coalitionGetUnits", {
    coalition,
    category,
  });
}
