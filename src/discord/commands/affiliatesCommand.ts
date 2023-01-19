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
    invite: "https://discord.gg/bytestobits-coding-614895425639546881",
    image:
      "https://cdn.discordapp.com/attachments/816811551079923763/982460251506880552/BytesToBitsBanner.png",
  },
];

@Discord()
class affiliatesCommand {
  @Slash({
    description: "Gets you the affiliates of the Bot.",
  })
  async affiliates(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    var embeds: EmbedBuilder[] = [];
    affiliates.forEach((x) => {
      var embed = new EmbedBuilder();
      embed.setTitle(x.name);
      embed.setDescription(x.description);
      embed.setImage(x.image);

      embeds.push(embed);
    });

    const affiliateBtn = new ButtonBuilder()
      .setLabel("Check out BytesToBits!")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/bytestobits-coding-614895425639546881");
    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        affiliateBtn
      );
    await interaction.editReply({
      embeds: embeds,
      components: [row],
    });
  }
}
