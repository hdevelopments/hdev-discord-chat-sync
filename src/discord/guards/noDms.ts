import { Interaction } from "discord.js";
import { Client, Next } from "discordx";
export const noDms = async (
  interaction: Interaction,
  client: Client,
  next: Next
) => {
  if ((!interaction || interaction.inGuild()) && interaction.guildId) {
    await next();
  }else{
    interaction.channel?.send("You have to be in a guild to execute this!")
  }
};
