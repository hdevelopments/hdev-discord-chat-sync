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
import Logs from "../../utils/Logs";

@Discord()
export class pingReact {
  @On({ event: "messageCreate" })
  async checkMessages([message]: ArgsOf<"messageCreate">) {
    if(message.reference?.messageId){
      var ref = await message.fetchReference()
      if(ref.author.id == bot.user?.id){
        return
      }
    }
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
        value: "</info:1060278568447398009>",
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
          shareBtn,
          joinSupport
        );
      await message.reply({ embeds: [embed], components: [row] });
    }
  }

  @On({ event: "guildCreate" })
  async sendWelcomeMessage([guild]: ArgsOf<"guildCreate">) {
    var embed = new EmbedBuilder();
    embed.setColor(Colors.Gold);
    embed.setDescription(`Thank you for adding me to the Server!
    
    Note: 
    > This Bot is a hobby project! 
    > This should be a bot for fun and interesting discussions!
    
    > The TOS (Guidelines) and Privacy Policy see: 
    > https://github.com/hdevelopments/hdev-discord-chat-sync
    > If you use the Bot you agree with those!

    Preperation:
    > Create a Channel or Use a already existing Channel
    > To use the Bot normaly please allow him to see in the channel and send in the channel!
    > To use Webhooks please allow him the "Manage Webhook" Permission on that Channel you want to sync!
    > If you have any issues please come to the Support Discord! I help you with anything!

    How to start:

    > 1. Use </moderation setchannel:1046757798005968946> and select your wanted Channel and your Topic!
    > >  Keep in mind: Use a not crowded channel of yours, or we will take actions because we want healthy discussions and not Spam! 
    >    (So please make it in a extra channel for example "global-chat" )
    > 1.1 If it was succesfull and all Permissions work he should have written now "<Your Server Name> joined the chat!" 
          If not please check for errors or the Bots permission on that channel!
    > 2. Use </moderation set:1046757798005968946> for Global Settings or </chat set:1061680120521314364> for only one Chat Settings 
    > >  Chat Settings override Global Settings!

    > The Bot is now set up! Please dont expect that 1000000 messages are rushing in! The Bot is fresh and we all dont want such spam!

    > Please keep your Chat Spam- / Insult- / Toxicity- /Racism- Free ( Simply use automod )! Repeating breaking such simple rules will result in a Ban!

    Here are some more informations:`);
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
      value: "</info:1060278568447398009>",
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
        shareBtn,
        joinSupport
      );
    setTimeout(async () => {
      var owner = await guild.fetchOwner({ force: true });
      try {
        var dm = await owner.createDM(true);

        await dm.send({ embeds: [embed], components: [row] });
      } catch (exc) {
        console.log(exc);
        Logs.SendLog(
          `The Owner ${owner.user.username} | ${owner.user.id} couldnt be notified!`
        );
      }
    }, 5000);
  }
}
