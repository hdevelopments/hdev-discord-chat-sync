import {
  ButtonInteraction,
  GuildMember,
  Interaction,
  Message,
} from "discord.js";
import { Client, Next } from "discordx";

const data: {
  [key: string]: { message: Message; owner: GuildMember | undefined };
} = {};

export async function registerMessageOwner(
  user: GuildMember,
  message: Message
) {
  data[message.id] = { message: message, owner: user };
  return data[message.id];
}

export const OnlyOwnerOfMessage = async (
  interaction: Interaction,
  client: Client,
  next: Next
) => {
  if (!interaction || !(interaction instanceof ButtonInteraction)) {
    await next();
    return;
  }
  var targetMessage = interaction.message;

  if (
    !data[targetMessage.id] ||
    data[targetMessage.id].owner === undefined ||
    data[targetMessage.id].owner === (interaction.member as GuildMember)
  ) {
    await next();
  } else {
    await interaction.reply({
      content: "You dont have access to it!",
      ephemeral: true,
    });
  }
};
