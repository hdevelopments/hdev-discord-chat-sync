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
    name: "Game Dev Space",
    description: `**Welcome to Game Dev Space  A Community for Game Developers and Unity who are Passionate in Games**
    ╔═══════════════════════════
    ║ **The perfect place for game dev from the skill level of a beginner to advanced level**
    ╠ :school: Learn - from experienced game developers
    ╠ :handshake: Help - solving problems for each other
    ╠ :man_teacher: Teach - to aspiring newbies looking to learn more!
    ╠ :scroll: Friendly - We are friendly community with good environment and staff
    ╠ :people_hugging:Experts - Great experts to help you with your game dev journey!
    ╠ :performing_arts:Roles - Self roles with special roles
    ╠ :love_letter:Channels - Different channels to talk in 
    ╠ :heart_decoration:Meetings - Meeting with staff and Developer
    ╠ :handshake:Partnerships - Open Partnerships/No Requirements
    ╠ :love_letter:Suggestions - We listen to your Suggestions & Feedback
    ╠ :teacher: Assets - Free Assets to build your game and skills
    ═══════════════════════════
    ║**Come and Join us**
    ║Server Invite: https://discord.gg/c6VrE3pmn3`,
    invite: "https://discord.gg/c6VrE3pmn3",
    image:
      "https://media.discordapp.net/attachments/1071103861483384904/1071111697336631378/GDS.png?width=1248&height=703",
  },
  {
    name: "Bot Hive",
    description: `:bee: Welcome to Bot Hive – the ultimate network of bots! :robot:

    Our team of developers have created a range of bots to cater to all your needs. From productivity bots to entertainment bots, our hive has got you covered.
    
    Visit our website at :globe_with_meridians: https://bothive.dev/ :globe_with_meridians: to learn more about our bots and how to get started. 
    Join our hive today and experience the power of having multiple bots at your fingertips! :rocket:
    
    ╭─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
    ┃ :computer: Visit our website at https://bothive.dev/                      |
    ┃ :rocket: View a list of our bots at https://bothive.dev/bots    |
    ╰─━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ╯`,
    image:
      "https://cdn.discordapp.com/attachments/1078658206903058512/1078664533834485840/1.png",
    invite: "https://discord.gg/b3eExYpP5P",
  },
  {
    name: "Sheriff Bumpy",
    description: `The Bump Bot on your Side. I help you boosting your server.`,
    image:
      "https://cdn.discordapp.com/attachments/1084072532111527986/1084094911302877234/Sheriff_Bumpy.png",
    invite: "https://discord.gg/TePFzavEBs",
  },
  {
    name: "BytesToBits",
    description: `BytesToBits is a community for developers, providing people with like-minded people to chat and have fun with!

  🔗 Check us out:
          => 🌐 Website: https://bytestobits.dev/`,
    invite: "https://bytestobits.dev/discord",
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
    affiliates.forEach(async (x, i) => {
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
      setTimeout(async () => {
        await interaction.followUp({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        });
      }, 1000 * i);
    });
  }
}
