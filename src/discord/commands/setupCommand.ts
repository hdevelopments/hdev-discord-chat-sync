import {
  APISelectMenuOption,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  CommandInteraction,
  MessageActionRowComponentBuilder,
  MessageEditOptions,
  RestOrArray,
  SelectMenuComponentOptionData,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  EmbedBuilder,
  StringSelectMenuOptionBuilder,
  NewsChannel,
  PrivateThreadChannel,
  PublicThreadChannel,
  TextChannel,
  VoiceChannel,
  PermissionsBitField,
  PermissionResolvable,
  Interaction,
  GuildMember,
  GuildTextBasedChannel,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AnySelectMenuInteraction,
  ButtonStyle,
  ModalSubmitInteraction,
} from "discord.js";
import {
  Discord,
  SlashGroup,
  Guard,
  Slash,
  SelectMenuComponent,
  ButtonComponent,
  ModalComponent,
} from "discordx";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";
import GlobalConfigService from "../../services/GloablConfigService";
import guildCategory from "../../models/db-models/GuildCategoryModel";
import { options } from "./syncModeration";
import { ObjectId } from "ts-mongodb-orm";
import ChannelModel from "../../models/ChannelModel";

const emojiCategoryData: { [key: string]: { [key: string]: any } } = {
  ["attachments"]: { true: "📁-🌐", false: "🌐", default: "🌐" },
};

function getEmojiForCategory(data: guildCategory) {
  var emojis = "";
  Object.entries(emojiCategoryData).forEach(([name, value], i) => {
    var emoji = data.configs[name];
    emojis += value[emoji] || value["default"];
  });
  return emojis;
}

const emojiChannelData: {
  permission: PermissionResolvable;
  up: string;
  down: string;
}[] = [
  {
    permission: PermissionsBitField.Flags.AttachFiles,
    down: "🌐",
    up: "📁-🌐",
  },
];

function getEmojiForChannel(
  channel:
    | NewsChannel
    | TextChannel
    | PrivateThreadChannel
    | PublicThreadChannel<boolean>
    | VoiceChannel
) {
  var emojis = "- ";
  emojiChannelData.forEach((x) => {
    emojis += channel
      .permissionsFor(channel.guild.members.me!, true)
      .has(x.permission)
      ? x.up
      : x.down;
  });
  return emojis;
}

const step01: SelectMenuComponentOptionData[] = [
  {
    label: "Public Chat-Rooms",
    value: "public",
    description: "Talk to many Servers!",
  },
  {
    label: "Private Chat-Rooms",
    value: "private",
    description: "Private Chat Rooms for only you and your Buddies!",
  },
];

const step02: {
  [key: string]: (
    interaction: AnySelectMenuInteraction,
    guildConfigService: GuildConfigService,
    globalConfig: GlobalConfigService
  ) => Promise<MessageEditOptions | void>;
} = {
  public: async (
    interaction: AnySelectMenuInteraction,
    guildConfigService: GuildConfigService,
    globalConfig: GlobalConfigService
  ) => {
    var categories = await guildConfigService.getAllCategories();
    const publicTopics = new StringSelectMenuBuilder()
      .addOptions(
        categories
          .filter((x) => !x.password)
          .map((x) => {
            return {
              label: x.name,
              value: x._id.toString(),
              description: `${
                x.description ? x.description : "No Description"
              } | ${getEmojiForCategory(x)}`,
            };
          })
      )
      .setCustomId("setup-menu-step-public-1");
    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        publicTopics
      );
    return {
      content: `Select the Chat Room you want to join:
Legend: 
> 🌐 - Chatting Enabled
> 📁 - Attachments Enabled`,
      components: [row],
    };
  },
  private: async (
    interaction: AnySelectMenuInteraction,
    guildConfigService: GuildConfigService,
    globalConfig: GlobalConfigService
  ) => {
    const privateTopics = new StringSelectMenuBuilder()
      .addOptions(
        { label: "Create a Private Topcic", value: "create-private-topic" },
        { label: "Join a Private Topcic", value: "join-private-topic" }
      )
      .setCustomId("setup-menu-step-private-1");
    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        privateTopics
      );
    return {
      content: "Select what you want to do:",
      components: [row],
    };
  },
};

const stepprivate01: {
  [key: string]: (
    interaction: AnySelectMenuInteraction,
    guildConfigService: GuildConfigService,
    globalConfig: GlobalConfigService
  ) => Promise<MessageEditOptions | void>;
} = {};
//  // Create the modal
//  const modal = new ModalBuilder()
//  .setTitle("Report a Message")
//  .setCustomId("join");

