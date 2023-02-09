import {
  BaseGuildTextChannel,
  GuildChannelResolvable,
  GuildResolvable,
  MessageCreateOptions,
  MessagePayload,
} from "discord.js";
import bot from "../main";

const logChannels: { [key: string]: string } = {
  ["dev"]: "933043184001507368",
  ["prod"]: "1024574390987407420",
};

class Logs {
  public static async SendLog(msg: MessageCreateOptions) {
    var channel = (await bot.channels.fetch(
      logChannels[process.env.DEV ? "dev" : "prod"]
    )) as BaseGuildTextChannel;
    if (channel) return await channel.send(msg);
  }
}

export default Logs;
