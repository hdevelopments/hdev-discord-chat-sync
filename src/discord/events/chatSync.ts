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
} from "discord.js";
import GuildConfigService from "../../services/GuildConfigService";
import bot from "../../main";

@Discord()
export class chatSync {
  @Inject()
  private guildConfig: GuildConfigService;

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
    if (config.banned) return;
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
      foundChannel.lastMessage = Date.now();
      this.guildConfig.save(config);
      let channel: BaseGuildTextChannel;
      (await this.guildConfig.getAllChannels()).map(async (x) => {
        if (x.banned) return;

        if (x.channels && x.guild !== message.guildId) {
          var found = Object.entries(x.channels).find(
            ([key, value]) => value.category === foundChannel.category
          );
          try {
            channel = (bot.channels.cache.find(
              (channel) => channel.id === found?.[0]
            ) ||
              (await bot.channels.fetch(
                found?.[0] || ""
              ))) as BaseGuildTextChannel;
          } catch {
            (exc: any) => {
              console.log(exc);
            };
          }
          console.log(channel)
          if (!channel) return;
          try {
            var webhook =
              (await channel.fetchWebhooks()).find(
                (x) => x.owner?.id === bot.user?.id
              ) ||
              (await channel.createWebhook({
                name: "Chat Sync",
                reason: "No Webhook was available",
              }));
            const guildBtn = new ButtonBuilder()
              .setLabel("From: " + message.guildId)
              .setEmoji("👋")
              .setStyle(ButtonStyle.Secondary)
              .setCustomId("from-btn")
              .setDisabled(true);

            const row =
              new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                guildBtn
              );
            await webhook.send({
              avatarURL: message.author.avatarURL() || undefined,
              content: message.content,
              username:
                message.author.username + " ( " + message.author.id + " )",
              components: [row],
              allowedMentions: {
                repliedUser: false,
                parse: [],
                roles: [],
                users: [],
              },
            });
          } catch {
            () => {
              console.log("Couldnt Create a Webhook");
            };
          }
        }
      });
    }
  }
}