// // Create text input fields
// const privateTopicNameComponent = new TextInputBuilder()
//  .setCustomId("private-topic-name")
//  .setLabel("The name of the Topic:")
//  .setStyle(TextInputStyle.Short)
//  .setPlaceholder("The Name!")
//  .setRequired(true);

// const privateTopicPasswordComponent = new TextInputBuilder()
//  .setCustomId("private-topic-password")
//  .setLabel("The Password:")
//  .setPlaceholder("The Password of the Topic")
//  .setStyle(TextInputStyle.Short);

// const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
//  privateTopicNameComponent
// );

// const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
//  privateTopicPasswordComponent
// );

// modal.addComponents(row1, row2);
// interaction.showModal(modal);
@Discord()
@SlashGroup({
  description: "Lets you set up interactively a Cross Server Chat!",
  name: "setup",
  defaultMemberPermissions: ["ManageChannels", "ManageGuild"],
  dmPermission: false,
})
@SlashGroup("setup")
@Guard(noDms)
class setupCommands {
  @Inject()
  private guildConfigService: GuildConfigService;
  @Inject()
  private globalConfig: GlobalConfigService;

  private setupData: {
    [key: string]: {
      channel: Partial<ChannelModel>;
      category: Partial<guildCategory>;
      create: boolean;
    };
  } = {};

  async createResponseForChannel(
    interaction: Interaction,
    channel: GuildTextBasedChannel,
    targetCategory: guildCategory | undefined
  ): Promise<{ override: boolean; embed: EmbedBuilder[] }> {
    var guildCfg = await this.guildConfigService.getOrCreate(
      interaction.guildId!
    );
    var cfg = await this.guildConfigService.getByChannel(
      interaction.guildId!,
      channel.id
    );
    var category: guildCategory | undefined;
    if (cfg !== undefined)
      category = await this.guildConfigService.findCategory(
        new ObjectId(cfg.category)
      );
    var embed = new EmbedBuilder();

    embed.setTimestamp();

    embed.setAuthor({
      name: interaction.user.username,
      iconURL: (interaction.member as GuildMember).avatarURL() || undefined,
    });
    var syncedStatus = cfg ? "✅" : "❌";
    var config: string | undefined;
    var override: boolean = false;
    if (cfg && category) {
      override = true;
      syncedStatus += `\nChat Room: ${
        category.name +
        " " +
        (category.password ? "🔒" : "🔓") +
        " | " +
        getEmojiForCategory(interaction.channel as any) +
        "\n( Available in the Channel: " +
        getEmojiForChannel(interaction.channel as any) +
        " )"
      }`;
      config = `Config:${Object.entries(options)
        .filter((x) => !x[1].globalOnly)
        .map((x) => {
          console.log(x);
          console.log(cfg);
          return `\n> ${x[0]}: ${
            cfg?.configs && cfg?.configs[x[0]] !== undefined
              ? cfg?.configs[x[0]]
              : guildCfg?.configs[x[0]] !== undefined
              ? guildCfg?.configs[x[0]]
              : x[1].default
          }`;
        })}`;
    } else {
      syncedStatus += `\n Available Options: ${getEmojiForChannel(
        interaction.channel as any
      )}`;
    }
    embed.addFields({
      name: "Name:",
      value: `${channel.name}`,
    });

    embed.addFields({
      name: "Synced-Status:",
      value: `${syncedStatus}`,
    });

    if (config)
      embed.addFields({
        name: "Config:",
        value: `${config}`,
      });

    if (targetCategory)
      embed.addFields({
        name: "Target Chat Room:",
        value: `Name: ${targetCategory.name}\n${
          targetCategory.description
            ? "Description: " + targetCategory.description
            : ""
        }`,
      });

    return { override: override, embed: [embed] };
  }

