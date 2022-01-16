import { runTask } from "./runtime.ts";

export type SlotInfo = {
  side: number;
  slot: number;
};

export type Stats = {
  car: number;
  crash: number;
  eject: number;
  land: number;
  ping: number;
  plane: number;
  score: number;
  ship: number;
};

export type PlayerInfo = {
  id: number;
  ipaddr: string;
  name: string;
  ping: number;
  side: number;
  slot: string;
  started: boolean;
  ucid: string;
};

export function sendChat(
  message: string,
  all = true,
): Promise<void> {
  return runTask<void>("netSendChat", {
    message,
    all,
  });
}

export function sendChatTo(
  message: string,
  playerId: number,
  fromPlayerId?: number,
): Promise<void> {
  return runTask<void>("netSendChatTo", {
    message,
    playerId,
    fromPlayerId,
  });
}

export function loadMission(
  path: string,
): Promise<boolean> {
  return runTask<boolean>("netLoadMission", {
    path,
  });
}

export function loadNextMission(): Promise<boolean> {
  return runTask<boolean>("netLoadNextMission");
}

export function getPlayerIds(): Promise<Array<number>> {
  return runTask<Array<number>>("netGetPlayerIds");
}

export function getPlayerList(): Promise<Array<PlayerInfo>> {
  return runTask<Array<PlayerInfo>>("netGetPlayerList");
}

export function kickPlayer(
  playerId: number,
  message?: string,
): Promise<boolean> {
  return runTask<boolean>("netKickPlayer", {
    playerId,
    message,
  });
}

export function getStats(playerId: number): Promise<Stats> {
  return runTask<Stats>("netGetStats", {
    playerId,
  });
}

export function getSlotInfo(playerId: number): Promise<SlotInfo> {
  return runTask<SlotInfo>("netGetStats", {
    playerId,
  });
}
