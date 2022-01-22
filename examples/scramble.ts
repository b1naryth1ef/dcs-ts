import { UnitWatcher } from "@dcs/unit.ts";
import {
  Airbase,
  CoalitionType,
  Country,
  GroupCategory,
  Unit,
} from "@dcs/common.ts";
import { getAirbases, getUnits } from "@dcs/coalition.ts";
import { EventType, streamEvents } from "@dcs/event.ts";
import { getFlyDistance } from "@dcs/util/geo.ts";
import { outText } from "@dcs/trigger.ts";
import { addGroup, CreatePlaneGroup, CreatePlaneUnit } from "@dcs/group.ts";
import { AltitudeType } from "@dcs/mission.ts";
import { addDetectedTarget } from "@dcs/controller.ts";

const ENEMY_COALITION = CoalitionType.RED;
const TRESPASS_DISTANCE = 200;
const RESPONSE_UNIT_TEMPLATE = {
  type: "F-5E-3",
  alt_type: AltitudeType.BARO,
  speed: 200,
  payload: {
    fuel: 2046,
    flare: 15,
    chaff: 30,
    gun: 100,
    ammo_type: 2,
    pylons: [
      { id: 1, clsid: "{AIM-9P5}" },
      { id: 7, clsid: "{AIM-9P5}" },
      { id: 3, clsid: "{0395076D-2F77-4420-9D33-087A4398130B}" },
      { id: 5, clsid: "{0395076D-2F77-4420-9D33-087A4398130B}" },
    ],
  },
};

class ResponseGroup {
  constructor(public name: string, public aliveUnits: number) {}

  static async create(airbase: Airbase, threat: Unit): Promise<ResponseGroup> {
    const name = `response-${airbase.callsign}-1`;
    let position = airbase.position;
    position[2] += 10000;

    let units: Array<CreatePlaneUnit> = [];
    for (let id = 0; id < 2; id++) {
      units.push({
        ...RESPONSE_UNIT_TEMPLATE,
        position: [position[0], position[1], position[2] + (500 * id)],
        name: `${name}-${id}`,
        callsign: {
          id: [2, 3, id],
          name: `Springfield3${id}`,
        },
      });
    }

    let groupData: CreatePlaneGroup = {
      name,
      task: "CAP",
      route: {
        points: [
          {
            position: threat.position,
            type: "Turning Point",
            action: "Turning Point",
            alt_type: AltitudeType.BARO,
          },
        ],
      },
      units,
    };

    await addGroup(Country.RUSSIA, GroupCategory.AIRPLANE, groupData);

    // add detected target after a little bit
    setTimeout(async () => {
      await addDetectedTarget(
        { group: name },
        { unit: threat.name },
        true,
        true,
      );
    }, 10_000);

    return new ResponseGroup(name, 2);
  }
}

const responses = new Map<string, ResponseGroup>();

async function trackPlayerUnits(watcher: UnitWatcher) {
  for await (const event of streamEvents([EventType.BIRTH, EventType.DEAD])) {
    if (
      event.id == EventType.BIRTH && "unit" in event.initiator &&
      event.initiator.unit.playerName
    ) {
      await watcher.add(event.initiator.unit.name);
    } else if (
      event.id == EventType.DEAD && "unit" in event.initiator
    ) {
      if (event.initiator.unit.playerName) {
        await watcher.remove(event.initiator.unit.name);
      } else if (event.initiator.unit.groupName.startsWith("response-")) {
        for (const [key, value] of responses) {
          if (key === event.initiator.unit.groupName) {
            value.aliveUnits -= 1;
            if (value.aliveUnits <= 0) {
              console.log(
                `All units in response group ${event.initiator.unit.groupName} are dead. Clearing response`,
              );
              responses.delete(key);
            }
          }
        }
      }
    }
  }
}

async function checkTrespass(
  units: Array<Unit | null>,
  enemyAirbases: Map<string, Airbase>,
) {
  for (const unit of units) {
    if (unit === null) continue;

    for (const airbase of enemyAirbases.values()) {
      if (responses.has(airbase.name)) {
        continue;
      }

      const distance = getFlyDistance(airbase.position, unit.position);
      if (distance <= TRESPASS_DISTANCE) {
        console.log(
          `[${unit.name}] is trespassing ${distance}km away from airport ${airbase.name}`,
        );
        outText(
          `You are trespassing in the ${airbase.name} base defense zone, fighters have been alerted!`,
          15,
          false,
          {
            group: unit.groupName,
          },
        );

        responses.set(airbase.name, await ResponseGroup.create(airbase, unit));
      }
    }
  }
}

async function trackAirbases(enemyAirbases: Map<string, Airbase>) {
  for await (const event of streamEvents([EventType.BASE_CAPTURED])) {
    if (event.id === EventType.BASE_CAPTURED) {
      if (
        enemyAirbases.has(event.place.airbase.name) &&
        event.place.airbase.coalition != ENEMY_COALITION
      ) {
        console.log(
          `Remove airbase that has been captured: `,
          event.place.airbase,
        );
        enemyAirbases.delete(event.place.airbase.name);
      } else if (event.place.airbase.coalition == ENEMY_COALITION) {
        console.log(
          `Add airbase that has been captured: `,
          event.place.airbase,
        );
        enemyAirbases.set(event.place.airbase.name, event.place.airbase);
      }
    }
  }
}

window.onload = async () => {
  const playerUnits = new Map<string, Unit | null>();
  const playerWatcher = await UnitWatcher.create(1);
  playerWatcher.streamInto(playerUnits);
  trackPlayerUnits(playerWatcher);

  const airbases = new Map(
    (await getAirbases(ENEMY_COALITION)).map((it) => [it.name, it]),
  );
  trackAirbases(airbases);

  const startUnits = (await getUnits(CoalitionType.ALL, GroupCategory.AIRPLANE))
    .filter(
      (it) => it.playerName !== undefined,
    ).map((it) => it.name);
  await playerWatcher.add(startUnits);

  setInterval(() => {
    checkTrespass(Array.from(playerUnits.values()), airbases);
  }, 30_000);

  console.log("Scramble script started");
};
