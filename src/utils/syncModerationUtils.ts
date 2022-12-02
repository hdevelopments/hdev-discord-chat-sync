import {
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Message,
  MessageActionRowComponentBuilder,
  Webhook,
} from "discord.js";
import { ButtonComponent } from "discordx";
import { ObjectID } from "ts-mongodb-orm";
import { Inject, Service } from "typedi";
import bot from "../main";
import GuildConfigService from "../services/GuildConfigService";

@Service()
export default class syncUtils {
  @Inject()
  private GuildConfig: GuildConfigService;
  async sendToAllChannels(category: string, message: Message) {
    var foundCategory = await this.GuildConfig.findCategory(new ObjectID(category))
    console.log(category)
    console.log(foundCategory)
    var allGuilds = (await this.GuildConfig.getAllChannels())
      .filter((x) => !x.banned)
      .flatMap((x) =>
        Object.entries(x.channels)
          .filter((x) => x[1].category === category)
          .map((x) => x[1])
      );

    const guildBtn = new ButtonBuilder()
      .setLabel("Details")
      .setEmoji("👋")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("details-" + message.channelId + "-" + message.id);
    const categoryBtn = new ButtonBuilder()
      .setLabel(foundCategory?.name || "No Category")
      .setStyle(ButtonStyle.Secondary)
      .setCustomId("details-category")
      .setDisabled(true);
    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        guildBtn,
        categoryBtn
      );
    allGuilds.forEach(async (x) => {
      if (!x.channel || x.channel === message.channelId) return;

      try {
        var channel = (bot.channels.cache.find(
          (channel) => channel.id === x.channel
        ) || (await bot.channels.fetch(x.channel))) as BaseGuildTextChannel;

        if (!channel) return;
        let webhook: Webhook;

        try {
          webhook =
            (await channel.fetchWebhooks()).find(
              (x) => x.owner?.id === bot.user?.id
            ) ||
            (await channel.createWebhook({
              name: "Chat Sync",
              reason: "No Webhook was available",
            }));

          await webhook.send({
            avatarURL: message.author?.avatarURL() || undefined,
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
        } catch (exc: any) {
          console.log(exc);
          channel.send({
            content:
              message.member?.displayName +
              "(" +
              message.member?.id +
              "):" +
              message.content,
            components: [row],
          });
        }
      } catch (exc: any) {}
    });
  }
}
