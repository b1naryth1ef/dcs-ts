# SDK Patterns

## Event Streaming

DCS can emit a variety of events and the SDK natively supports streaming those
events efficiently.

```typescript
import { EventType, streamEvents } from "@dcs/event.ts";

window.onload = async () => {
  // stream only death events
  for await (const event of streamEvents([EventType.DEAD])) {
    if (event.id == EventType.DEAD && "unit" in event.initiator) {
      console.log(`Unit is dead: ${event.initiator.unit.name}`);
    }
  }
};
```

## Unit Watching

One important concept when dealing with multiple threads is synchronization of
data. To support use cases where your TypeScript code would like to have an
updated view into the data of units the `UnitWatcher` can be used to very
efficiently synchronize unit updates between Lua and TypeScript at a
configurable rate.

```typescript
import { CoalitionType } from "@dcs/common.ts";
import { getUnits } from "@dcs/coalition.ts";
import { UnitWatcher } from "@dcs/unit.ts";

window.onload = async () => {
  // create a watcher that will update at least once every second
  const unitWatcher = await UnitWatcher.create(1);

  // add all of the red coalition units into the watcher
  const redUnits = await getUnits(CoalitionType.RED);
  await unitWatcher.add(redUnits.map((it) => it.name));

  // stream into a map for easy access from our code
  const units = new Map<string, Unit | null>();
  await unitWatcher.streamInto(units);
};
```
