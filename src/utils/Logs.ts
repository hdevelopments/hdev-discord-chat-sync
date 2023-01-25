import {
  BaseGuildTextChannel,
  GuildChannelResolvable,
  GuildResolvable,
} from "discord.js";
import bot from "../main";

const logChannels: { [key: string]: string } = {
  ["dev"]: "933043184001507368",
  ["prod"]: "1024574390987407420",
};

class Logs {
  public static async SendLog(msg: string) {
      var channel = await bot.channels.fetch(
        logChannels[process.env.DEV ? "dev" : "prod"]
      ) as BaseGuildTextChannel;
      if (channel)
        channel.send({ content: msg, allowedMentions: { parse: ["users"] } });
    
  }
}

export default Logs;