  @Slash({
    description: "Start the setup sequence!",
  })
  async start(interaction: CommandInteraction) {
    // create menu for roles
    const menu = new StringSelectMenuBuilder()
      .addOptions(step01)
      .setCustomId("setup-menu-step-1");
    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        menu
      );
    this.setupData[interaction.user.id + "-" + interaction.guildId] = {
      category: {},
      channel: {},
      create: false,
    };
    interaction.reply({ components: [row] });
  }

  @SelectMenuComponent({ id: "setup-menu-step-1" })
  async setupMenu(interaction: StringSelectMenuInteraction) {
    await interaction.deferUpdate();
    if (!this.setupData[interaction.user.id + "-" + interaction.guildId]) {
      interaction.reply({ content: "This isnt yours!", ephemeral: true });
      return;
    }
    const value = interaction.values?.[0];
    var result = await step02[value](
      interaction,
      this.guildConfigService,
      this.globalConfig
    );
    if (result)
      interaction.message.edit({
        ...result,
      });
  }

  @SelectMenuComponent({ id: "setup-menu-step-public-1" })
  async setupPublicTopic(interaction: StringSelectMenuInteraction) {
    if (!this.setupData[interaction.user.id + "-" + interaction.guildId]) {
      interaction.reply({ content: "This isnt yours!", ephemeral: true });
      return;
    }
    await interaction.deferUpdate();
    const value = interaction.values?.[0];
    const category = await this.guildConfigService.findCategory(
      new ObjectId(value)
    );
    if (!category) {
      interaction.followUp({
        ephemeral: true,
        content: "Sorry something went wrong!",
      });
      return;
    }
    const acceptButton = new ButtonBuilder()
      .setLabel(`I read and accept them!`)
      .setStyle(ButtonStyle.Danger)
      .setCustomId(
        "setup-menu-step-accept--" +
          interaction.user.id +
          "-" +
          interaction.guildId
      );
    const seeTOSButton = new ButtonBuilder()
      .setLabel(`TOS`)
      .setStyle(ButtonStyle.Link)
      .setURL(
        "https://github.com/hdevelopments/hdev-discord-chat-sync/blob/main/tos.md"
      );
    const seePrivacyPolicy = new ButtonBuilder()
      .setLabel(`Privacy Policy`)
      .setStyle(ButtonStyle.Link)
      .setURL(
        "https://github.com/hdevelopments/hdev-discord-chat-sync/blob/main/privacy.md"
      );

    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        acceptButton,
        seeTOSButton,
        seePrivacyPolicy
      );

    this.setupData[interaction.user.id + "-" + interaction.guildId].category =
      category;

    interaction.message.edit({
      content: "Do you accept the TOS and Privacy Policy of Hedges Chatter?",
      components: [row],
    });
  }

  @ButtonComponent({ id: /setup-menu-step-accept--(\d+)/gim })
  async tosAcceptionButton(interaction: ButtonInteraction) {
    if (!this.setupData[interaction.user.id + "-" + interaction.guildId]) {
      interaction.reply({ content: "This isnt yours!", ephemeral: true });
      return;
    }
    await interaction.deferUpdate();
    var options: RestOrArray<
      | StringSelectMenuOptionBuilder
      | SelectMenuComponentOptionData
      | APISelectMenuOption
    > = (await interaction.guild?.channels.fetch())!
      .filter((x) => {
        return (
          x?.isTextBased() &&
          x
            ?.permissionsFor(interaction.guild?.members.me!)
            .has(["SendMessages", "ViewChannel", "ReadMessageHistory"], true)
        );
      })
      .map((x) => {
        return {
          label: x?.name!,
          value: x?.id!,
          description: getEmojiForChannel(x as any),
        };
      });
    if (options.length > 24) {
      options.length = 25;
      options[24] = {
        label: "Custom Channel (Id)",
        value: "custom",
        description: "This happens when you have more than 24 Channels!",
      };
    } else if (options.length === 0) {
      interaction.followUp({
        content: "I dont have anywhere fiting Permissions!",
        ephemeral: true,
      });
      return;
    }
    const publicTopics = new StringSelectMenuBuilder()
      .addOptions(options)
      .setCustomId("setup-menu-step-public-2");
    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        publicTopics
      );
    interaction.message.edit({
      content: `What Channel you want to sync up:
Legend:
> 🌐 - Chatting Available
> 📁 - Attachments Available`,
      components: [row],
    });
  }

  @SelectMenuComponent({ id: "setup-menu-step-public-2" })
  async setupPublicTopicFinal(interaction: StringSelectMenuInteraction) {
    if (!this.setupData[interaction.user.id + "-" + interaction.guildId]) {
      interaction.reply({ content: "This isnt yours!", ephemeral: true });
      return;
    }
    const value = interaction.values?.[0];
    if (value === "custom") {
      const modal = new ModalBuilder()
        .setTitle("Custom ChannelID")
        .setCustomId("setup-menu-topic-custom");

      // Create text input fields
      const channelIdCommponent = new TextInputBuilder()
        .setCustomId("channel-id")
        .setLabel("The Channel ID:")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("The ChannelID")
        .setRequired(true);

      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        channelIdCommponent
      );

      modal.addComponents(row1);
      interaction.showModal(modal);
      return;
    }
    await interaction.deferUpdate();

    const channel = await interaction.guild?.channels?.fetch(value);
    const acceptButton = new ButtonBuilder()
      .setLabel(`Yes Perfect!`)
      .setStyle(ButtonStyle.Primary)
      .setCustomId("setup-menu-step-finish");
    const declineButton = new ButtonBuilder()
      .setLabel(`No! Choose different One!`)
      .setStyle(ButtonStyle.Danger)
      .setCustomId(
        "setup-menu-step-public-accept--" +
          interaction.user.id +
          "-" +
          interaction.guildId
      );

    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        acceptButton,
        declineButton
      );

    this.setupData[interaction.user.id + "-" + interaction.guildId].channel = {
      category:
        this.setupData[
          interaction.user.id + "-" + interaction.guildId
        ].category._id?.toString(),
      channel: channel?.id,
      guild: interaction.guildId!,
    };
    interaction.message.edit({
      content: `Is ${channel?.toString()} (${getEmojiForChannel(channel as GuildTextBasedChannel)}) correct?`,
      components: [row],
    });
  }
  @ModalComponent({ id: "setup-menu-topic-custom" })
  async customId(interaction: ModalSubmitInteraction) {
    const [channelId] = ["channel-id"].map((id) =>
      interaction.fields.getTextInputValue(id)
    );
    const channel = await interaction.guild?.channels?.fetch(channelId);
  }
  @SelectMenuComponent({ id: "setup-menu-step-private-1" })
  async setupPrivateTopic(interaction: StringSelectMenuInteraction) {
    if (!this.setupData[interaction.user.id + "-" + interaction.guildId]) {
      interaction.reply({ content: "This isnt yours!", ephemeral: true });
      return;
    }
    await interaction.deferUpdate();
    const value = interaction.values?.[0];
    if (value === "create-private-topic") {
      this.setupData[interaction.user.id + "-" + interaction.guildId].create =
        true;
    } else {
      this.setupData[interaction.user.id + "-" + interaction.guildId].create =
        false;
    }
  }

  @ButtonComponent({ id: "setup-menu-step-finish" })
  async channelSumUp(interaction: ButtonInteraction) {
    if (!this.setupData[interaction.user.id + "-" + interaction.guildId]) {
      interaction.reply({ content: "This isnt yours!", ephemeral: true });
      return;
    }
    await interaction.deferUpdate();
    var channel = await interaction.guild?.channels.fetch(
      this.setupData[interaction.user.id + "-" + interaction.guildId].channel
        .channel!
    );
    if (!channel || !channel.isTextBased()) {
      interaction.message.edit("Something went wrong! Please retry! (Sorry!)");
      return;
    }
    var category: guildCategory | undefined;

    if (
      !this.setupData[interaction.user.id + "-" + interaction.guildId].create
    ) {
      category = await this.guildConfigService.findCategory(
        this.setupData[interaction.user.id + "-" + interaction.guildId].category
          ._id!
      );
    } else {
      category = await this.guildConfigService.getOrCreateCategory(
        this.setupData[
          interaction.user.id + "-" + interaction.guildId
        ].category._id?.toString()!,
        interaction.user
      );
    }

    var { override, embed } = await this.createResponseForChannel(
      interaction,
      channel,
      category
    );

    const continueButton = new ButtonBuilder()
      .setLabel(override ? "Override" : "Save")
      .setStyle(override ? ButtonStyle.Danger : ButtonStyle.Primary)
      .setCustomId("setup-menu-step-apply");

    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        continueButton
      );

    interaction.message.edit({
      content: null,
      embeds: embed,
      components: [row],
    });
  }
  @ButtonComponent({ id: "setup-menu-step-apply" })
  async setupApply(interaction: ButtonInteraction) {
    if (!this.setupData[interaction.user.id + "-" + interaction.guildId]) {
      interaction.reply({ content: "This isnt yours!", ephemeral: true });
      return;
    }

    if (
      !this.setupData[interaction.user.id + "-" + interaction.guildId].channel
        .channel ||
      !this.setupData[interaction.user.id + "-" + interaction.guildId].category
        ._id
    ) {
      interaction.reply({
        content: "Please restart the process! Something went wrong",
        ephemeral: true,
      });
      return;
    }
    interaction.deferUpdate();
    var data = await this.guildConfigService.getOrCreate(interaction.guildId!);
    if (!data.channels) data.channels = {};
    data.channels[
      this.setupData[
        interaction.user.id + "-" + interaction.guildId
      ].channel.channel!
    ] = {
      category:
        this.setupData[
          interaction.user.id + "-" + interaction.guildId
        ].category._id?.toString()!,
      channel:
        this.setupData[interaction.user.id + "-" + interaction.guildId].channel
          .channel!,
      guild: interaction.guildId!,
      configs: {},
      lastMessages: {},
    };
    await this.guildConfigService.save(data);
  }
}
