import { Channel } from "diagnostics_channel";
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
    var allGuilds = await this.GuildConfig.getAllChannels();
    var allChannels = allGuilds
      .filter((x) => !x.banned)
      .flatMap((x) =>
        Object.entries(x.channels)
          .filter((x) => x[1].category === category)
          .map((x) => x[1])
      );
    console.log(allGuilds);
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
      /<a:[A-Z0-9\_\+\/\{\}\\]+:(\d+)>/gim
    );
    var emojis = message.content.matchAll(/<:[A-Z0-9\_\+\/\{\}\\]+:(\d+)>/gim);
    var urls = Array.from(
      message.content.matchAll(/(http[s]?:\/\/([^ \n])*)/gim)
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
    allChannels.forEach(async (x, i) => {
      if (!x.channel || x.channel === message.channelId) return;
      var guildConfig = await this.GuildConfig.getOrCreate(x.guild);
      var channel: BaseGuildTextChannel;
      try {
        channel = (bot.channels.cache.find(
          (channel) => channel.id === x.channel
        ) || (await bot.channels.fetch(x.channel))) as BaseGuildTextChannel;
      } catch (exc: any) {
        console.log(exc);
        var foundGuild = allGuilds.find((x) => x.guild === x.guild);
        if (!foundGuild) return;
        delete foundGuild?.channels[x.channel];
        await this.GuildConfig.save(foundGuild!);
        return;
      }
      if (!channel) return;
      var rowForGuild = new ActionRowBuilder<MessageActionRowComponentBuilder>(
        row
      );

      if (urls.length > 0 && !guildConfig.configs["noEmbededLinks"]) {
        const links = new ButtonBuilder()
          .setLabel("Click if you want to see embeded versions of the links!!")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("details-links");

        rowForGuild.addComponents(links);
      }
      try {
        embed.setDescription(text);

        await channel.send({
          embeds: [embed],
          components: [rowForGuild],
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
    });
  }
}
