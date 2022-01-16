import { CommandManager } from "@dcs/command.ts";
import { outText } from "@dcs/trigger.ts";

window.onload = async () => {
  const manager = new CommandManager();

  await manager.add("Get Cat Fact", async () => {
    const res = await fetch("https://catfact.ninja/fact");
    const { fact } = await res.json();
    await outText(
      `Cat Fact: ${fact}`,
      15,
    );
  });
};
