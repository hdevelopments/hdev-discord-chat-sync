import {
  ActionRowBuilder,
  AttachmentBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  hyperlink,
  Message,
  MessageActionRowComponentBuilder,
  MessageCreateOptions,
} from "discord.js";
import { ObjectID } from "ts-mongodb-orm";
import { Inject, Service } from "typedi";
import bot from "../main";
import GuildConfigService from "../services/GuildConfigService";
export async function asyncForEach<T>(
  array: T[],
  callback: (value: T, index: number, array: any[]) => unknown
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
@Service()
export default class syncUtils {
  @Inject()
  private GuildConfig: GuildConfigService;

  async sendToAllChannels(
    category: string | undefined,
    message: Message | MessageCreateOptions
  ) {
    var text: string | undefined;

    var row: ActionRowBuilder<MessageActionRowComponentBuilder>;
    var allGuilds = await this.GuildConfig.getAllChannels();
    var allChannels = allGuilds
      .filter((x) => !x.banned)
      .flatMap((x) =>
        Object.entries(x.channels)
          .filter((x) => category === undefined || x[1].category === category)
          .map((x) => x[1])
      );
    var urls;
    if ("member" in message) {
      var foundCategory = await this.GuildConfig.findCategory(
        new ObjectID(category)
      );
      if (
        (!message.content || message.content.trim().length === 0) &&
        message.stickers.size === 0 &&
        message.attachments.size === 0 &&
        foundCategory?.configs["attachments"]?.toLowerCase() !== "true"
      )
        return;

      const guildBtn = new ButtonBuilder()
        .setLabel("Details")
        .setEmoji("ℹ️")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(
          "details-" +
            message.channelId +
            "-" +
            message.id +
            "-" +
            message.author.id +
            "-" +
            message.guildId
        );
      const categoryBtn = new ButtonBuilder()
        .setLabel(foundCategory?.name || "No Category")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("details-category")
        .setDisabled(true);
      row =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          guildBtn,
          categoryBtn
        );
      var author = await message.author.fetch(true);
      var embed = new EmbedBuilder();

      embed.setAuthor({
        name: message.member?.nickname || message.author.username,
        iconURL:
          message.member?.avatarURL() ||
          message.author.avatarURL() ||
          message.author.defaultAvatarURL ||
          undefined,
      });

      embed.setFooter({
        text: "From the Guild: " + message.guild?.name,
        iconURL: message.guild?.iconURL() || undefined,
      });

      embed.setColor(author.hexAccentColor || "Blurple");
      embed.setTimestamp(Date.now());

      var isInBotCache = false;
      var original = message.content;
      if (original.trim().length === 0 && message.stickers.size > 0) {
        message.stickers.forEach((x) => {
          original += x.url + " \n ";
        });
      }

      embed.setDescription(original || null);

      text = original;
      if (original && text) {
        var animatedemojis = original.matchAll(
          /<a:[A-Z0-9\_\+\/\{\}\\]+:(\d+)>/gim
        );
        var emojis = original.matchAll(/<:[A-Z0-9\_\+\/\{\}\\]+:(\d+)>/gim);
        for (let n of emojis) {
          let url = hyperlink(
            n[0],
            "https://cdn.discordapp.com/emojis/" + n[1] + ".png?v=1",
            "The custom Emote"
          );
          if (bot.emojis.cache.get(n[1])) {
            isInBotCache = true;
          } else {
            text = text.replaceAll(n[0], url);
          }
        }

        for (let n of animatedemojis) {
          let url = hyperlink(
            n[0],
            "https://cdn.discordapp.com/emojis/" + n[1] + ".gif?v=1",
            "The custom Emote"
          );
          if (bot.emojis.cache.get(n[1])) {
            isInBotCache = true;
          } else {
            text = text.replaceAll(n[0], url);
          }
        }
        urls = Array.from(text.matchAll(/(http[s]?:\/\/([^ \n])*)/gim));
      }

      if (isInBotCache) {
        const customemojis = new ButtonBuilder()
          .setLabel("Some Emojis are custom!")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("details-customemojis")
          .setDisabled(true);
        row.addComponents(customemojis);
      }
    }
    if (text === "") {
      text = undefined;
    }
    var refText: string;
    var referenceEmbed: EmbedBuilder;
    if ("member" in message && message.reference) {
      referenceEmbed = new EmbedBuilder();
      var ref = await message.fetchReference();
      var refContent = ref.content.replaceAll(/(Replied to.*:.\n>)/gim, "");
      referenceEmbed.setDescription(
        `Replied to:
            > ${
              refContent.replace(/\n|\r/g, "").substring(0, 50) +
              (ref.embeds.length > 0
                ? ref.embeds[0].description
                  ? " [Embeds] " +
                    (ref.embeds[0].description.startsWith("Replied to")
                      ? ref.embeds[1].description
                          ?.replace(/\n|\r/g, "")
                          .substring(0, 50)
                      : ref.embeds[0].description
                          ?.replace(/\n|\r/g, "")
                          .substring(0, 50))
                  : ""
                : "") +
              (ref.attachments.size > 0 ? " [Files]" : "") +
              "..."
            }
             `
      );
      referenceEmbed.setFooter({
        text: ref.member?.displayName || ref.author.username,
        iconURL:
          ref.member?.avatarURL() ||
          ref.author.avatarURL() ||
          ref.author.defaultAvatarURL,
      });
      refText =
        `Replied to ${
          ref.member?.displayName || ref.author.username
        }: \n> ${
          refContent.replace(/\n|\r/g, "").substring(0, 50) +
          (ref.embeds.length > 0
            ? ref.embeds[0].description
              ? " [Embeds] " +
                (ref.embeds[0].description.startsWith("Replied to")
                  ? ref.embeds[1].description
                      ?.replace(/\n|\r/g, "")
                      .substring(0, 50)
                  : ref.embeds[0].description
                      ?.replace(/\n|\r/g, "")
                      .substring(0, 50))
              : ""
            : "") +
          (ref.attachments.size > 0 ? " [Files]" : "") +
          "..."
        } \n` + text;
    }
    allChannels.forEach(async (x, i) => {
      if (
        !x.channel ||
        ("member" in message && x.channel === message.channelId)
      )
        return;

      x.configs = x.configs || {};
      var guildConfig = await this.GuildConfig.getOrCreate(x.guild);
      var channel: BaseGuildTextChannel;
      try {
        channel = (await bot.channels.fetch(x.channel, {
          cache: true,
        })) as BaseGuildTextChannel;
      } catch (exc: any) {
        console.log(exc);
        var foundGuild = allGuilds.find(
          (guildcfg) => guildcfg.guild === x.guild
        );
        if (!foundGuild) return;
        delete foundGuild?.channels[x.channel];
        await this.GuildConfig.save(foundGuild!);
        console.log("Removed " + x.channel);
        return;
      }
      if (!channel) return;
      if (!("member" in message)) {
        await channel.send(message);
        return;
      }
      var guildEmbed = new EmbedBuilder(embed.toJSON());

      var rowForGuild = new ActionRowBuilder<MessageActionRowComponentBuilder>(
        row
      );

      if (
        guildEmbed.data.author &&
        ((guildConfig.configs["noButtons"]?.toLowerCase() === "true" &&
          x.configs["noButtons"]?.toLowerCase() !== "false") ||
          x.configs["noButtons"]?.toLowerCase() === "true")
      ) {
        guildEmbed.data.author.name += ` (${message.author.id})`;
      }
      if (
        urls?.length > 0 &&
        ((guildConfig.configs["noEmbeddedLinks"]?.toLowerCase() === "false" &&
          guildConfig.configs["type"] !=
            "Webhook ( Small, it does need the Webhook permission! )") ||
          (x.configs["type"] !=
            "Webhook ( Small, it does need the Webhook permission! )" &&
            x.configs["noEmbeddedLinks"]?.toLowerCase() !== "true"))
      ) {
        const links = new ButtonBuilder()
          .setLabel("Preview embedded version of links!")
          .setStyle(ButtonStyle.Primary)
          .setCustomId("details-links");

        rowForGuild.addComponents(links);
      }
      guildEmbed.setDescription(text || null);
      var files = [
        ...message.attachments.map((val) => {
          return new AttachmentBuilder(val.attachment, {
            description: val.description || undefined,
            name: val.name || undefined,
          });
        }),
      ];
      if (
        guildConfig.configs["type"] !=
          "Webhook ( Small, it does need the Webhook permission! )" &&
        x.configs["type"] !=
          "Webhook ( Small, it does need the Webhook permission! )"
      ) {
        try {
          await channel.send({
            embeds: referenceEmbed
              ? [referenceEmbed, guildEmbed]
              : [guildEmbed],
            components:
              guildConfig.configs["noButtons"]?.toLowerCase() === "true" ||
              x.configs["noButtons"]?.toLowerCase() === "true"
                ? []
                : [rowForGuild],
            allowedMentions: {
              repliedUser: false,
              parse: [],
              roles: [],
              users: [],
            },
            files:
              foundCategory?.configs["attachments"]?.toLowerCase() === "true"
                ? files
                : [],
          });
        } catch (exc: any) {
          console.log("Failed to Send Message in ");
          console.log(x.guild);
          console.log(x.channel);
          console.log(exc);
        }
      } else {
        try {
          var webhook =
            (await channel.fetchWebhooks()).find(
              (x) => x.owner?.id === bot.user?.id
            ) ||
            (await channel.createWebhook({
              name: "Hedges Chatter Webhook",
              reason: "No valid webhook found before!",
            }));
          if (text)
            webhook.send({
              content: refText || text,
              components:
                guildConfig.configs["noButtons"]?.toLowerCase() === "true" ||
                x.configs["noButtons"]?.toLowerCase() === "true"
                  ? []
                  : [rowForGuild],
              username:
                (message.member?.nickname || message.author.username) +
                (((guildConfig.configs["noButtons"]?.toLowerCase() === "true" ||
                  x.configs["noButtons"]?.toLowerCase() === "true") &&
                  ` (${message.author.id})`) ||
                  ""),
              avatarURL:
                message.member?.avatarURL() ||
                message.author.avatarURL() ||
                message.author.defaultAvatarURL ||
                undefined,
              allowedMentions: {
                repliedUser: false,
                parse: [],
                roles: [],
                users: [],
              },
              files:
                foundCategory?.configs["attachments"]?.toLowerCase() === "true"
                  ? files
                  : [],
            });
        } catch (exc) {
          console.log("Failed to Send Message in ");
          console.log(x.guild);
          console.log(x.channel);
          console.log("Failed to Send Message in ");

          console.log(exc);
        }
      }
    });
  }
}
