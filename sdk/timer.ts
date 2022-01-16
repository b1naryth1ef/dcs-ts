import { runTask } from "./runtime.ts";

// Return time (since simulation load) rounded to 3 decimal places
export function getTime(): Promise<number> {
  return runTask<number>("getTime");
}

// Returns the current in-mission time as a delta from the in-mission start time
export function getAbsTime(): Promise<number> {
  return runTask<number>("getAbsTime");
}

// Returns the mission start time
export function getMissionStartTime(): Promise<number> {
  return runTask<number>("getTime0");
}
