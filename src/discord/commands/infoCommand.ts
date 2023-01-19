import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { Discord, Guard, Slash } from "discordx";
import bot from "../../main";

@Discord()
class infoCommand {
  @Slash({
    description: "Gets you some information about the bot.",
  })
  async info(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    var embed = new EmbedBuilder();

    embed.setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.avatarURL() || undefined,
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
      name: "Github",
      value: "https://github.com/hdevelopments/hdev-discord-chat-sync",
      inline: true,
    });
    embed.addFields({ name: "Ping", value: String(bot.ws.ping) + "ms" });

    var embedTwo = new EmbedBuilder();

    embedTwo.setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.avatarURL() || undefined,
    });
    embedTwo.setColor(Colors.Green);

    embedTwo.addFields({
      name: "How to Start",
      value:
        "> You can start syncing a chat Channel with:\n> **`/moderation setchannel channel:yourchannel`**\n> and then select your wanted topic!",
    });
    embedTwo.addFields({
      name: "Create a private Topic",
      value:
        "> You can easily create your private Topic with:\n> **`/topic create topic:mytopic password:1234`**\n> and then Join it on another or the same Server with: \n> **`/topic join topic:mytopic password:1234 channel:mychannel`**",
    });

    const shareBtn = new ButtonBuilder()
      .setLabel("Invite the Bot!")
      .setStyle(ButtonStyle.Link)
      .setURL(
        "https://discord.com/api/oauth2/authorize?client_id=1046756800260735058&permissions=533113203777&scope=bot%20applications.commands"
      );

    const affiliateBtn = new ButtonBuilder()
      .setLabel("Check out BytesToBits!")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/bytestobits-coding-614895425639546881");
    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        shareBtn, affiliateBtn
      );
    await interaction.editReply({
      embeds: [embed, embedTwo],
      components: [row],
    });
  }
}
