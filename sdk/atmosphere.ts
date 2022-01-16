import { Position, Vec3 } from "./common.ts";
import { runTask } from "./runtime.ts";

/**
 * Calculate wind at position.
 *
 * @param position - The target position
 * @returns The wind velocity as a vector
 */
export function getWindAtPoint(position: Position): Promise<Vec3> {
  return runTask<Vec3>("getWindAtPoint", {
    position,
  });
}

/**
 * Calculate wind and turbulence at position.
 *
 * @param position - The target position
 * @returns The wind and turbulence position
 */
export function getWindAtPointWithTurbulence(
  position: Position,
): Promise<Vec3> {
  return runTask<Vec3>("getWindAtPointWithTurbulence", {
    position,
  });
}

type TemperatureAndPressure = {
  temperature: number;
  pressure: number;
};

/**
 * Get temperature and pressure at position.
 *
 * @param position - The target position
 * @returns The temperature and pressure reading
 */
export function getTemperatureAndPressure(
  position: Position,
): Promise<TemperatureAndPressure> {
  return runTask<TemperatureAndPressure>("getTemperatureAndPressure", {
    position,
  });
}
