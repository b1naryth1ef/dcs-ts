import { Position } from "../common.ts";

export function toRad(n: number) {
  return (n * Math.PI) / 180;
}

export function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function getFlyDistance(
  [lat1, lon1]: Position,
  [lat2, lon2]: Position,
) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  lat1 = toRad(lat1);
  lat2 = toRad(lat2);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d * 0.539957;
}

export function toRadians(n: number) {
  return n * (Math.PI / 180);
}

export function toDegrees(n: number) {
  return n * (180 / Math.PI);
}
