import { runTask } from "./runtime.ts";
import {
  Airbase,
  Group,
  MarkPanel,
  ObjectCategory,
  ObjectRef,
  SomeObject,
  Unit,
  Volume,
} from "./common.ts";

export function getAirbases(): Promise<Array<Airbase>> {
  return runTask<Array<Airbase>>("worldGetAirbases");
}

export function getMarkPanels(): Promise<Array<MarkPanel>> {
  return runTask<Array<MarkPanel>>("getMarkPanels");
}

export function searchObjects(
  category: ObjectCategory,
  volume: Volume,
): Promise<Array<SomeObject>> {
  return runTask<Array<SomeObject>>("worldSearchObjects", {
    category,
    volume,
  });
}

export function getObjectDescription(
  object: ObjectRef,
): Promise<unknown> {
  return runTask<unknown>("objectGetDesc", {
    object,
  });
}

export function destroyObject(
  object: ObjectRef,
): Promise<void> {
  return runTask<void>("objectDestroy", {
    object,
  });
}

export function getUnit(name: string): Promise<Unit | null> {
  return runTask<Unit>("unitGetByName", { name });
}

export function getGroup(name: string): Promise<Group | null> {
  return runTask<Group>("groupGetByName", { name });
}

export function getObject(name: string): Promise<SomeObject | null> {
  return runTask<SomeObject>("objectGet", { name });
}
