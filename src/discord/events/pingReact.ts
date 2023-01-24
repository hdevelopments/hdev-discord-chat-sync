import { ArgsOf, Discord, On } from "discordx";
import bot from "../../main";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";

@Discord()
export class pingReact {
  @On({ event: "messageCreate" })
  async checkMessages([message]: ArgsOf<"messageCreate">) {
    if (message.mentions.has(bot.user!)) {
      var embed = new EmbedBuilder();
      embed.setAuthor({
        name: message.member?.displayName || message.author.username,
        iconURL:
          message.member?.avatarURL() ||
          message.author.avatarURL() ||
          message.author.defaultAvatarURL,
      });
      embed.setColor(Colors.Gold);

      embed.addFields({
        name: "Creator",
        value: "<@710213572898193428>",
        inline: true,
      });
      embed.addFields({
        name: "Support Server",
        value: "https://discord.gg/hdev",
        inline: true,
      });
      embed.addFields({
        name: "Help Command:",
        value: "</info:>",
        inline: true,
      });
      const shareBtn = new ButtonBuilder()
        .setLabel("Invite the Bot!")
        .setStyle(ButtonStyle.Link)
        .setURL(
          "https://discord.com/api/oauth2/authorize?client_id=1046756800260735058&permissions=533113203777&scope=bot%20applications.commands"
        );
      const joinSupport = new ButtonBuilder()
        .setLabel("Join the Support Server!")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/hdev");
      var row =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          shareBtn, joinSupport
        );
      await message.reply({ embeds: [embed], components: [row] });
    }
  }
}
