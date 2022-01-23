import { readMissionFile } from "@dcs/mission.ts";

/**
 * Exports a DCS miz file in a JSON format.
 */
export async function main() {
  if (Deno.args.length === 1) {
    console.log("Usage: miz-to-json <path-to-miz-file>");
    return;
  }

  const targetPath = Deno.args[1];
  const mission = await readMissionFile(targetPath);

  Deno.stdout.writeSync(
    new TextEncoder().encode(JSON.stringify(mission, null, 2)),
  );
}

main();
