import { pushStep, Workspace } from "runtime/core.ts";
import * as Docker from "pkg/buildy/docker@1/mod.ts";

const DENO_VERSION = "1.18.0";

export async function githubPush(ws: Workspace) {
  pushStep("Lint SDK");
  await Docker.run("cd sdk && deno fmt --check", {
    image: `denoland/deno:${DENO_VERSION}`,
    copy: ["sdk/**"],
  });
}
