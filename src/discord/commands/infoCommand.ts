import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import {
  Discord,
  Guard,
  Slash,
} from "discordx";
import { noDms } from "../guards/noDms";
import bot from "../../main";

@Discord()
@Guard(noDms)
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

    const shareBtn = new ButtonBuilder()
      .setLabel("Invite the Bot!")
      .setStyle(ButtonStyle.Link)
      .setURL(
        "https://discord.com/api/oauth2/authorize?client_id=1046756800260735058&permissions=533113203777&scope=bot%20applications.commands"
      );
    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        shareBtn
      );
    await interaction.editReply({ embeds: [embed], components: [row] });
  }
}
