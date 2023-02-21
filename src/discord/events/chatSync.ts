import { ArgsOf, ButtonComponent, Discord, ModalComponent, On } from "discordx";
import { Inject } from "typedi";
import {
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonInteraction,
  MessageType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  InteractionType,
  MessageActionRowComponentBuilder,
  ButtonStyle,
  ButtonBuilder,
  GuildTextBasedChannel,
} from "discord.js";
import GuildConfigService from "../../services/GuildConfigService";
import bot from "../../main";
import syncUtils from "../../utils/syncModerationUtils";
import { Phishing } from "./anti-phishing";
import GlobalConfigService from "../../services/GloablConfigService";
import Filter from "bad-words";
var profanityfilter = new Filter();

profanityfilter.addWords(
  ...["fuck you", "fuc u", "fuck u", "shut up", "shutup", "stfu"]
);
profanityfilter.removeWords(...["escalate"]);

@Discord()
export class chatSync {
  @Inject()
  private guildConfig: GuildConfigService;
  @Inject()
  private phishingService: Phishing;
  @Inject()
  private syncUtils: syncUtils;
  @Inject()
  private globalConfigService: GlobalConfigService;

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
    var foundChannel = config.channels[message.channelId];
    if (!foundChannel) return;
    var category = await this.guildConfig.getByCategoryId(
      foundChannel.category
    );
    if (
      typeof foundChannel.lastMessages === "number" ||
      !foundChannel.lastMessages
    ) {
      foundChannel.lastMessages = {};
      config.channels[message.channelId] = foundChannel;
      await this.guildConfig.save(config);
    }
    var globalConf = await this.globalConfigService.getOrCreate();
    if (
      globalConf.blacklisted[message.author.id] ||
      profanityfilter.isProfane(message.content) ||
      ((await this.globalConfigService.isBlacklistedText(message.content)) &&
        category?.name !== "Self Promotion")
    ) {
      return;
    }
    if (
      !config ||
      config.banned ||
      !config.channels ||
      message.content.startsWith("/") ||
      message.content.startsWith("!")
    ) {
      return;
    }

    var phishingresult = await this.phishingService.checkForPhishing(message);
    if (phishingresult === true) {
      var logchannel = (await bot.channels.fetch(
        "1051147189243621477"
      )) as GuildTextBasedChannel;
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
      !category?.password &&
      !config.vip &&
      Date.now() - (foundChannel.lastMessages[message.author.id] || 0) < 750
    ) {
      foundChannel.lastMessages[message.author.id] = Date.now();
      message.react("❌").catch(() => {
        message.channel
          .send({ content: `${message.author.toString()} - Please dont spam!` })
          .then((x) => x.delete().catch((x) => {}))
          .catch((x) => {
            message.member?.createDM(true).then((x) => {
              x.send("Dont Spam in Chat!").catch((x) => {});
            });
          });
      });
      return;
    }
    await this.syncUtils.sendToAllChannels(foundChannel.category, message);
    foundChannel.lastMessages[message.author.id] = Date.now();
    this.guildConfig.save(config);
  }

  allowedCommands = [{ name: "time", bot: "1023653781398884431" }];

  @On({ event: Events.MessageCreate, priority: 2 })
  async handleInteraction([
    message,
  ]: ArgsOf<Events.MessageCreate>): Promise<void> {
    var config = await this.guildConfig.getOrCreate(message.guildId!);
    var foundChannel = config.channels[message.channelId];
    if (!foundChannel) return;
    if (
      message.interaction &&
      message.interaction.type === InteractionType.ApplicationCommand &&
      this.allowedCommands.find(
        (x) =>
          x.name === message.interaction?.commandName &&
          x.bot === message.author.id
      )
    ) {
      setTimeout(async () => {
        var doneMessage = await message.fetch(true);
        const botInfoBtn = new ButtonBuilder()
          .setLabel(`From ${doneMessage.author.username}!`)
          .setStyle(ButtonStyle.Primary)
          .setCustomId("details-botInfo")
          .setDisabled(true);
        const botAffiliationBtn = new ButtonBuilder()
          .setLabel(`Check /affiliates for more Infos!`)
          .setStyle(ButtonStyle.Secondary)
          .setCustomId("details-affiliates")
          .setDisabled(true);
        var row: ActionRowBuilder<MessageActionRowComponentBuilder> =
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            botInfoBtn,
            botAffiliationBtn
          );
        await this.syncUtils.sendToAllChannels(foundChannel.category, {
          channelId: message.channelId,
          embeds: doneMessage.embeds,
          components: [row],
        });
      }, 5000);
    }
  }

  @ButtonComponent({ id: /details-(\d+)-(\d+)(-(\d+)-(\d+))?/ })
  async doDetails(interaction: ButtonInteraction) {
    var data = interaction.customId.split("-");

    var channelId = data[1];
    var messageId = data[2];
    var userId = data[3];
    var guildId = data[4];

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
      console.log(exc);
      // Create text input fields
      const errorComponent = new TextInputBuilder()
        .setCustomId("error")
        .setLabel("Message")
        .setStyle(TextInputStyle.Short)
        .setValue(
          "An error occured! (Guild / Channel is not existing anymore?)"
        )
        .setRequired(false);
      const dataComponent = new TextInputBuilder()
        .setCustomId("error-info")
        .setLabel("Found Data")
        .setStyle(TextInputStyle.Paragraph)
        .setValue(
          `ChannelID: ${channelId}\nMessageID: ${messageId}\nUserID: ${userId}\nServerID: ${guildId}`
        )
        .setRequired(false);
      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        errorComponent
      );
      const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        dataComponent
      );
      modal.addComponents(row1, row2);
      interaction.showModal(modal);
    }
  }

  @ModalComponent({ id: "details-dummy" })
  async dummy(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply("Ok");
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
