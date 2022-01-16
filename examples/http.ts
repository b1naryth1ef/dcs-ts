import { setMonitorTaskPerformance } from "@dcs/runtime.ts";
import { outText } from "@dcs/trigger.ts";
import { serve } from "https://deno.land/std@0.121.0/http/server.ts";
import { getUnits } from "@dcs/coalition.ts";
import { CoalitionType } from "@dcs/common.ts";

// enable monitoring task performance
setMonitorTaskPerformance(true);

function json(response: unknown, status = 200) {
  return new Response(
    JSON.stringify(response),
    {
      status: status,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/send-message" && req.method === "POST") {
    const { text } = await req.json();
    await outText(text);
    return json({ ok: true });
  } else if (url.pathname === "/units" && req.method === "GET") {
    const units = await getUnits(CoalitionType.ALL);
    return json({ units });
  }

  return json({}, 404);
}

window.onload = async () => {
  await serve(handler, { port: 12345 });
};
