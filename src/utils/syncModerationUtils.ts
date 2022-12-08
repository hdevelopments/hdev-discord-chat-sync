import {
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ColorResolvable,
  EmbedBuilder,
  hyperlink,
  Message,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { ObjectID } from "ts-mongodb-orm";
import { Inject, Service } from "typedi";
import bot from "../main";
import GuildConfigService from "../services/GuildConfigService";

@Service()
export default class syncUtils {
  @Inject()
  private GuildConfig: GuildConfigService;
  async sendToAllChannels(category: string, message: Message) {
    var foundCategory = await this.GuildConfig.findCategory(
      new ObjectID(category)
    );
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
    var author = await message.author.fetch(true);

    var embed = new EmbedBuilder();

    embed.setAuthor({
      name: message.author.username,
      iconURL: message.author.avatarURL() || undefined,
    });
    embed.setFooter({
      text: "From the Guild: " + message.guild?.name,
      iconURL: message.guild?.iconURL() || undefined,
    });
    embed.setColor((author.hexAccentColor as ColorResolvable) || "Blurple");
    embed.setTimestamp(Date.now());
    var isInBotCache = false;
    var text = message.content;
    var animatedemojis = message.content.matchAll(
      /<a:[A-Za-z0-9\_\+\/\{\}\\]+:(\d+)>/gm
    );
    var emojis = message.content.matchAll(
      /<:[A-Za-z0-9\_\+\/\{\}\\]+:(\d+)>/gm
    );
    var tenorUrls = Array.from(
      message.content.matchAll(/(https:\/\/tenor.com\/view[^ ]*)/gm)
    );
    for (let n of emojis) {
      let url = hyperlink(
        n[0],
        "https://cdn.discordapp.com/emojis/" + n[1] + ".png?v=1",
        "The custom Emote"
      );
      text = text.replaceAll(n[0], url);
      if (bot.emojis.cache.get(n[1])) {
        isInBotCache = true;
      }
    }
    for (let n of animatedemojis) {
      let url = hyperlink(
        n[0],
        "https://cdn.discordapp.com/emojis/" + n[1] + ".gif?v=1",
        "The custom Emote"
      );
      text = text.replaceAll(n[0], url);
      if (bot.emojis.cache.get(n[1])) {
        isInBotCache = true;
      }
    }
    for (let n of tenorUrls) {
      console.log(n);
      console.log(tenorUrls);
      const links = new ButtonBuilder()
        .setLabel("Click if you want to see embeded versions of the links!!")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("details-links");
      row.addComponents(links);
    }
    allGuilds.forEach(async (x) => {
      if (!x.channel || x.channel === message.channelId) return;

      try {
        var channel = (bot.channels.cache.find(
          (channel) => channel.id === x.channel
        ) || (await bot.channels.fetch(x.channel))) as BaseGuildTextChannel;

        if (!channel) return;

        try {
          if (isInBotCache) {
            const customemojis = new ButtonBuilder()
              .setLabel(
                "To see some of the custom Emojis you need to be in the guild!"
              )
              .setStyle(ButtonStyle.Primary)
              .setCustomId("details-customemojis")
              .setDisabled(true);
            row.addComponents(customemojis);
          }
          embed.setDescription(text);

          await channel.send({
            embeds: [embed],
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
          embed.setDescription(text);
          channel.send({
            embeds: [embed],
            components: [row],
          });
        }
      } catch (exc: any) {
        console.log(exc);
      }
    });
  }
}
