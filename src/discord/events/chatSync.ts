import { ArgsOf, Discord, On } from "discordx";
import { Inject } from "typedi";
import {
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonStyle,
  InteractionResponseType,
  MessageActionRowComponentBuilder,
  MessageType,
  TextBasedChannel,
  Webhook,
} from "discord.js";
import GuildConfigService from "../../services/GuildConfigService";
import bot from "../../main";
import syncUtils from "../../utils/syncModerationUtils";
@Discord()
export class chatSync {
  @Inject()
  private guildConfig: GuildConfigService;
  @Inject()
  private syncUtils: syncUtils;

  @On({ event: "messageCreate", priority: 1 })
  async handler([message]: ArgsOf<"messageCreate">): Promise<void> {
    if (
      !message.inGuild() ||
      !message.author ||
      message.author.bot ||
      !message.member ||
      message.type === MessageType.ThreadCreated ||
      message.type === MessageType.GuildBoost ||
      message.type === MessageType.GuildBoostTier1 ||
      message.type === MessageType.GuildBoostTier2 ||
      message.type === MessageType.GuildBoostTier3 ||
      message.type === MessageType.ThreadStarterMessage
    ) {
      return;
    }
    var config = await this.guildConfig.getOrCreate(message.guildId!);
    if (config.banned || !config.channels) return;
    var foundChannel = config.channels[message.channelId];
    if (foundChannel) {
      if (Date.now() - (foundChannel.lastMessage || 0) < 1000) {
        message.channel
          .send("Toooooo fast cowboy! (" + message.author.toString() + ")")
          .then((x) => {
            setTimeout(() => {
              x.delete().catch((x) => {});
            }, 5000);
          });
        return;
      }
      await this.syncUtils.sendToAllChannels(foundChannel.category, message);
      foundChannel.lastMessage = Date.now();
      this.guildConfig.save(config);
    }
  }
}
