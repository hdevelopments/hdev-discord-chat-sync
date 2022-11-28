import { Interaction } from "discord.js";
import { Client, Next } from "discordx";
export const onlyDms = async (
  interaction: Interaction,
  client: Client,
  next: Next
) => {
  if (!interaction || !interaction.inGuild()) {
    await next();
  }
};
