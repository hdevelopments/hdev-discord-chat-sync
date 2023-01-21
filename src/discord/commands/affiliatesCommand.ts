import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from "discord.js";
import { Discord, Slash } from "discordx";

const affiliates = [
  {
    name: "BytesToBits",
    description: `BytesToBits is a community for developers, providing people with like-minded people to chat and have fun with!

  🔗 Check us out:
          => 🌐 Website: https://bytestobits.dev/`,
    invite: "https://discord.gg/bytestobits",
    image:
      "https://cdn.discordapp.com/attachments/816811551079923763/982460251506880552/BytesToBitsBanner.png",
  },
  {
    name: "Timezones Bot",
    description: `The only bot you need to play with friends in a different timezone!
    
    🔗 Bot-Invite: https://discord.com/api/oauth2/authorize?client_id=1023653781398884431&permissions=66624&scope=bot%20applications.commands`,
    invite: "https://discord.gg/pvBzwQur7M",
    image:
      "https://cdn.discordapp.com/attachments/1053061855876222976/1065933915073806336/image.png",
  },
];

@Discord()
class affiliatesCommand {
  @Slash({
    description: "Gets you the affiliates of the Bot.",
  })
  async affiliates(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply("Here are my Affiliates:")
    affiliates.forEach(async (x) => {
      var embed = new EmbedBuilder();
      embed.setTitle(x.name);
      embed.setDescription(x.description);
      embed.setImage(x.image);

      const affiliateBtn = new ButtonBuilder()
      .setLabel(`Check out ${x.name}!`)
      .setStyle(ButtonStyle.Link)
      .setURL(x.invite);

      var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        affiliateBtn
      );
      await interaction.followUp({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    });
  }
}
