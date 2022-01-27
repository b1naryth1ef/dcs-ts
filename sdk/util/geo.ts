import { CoordLike } from "../common.ts";

export function toRad(n: number) {
  return (n * Math.PI) / 180;
}

export function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function toRadians(n: number) {
  return n * (Math.PI / 180);
}

export function toDegrees(n: number) {
  return n * (180 / Math.PI);
}

/**
 * Returns the distance (in the specified coordinate, or kilometers by default)
 * that would be traveled going from the start to the end set of coordinates. This
 * is the "as the crow flies" calculation and does not consider some important
 * details about the earth.
 */
export function getDistance(
  [latitude1, longitude1]: CoordLike,
  [latitude2, longitude2]: CoordLike,
  unit: "miles" | "kilometers" = "kilometers",
) {
  if ((latitude1 === latitude2) && (longitude1 === longitude2)) {
    return 0;
  }
  const radlatitude1 = Math.PI * latitude1 / 180;
  const radlatitude2 = Math.PI * latitude2 / 180;
  const theta = longitude1 - longitude2;
  const radtheta = Math.PI * theta / 180;
  let distance = Math.sin(radlatitude1) * Math.sin(radlatitude2) +
    Math.cos(radlatitude1) * Math.cos(radlatitude2) * Math.cos(radtheta);
  if (distance > 1) {
    distance = 1;
  }
  distance = Math.acos(distance);
  distance = distance * 180 / Math.PI;
  distance = distance * 60 * 1.1515;

  if (unit === "miles") {
    return distance * 0.8684;
  } else {
    return distance * 1.609344;
  }
}

/**
 * Returns the bearing (in degrees) pointing from the start to the end coordinate.
 */
export function getBearing(
  [startLat, startLong]: CoordLike,
  [endLat, endLong]: CoordLike,
) {
  startLat = toRad(startLat);
  startLong = toRad(startLong);
  endLat = toRad(endLat);
  endLong = toRad(endLong);

  var dLong = endLong - startLong;

  var dPhi = Math.log(
    Math.tan(endLat / 2.0 + Math.PI / 4.0) /
      Math.tan(startLat / 2.0 + Math.PI / 4.0),
  );
  if (Math.abs(dLong) > Math.PI) {
    if (dLong > 0.0) {
      dLong = -(2.0 * Math.PI - dLong);
    } else {
      dLong = 2.0 * Math.PI + dLong;
    }
  }

  return (toDeg(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
}
