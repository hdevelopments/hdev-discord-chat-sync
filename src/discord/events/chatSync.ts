import { ArgsOf, ButtonComponent, Discord, ModalComponent, On } from "discordx";
import { Inject } from "typedi";
import {
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonInteraction,
  MessageType,
  ModalBuilder,
  TextBasedChannel,
  TextInputBuilder,
  TextInputStyle,
  Events,
} from "discord.js";
import GuildConfigService from "../../services/GuildConfigService";
import bot from "../../main";
import syncUtils from "../../utils/syncModerationUtils";
import { Phishing } from "./anti-phishing";
@Discord()
export class chatSync {
  @Inject()
  private guildConfig: GuildConfigService;
  @Inject()
  private phishingService: Phishing;
  @Inject()
  private syncUtils: syncUtils;

  @On({ event: Events.MessageCreate, priority: 1 })
  async handler([message]: ArgsOf<Events.MessageCreate>): Promise<void> {
    if (
      !message.inGuild() ||
      !message.author ||
      message.author.bot ||
      !message.member ||
      message.type === MessageType.ThreadCreated ||
      message.type === MessageType.GuildBoost ||
      message.type === MessageType.GuildBoostTier1 ||
      message.type === MessageType.GuildBoostTier2 ||
      message.type === MessageType.GuildBoostTier3 ||
      message.type === MessageType.ThreadStarterMessage
    ) {
      return;
    }

    var config = await this.guildConfig.getOrCreate(message.guildId!);
    if (
      !config ||
      config.banned ||
      !config.channels ||
      message.content.startsWith("/") ||
      message.content.startsWith("!")
    ) {
      return;
    }

    var foundChannel = config.channels[message.channelId];
    if (!foundChannel) return;
  
    var category = await this.guildConfig.getByCategoryId(foundChannel.category);
    var phishingresult = await this.phishingService.checkForPhishing(message);
    if (phishingresult === true) {
      var logchannel = (await bot.channels.fetch(
        "1051147189243621477"
      )) as TextBasedChannel;

      logchannel.send(
        `Phishing User detected!\nUser: ${message.author.toString()}\nMessage: ||<${
          message.content
        }>||\nGuild: ${message.guild.toString()}-${message.guildId}`
      );
      await message.channel.send(
        `${message.author.toString()} Phishing Link detected!`
      );
      if (message.deletable) {
        message.delete().catch((x) => {
          //ignore
        });
      }
      return;
    }
    if (
      category?.password &&
      config.guild !== "995759386142179358" &&
      !config.vip &&
      Date.now() - (foundChannel.lastMessage || 0) < 500
    ) {
      message.channel
        .send("Toooooo fast cowboy! (" + message.author.toString() + ")")
        .then((x) => {
          setTimeout(() => {
            x.delete().catch((x) => {});
          }, 5000);
        });
      return;
    }
    await this.syncUtils.sendToAllChannels(foundChannel.category, message);
    foundChannel.lastMessage = Date.now();
    this.guildConfig.save(config);
  }
  delayTyping = 0
  @On({ event: "typingStart" })
  async sendTyping([typing]: ArgsOf<"typingStart">) {
    if (!typing.inGuild() || this.delayTyping > Date.now()) return;
    this.delayTyping += Date.now() + 5000
    var channelcfg = await this.guildConfig.getByChannel(
      typing.guild?.id!,
      typing.channel.id
    );
    if (!channelcfg) return;
    try {
      (await this.guildConfig.getAllChannels()).forEach((x) => {
        Object.entries(x.channels).forEach((x) => {
          bot.channels.fetch(x[0]).then(async (channel) => {
            if (channel?.isTextBased && channel.id !== typing.channel.id) {
              await (channel as TextBasedChannel).sendTyping();
            }
          });
        });
      });
    } catch (exc) {
      console.error(exc)
    }
  }

  @ButtonComponent({ id: /details-(\d+)-(\d+)/ })
  async doDetails(interaction: ButtonInteraction) {
    var data = interaction.customId.split("-");

    var channelId = data[1];
    var messageId = data[2];

    var modal = new ModalBuilder()
      .setTitle("Details about a message")
      .setCustomId("details-dummy");

    try {
      var channel = (await bot.channels.fetch(
        channelId
      )) as BaseGuildTextChannel;
      var guildConfig = await this.guildConfig.getOrCreate(channel.guildId!);
      var message =
        channel?.messages.cache.find((x) => x.id === messageId) ||
        (await channel.messages.fetch(messageId));
      const guildComponent = new TextInputBuilder()
        .setCustomId("guild-details")
        .setLabel("Guild:")
        .setStyle(TextInputStyle.Short)
        .setValue(channel.guild.name + " | " + channel.guildId)
        .setRequired(false);
      const row0 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        guildComponent
      );

      const channelComponent = new TextInputBuilder()
        .setCustomId("channel-details")
        .setLabel("Channel:")
        .setStyle(TextInputStyle.Short)
        .setValue(channel.name + " | " + channelId)
        .setRequired(false);
      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        channelComponent
      );

      const messageComponent = new TextInputBuilder()
        .setCustomId("message-details")
        .setLabel("User:")
        .setStyle(TextInputStyle.Short)
        .setValue(message.author.username + " | " + message.author.id)
        .setRequired(false);
      const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        messageComponent
      );
      const inviteComponent = new TextInputBuilder()
        .setCustomId("invite-details")
        .setLabel("Invite:")
        .setStyle(TextInputStyle.Short)
        .setValue("No Invites!")
        .setRequired(false);
      if (!guildConfig.configs["noInvites"]) {
        try {
          inviteComponent.setValue(
            message.guild.invites.cache.find(
              (x) => x.inviterId === bot.user?.id
            )?.url ||
              (await message.guild.invites.create(message.channelId)).url
          );
        } catch (exc: any) {
          // Ignore
        }
      }

      const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        inviteComponent
      );

      modal.addComponents(row0, row1, row2, row3);
      interaction.showModal(modal);
    } catch (exc: any) {
      // Create text input fields
      const errorComponent = new TextInputBuilder()
        .setCustomId("error")
        .setLabel("Message")
        .setStyle(TextInputStyle.Short)
        .setValue(
          "An error occured! (Guild / Channel is not existing anymore?)"
        )
        .setRequired(false);
      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        errorComponent
      );
      modal.addComponents(row1);
      interaction.showModal(modal);
    }
  }
  @ModalComponent({ id: "details-dummy" })
  async dummy(interaction: ButtonInteraction) {
    interaction.deferReply();
    interaction.deleteReply();
  }
  @ButtonComponent({ id: "details-links" })
  async showLinks(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });

    var urls = Array.from(
      interaction.message.embeds[0].description?.matchAll(
        /(http[s]?:\/\/([^ \n])*)/gim
      ) || []
    )
      .map((x) => x[0])
      .join("\n");

    await interaction.editReply({ content: urls || "No Urls found!" });
  }
}
