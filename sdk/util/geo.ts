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
