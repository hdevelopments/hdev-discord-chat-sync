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
    embed.addFields({
      name: "Guilds:",
      value: bot.guilds.cache.size + "",
      inline: true,
    });
    embed.addFields({
      name: "Ping",
      value: String(bot.ws.ping) + "ms",
      inline: true,
    });

    var embedTwo = new EmbedBuilder();

    embedTwo.setAuthor({
      name: interaction.user.username,
      iconURL: interaction.user.avatarURL() || undefined,
    });
    embedTwo.setColor(Colors.Green);
    embed.setDescription("Here is how you set up basic chatting!");
    embedTwo.addFields({
      name: "How to Start",
      value: `> You can start syncing a chat Channel with:
        > **</moderation setchannel:1046757798005968946>**
        > and then select your wanted topic!
        > Keep in mind that the bot needs read and write permissions!
        > (For Webhooks "Manage Webhook" Channel permission)
        > You can change some settings over with </moderation set:1046757798005968946> for Global Settings or </chat set:1061680120521314364> for Chat bound settings`,
    });
    embedTwo.addFields({
      name: "Create a private Topic",
      value: `> You can easily create your private Topic with:
        > **</topic create:1056205032074256414>**\n> and then Join it on another or the same Server with:
        > **</topic join:1056205032074256414>**`,
    });
    embedTwo.addFields({
      name: "Further Infos",
      value: `> TOS and Privacy Policy:
      > https://github.com/hdevelopments/hdev-discord-chat-sync
      > If you use the Bot you agree with those!`,
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
      .setURL("https://discord.gg/bytestobits");
    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        shareBtn,
        affiliateBtn
      );
    await interaction.editReply({
      embeds: [embed, embedTwo],
      components: [row],
    });
  }
}
