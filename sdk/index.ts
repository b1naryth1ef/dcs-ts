import * as Atmosphere from "./atmosphere.ts";
import * as Coalition from "./coalition.ts";
import * as Command from "./command.ts";
import * as Common from "./common.ts";
import * as Controller from "./controller.ts";
import * as Group from "./group.ts";
import * as MissionEvent from "./event.ts";
import * as Land from "./land.ts";
import * as Mission from "./mission.ts";
import * as Net from "./net.ts";
import * as Runtime from "./runtime.ts";
import * as Spot from "./spot.ts";
import * as Timer from "./timer.ts";
import * as Trigger from "./trigger.ts";
import * as Unit from "./unit.ts";
import * as World from "./world.ts";

import * as Geo from "./util/geo.ts";
import * as Lua from "./util/lua.ts";

// Export everything to the window for easy debugging within the console
(window as any).Atmosphere = Atmosphere;
(window as any).Coalition = Coalition;
(window as any).Command = Command;
(window as any).Common = Common;
(window as any).Controller = Controller;
(window as any).Group = Group;
(window as any).MissionEvent = MissionEvent;
(window as any).Land = Land;
(window as any).Mission = Mission;
(window as any).Net = Net;
(window as any).Runtime = Runtime;
(window as any).Spot = Spot;
(window as any).Timer = Timer;
(window as any).Trigger = Trigger;
(window as any).Unit = Unit;
(window as any).World = World;
(window as any).Util = {
  Geo,
  Lua,
};
