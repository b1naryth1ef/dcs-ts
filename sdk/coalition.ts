import { runTask } from "./runtime.ts";
import {
  Airbase,
  CoalitionType,
  Group,
  GroupCategory,
  Unit,
} from "./common.ts";

export async function getPlayers(
  coalition: CoalitionType,
): Promise<Array<Unit>> {
  return (await runTask<Array<Unit> | null>("coalitionGetPlayers", {
    coalition,
  })) || [];
}

export async function getAirbases(
  coalition: CoalitionType,
): Promise<Array<Airbase>> {
  return (await runTask<Array<Airbase> | null>("coalitionGetAirbases", {
    coalition,
  })) || [];
}

export async function getGroups(
  coalition = CoalitionType.ALL,
  category?: GroupCategory,
): Promise<Array<Group>> {
  return (await runTask<Array<Group> | null>("coalitionGetGroups", {
    coalition,
    category,
  })) || [];
}

export async function getUnits(
  coalition = CoalitionType.ALL,
  category?: GroupCategory,
): Promise<Array<Unit>> {
  return (await runTask<Array<Unit> | null>("coalitionGetUnits", {
    coalition,
    category,
  })) || [];
}
