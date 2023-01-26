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
    name: "Timezones Bot",
    description: `The only bot you need to play with friends in a different timezone!
    
    🔗 Bot-Invite: https://discord.com/api/oauth2/authorize?client_id=1023653781398884431&permissions=66624&scope=bot%20applications.commands`,
    invite: "https://discord.gg/pvBzwQur7M",
    image:
      "https://cdn.discordapp.com/attachments/1053061855876222976/1065933915073806336/image.png",
  },
  {
    name: "NotABot",
    description: `Hey folks i'm very excited to tell you about a new discord bot were building:

    Introducing NotABot
    Instead of being a bot with a ton of features, it's an engine that can run “applets” which you can activate in a marketplace (just like an appstore on your phone).
    It has a user-friendly settings dashboard that makes it easy to set up the different applets and assign e.g. channels to specific functionalities.
    
    Pricing
    NotABot also has a different approach to pricing, instead of completely banning some features from free use, every applet has a monthly fee in our own currency called "Fuel" of which you will have a free monthly quota. 
    This allows you to activate all the applets you want without necessarily having to pay for them, and most likely (depending on your use-case) you won't even have to pay anything!
    
    Cross Server
    Especially for non-server admins, it's interesting that normal users can also install user-centric applets like music, mini-games etc. with NotABot. Those are then available to them on any server with NotABot (as long as the admins don't explicitly ban them).
    
    
    Interested?
    Check out the Website at https://nota.bot/ or join our server https://discord.gg/AkpEHHtahZ`,
    invite: "https://discord.gg/AkpEHHtahZ",
    image:
      "https://cdn.discordapp.com/attachments/1067919780985720892/1068157417612902471/image.png",
  },
  {
    name: "BytesToBits",
    description: `BytesToBits is a community for developers, providing people with like-minded people to chat and have fun with!

  🔗 Check us out:
          => 🌐 Website: https://bytestobits.dev/`,
    invite: "https://discord.gg/bytestobits",
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
    await interaction.editReply("Here are my Affiliates:");
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
        ephemeral: true,
      });
    });
  }
}
