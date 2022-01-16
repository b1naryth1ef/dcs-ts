# Getting Started

The following is a guide on getting setup to develop DCS-TS scripts locally.

## Requirements

- You must have [deno](https://deno.land/#installation) installed locally if you
  wish to use the TypeScript integration and bundling. Its entirely possible to
  just write Javascript, but we highly recommend utilizing TypeScript as it
  provides a plethora of benefits.
- (Optional) we recommend using vscode and installing the deno vscode extension
  which will provide auto-formatting and type validation for your.

## Project Setup

DCS-TS does not actually impose any strict style of project setup or bundling.
Instead it simply loads and executes a list of Javascript files. If we want to
utilize TypeScript (or any other language that compiles to Javascript) we will
need to use some bundler to create our Javascript files. In this example we will
be using `deno` to provide type-checking and bundling support.

Lets create a simple hello world script (`hello_world.ts`) and bundle it so that
we can load and run it within DCS-TS:

```typescript
window.onload = () => {
  console.log("Hello from DCS-TS!");
};
```

Next up we must create a bundled Javascript version using `deno bundle`:

```
deno bundle hello_world.ts build.js
```

And finally we can add the above `build.js` file path to our `ts.json` in the
DCS `Config/` folder. Starting up a DCS server will cause this file to be loaded
and we will see "Hello from DCS-TS!" printed within the DCS-TS log file (located
in `Logs/`).

### Import Maps

Because Deno uses HTTP URLs for dependencies it can be useful to setup an
"import map" file to simplify your import statements, and provide a single
location for updating dependency versions. You will need to pass the
`--import-map=import_map.json` argument to your deno bundle command and
configure the deno vscode settings to support this file. Example
`import_map.json`:

```json
{
  "imports": {
    "@dcs/": "https://raw.githubusercontent.com/b1naryth1ef/dcs-ts/master/"
  }
}
```

## Development Tips

### Reloading

DCS-TS supports reloading all the provided Javascript files _without_ restarting
the DCS server or mission. Note that this is not a safe operation, and the old
Javascript runtime is torn down before a new one is created. This means there is
a very short period where your scripts are not running, and any errors in the
new scripts will cause them to fail loading. Because of this we recommend only
using reloading for development features or hot-fixing live scripts.

Hot reloading simply requires us to run `reload()` somewhere within the JS
environment. Its easiest to do this from a remote chrome inspector, but your
code can also call it at any point.

### Chrome Inspector

If you have enabled the development mode of DCS-TS a chrome inspector server
will be automatically started within the Javascript runtime. Connecting requires
the chrome browser (there are some other options like vscode extensions, but we
will not cover those here) and loading up the `chrome://inspect` URL. The
inspector should automatically detect and display the deno instance, although
sometimes there can be a small delay (especially after using `reload()`).

### Lua Eval

Executing raw Lua code is not recommended but can be useful for development,
this can be done via the `luaEval` runtime function:

```typescript
const value = await luaEval("1 + 1");
```

### Mission Data Export

Sometimes it can be very useful to look at the data within a DCS mission file
(`.miz`) as a reference for creating complex groups/units. DCS-TS ships with a
utility for converting these files into JSON files that match the types within
`mission.ts`.

```
$ deno run --import-map import_map.json --allow-all sdk/command/miz-to-json.ts -- "C:\Users\dcs\Saved Games\DCS\Missions\training_map.miz" > mission.json
```
