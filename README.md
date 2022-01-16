# DCS-TS

DCS-TS provides native Javascript scripting and TypeScript support within the
DCS mission environment. DCS-TS is built using a native Lua module written in
Rust which embeds the [Deno](https://github.com/denoland/deno) runtime. User
scripts run within a separate thread embedded within the DCS server, and
communicate with the Lua mission scripting environment via asynchronous
functions.

## Features

- **Deno Runtime** provides you with a modern and extremely powerful language
  runtime.
- **Custom TypeScript SDK** gives you a best-in-class editing experience with
  editor tooling, type checking, auto-documentation, and more.
- **Rich Debugging** allows you to diagnose and experiment at runtime via the
  Chrome web inspector, attached _directly_ into your running DCS server.
- **Reloading** reload your scripts as required, either for fast development or
  to hotfix issues without disrupting players.

## Examples

- [catfacts.ts](/examples/catfacts.ts) adds a command to the in-game F10 menu
  for receiving a random cat fact
- [http.ts](/examples/http.ts) provides an example embedded http server which
  interacts with the running DCS server
- [scramble.ts](/examples/scramble.ts) scrambles AI aircraft when players reach
  pre-defined distances from captured air-fields

## Documentation

- [Getting Started Guide](/docs/getting_started.md)
- [SDK Patterns](/docs/sdk_patterns.md)
- [FAQ](/docs/faq.md)

## How

DCS-TS is based off the work in
[DCS-gRPC/rust-server](https://github.com/DCS-gRPC/rust-server), which supports
embedding a rust DLL and associated functionality within the DCS Lua
environment. Instead of using this to provide an external API surface like
DCS-gRPC, DCS-TS embeds an instance of the Deno Javascript runtime (based on
v8). To communicate between Lua and Deno DCS-TS implements "tasks" which are
asynchronous Lua function calls made from Javascript, and "channels" which
provide one-ended communication either from or too the Lua environment.

On top of these abstractions and Deno a TypeScript SDK is provided which allows
type-safe and clearly documented interaction with the DCS MSE functionality.

### Performance

The Deno runtime within DCS-TS is ran via a separate system thread and utilizes
polling from Lua to process pending tasks and channel messages. This results in
quite good performance, and allows you to off-load a lot of processing and logic
from the DCS engine itself. Unfortunately this comes with a caveat based on
limitations within the DCS engine itself. The scheduled function feature within
the MSE is quite inaccurate and will regularly experience hitches of 10-40ms.
This means some thought must be taken when designing abstractions which you want
to perform quickly:

```typescript
// This will perform badly, as the await calls are lineally sequenced.
const updatedUnits = [];
for (const unit of units) {
  updatedUnits.push(await getUnit(unit));
}

// using Promise.all we can ensure operations into the scripting environment get
//  batched efficiently
const updatedUnits = await Promise.all(units.map((it) => getUnit(it)));
```

### Safety

DCS-TS is written in rust and when possible attempts to avoid potential program
crashes. Additionally Lua itself guards against program faults when calling into
remote DLLs, which prevents the DCS server from crashing if there is a bug in
DCS-TS.

## Installation

1. Download the latest release and unpack the zip somewhere on your local disk,
   it should contain two files `ts-init.lua` and `dcs_ts.dll`.
2. Edit the `Scripts\MissionScripting.lua` file contained within your DCS server
   **data** directory, generally this is in `Saved Games\DCS.openbeta_server`:

```diff
dofile('Scripts/ScriptingSystem.lua')
+  dofile([[C:\Users\dcs\Documents\dcs-ts\ts-init.lua]])
```

3. Create a configuration file at `Config/ts.json` within your DCS server
   **data** directory:

```javascript
{
  // whether to enable development features like the inspector server
  "development": true,

  // whether to enable debug logging
  "debugging": true,

  // optionally we can provide the path to the bundled sdk we're using, which will
  //  export all the available functions for use within the chrome inspector.
  "sdk_path": "C:\\Users\\dcs\\Documents\\build\\sdk.js",

  // path to scripts that will be loaded on initialization
  "scripts": [
    "C:\\Users\\dcs\\Documents\\dcs-ts\\build\\project.js"
  ]
}
```

## Development

To configure your development environment simply clone the repository and create
a link from the `res/dcs_ts.dll` directory pointing at
`target/debug/dcs_ts.dll`. Then follow the normal installation procedure with
the `ts-init.lua` file contained in `res/`. You will need to shutdown DCS when
rebuilding the DLL.
