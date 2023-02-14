import {
  APISelectMenuOption,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  MessageActionRowComponentBuilder,
  MessageEditOptions,
  RestOrArray,
  SelectMenuComponentOptionData,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  EmbedBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import {
  Discord,
  SlashGroup,
  Guard,
  Slash,
  SelectMenuComponent,
  ButtonComponent,
} from "discordx";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";
import GlobalConfigService from "../../services/GloablConfigService";
import guildConfig from "../../models/db-models/GuildConfigModel";
import guildCategory from "../../models/db-models/GuildCategoryModel";

const emojiData: {[key: string]: {[key:string]: any}} = {
  ["attachments"]:{"true": "📁 🌐", "false": "🌐", "default": "🌐"}
}

function getEmojiForCategory(data: guildCategory){
  var emojis = ""
  Object.entries(data.configs).forEach(([name, value], i) => {
    var emoji = emojiData[name]
    if(emoji){
      emojis += emoji[value] || emoji["default"]
    }
  })
  return emojis
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
    guildConfigService: GuildConfigService,
    globalConfig: GlobalConfigService
  ) => Promise<MessageEditOptions>;
} = {
  public: async (
    guildConfigService: GuildConfigService,
    globalConfig: GlobalConfigService
  ) => {
    var categories = await guildConfigService.getAllCategories();
    const publicTopics = new StringSelectMenuBuilder()
      .addOptions(
        categories
          .filter((x) => !x.password)
          .map((x) => {
            return { label: x.name, value: x._id.toString(), description: `${x.description} | ${getEmojiForCategory(x)}` };
          })
      )
      .setCustomId("setup-menu-step-public-1");
    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        publicTopics
      );
    return {
      content: "Select the Chat Room you want to join:",
      components: [row],
    };
  },
  private: async (
    guildConfigService: GuildConfigService,
    globalConfig: GlobalConfigService
  ) => {
    return {
      content: "Select the Chat Room you want to join:",
    };
  },
};
@Discord()
@SlashGroup("chat")
@Guard(noDms)
class setupCommands {
  @Inject()
  private guildConfigService: GuildConfigService;
  @Inject()
  private globalConfig: GlobalConfigService;

  private setupData: {
    [key: string]: { categoryId?: string; selectedChannel?: string };
  } = {};

  @Slash({
    description: "Lets you set up a synced Channel.",
  })
  async setup(interaction: CommandInteraction) {
    // create menu for roles
    const menu = new StringSelectMenuBuilder()
      .addOptions(step01)
      .setCustomId("setup-menu-step-1");
    var row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        menu
      );
    this.setupData[interaction.user.id + "-" + interaction.guildId] = {};
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

    interaction.message.edit({
      ...(await step02[value](this.guildConfigService, this.globalConfig)),
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
    const acceptButton = new ButtonBuilder()
      .setLabel(`I read and accept them!`)
      .setStyle(ButtonStyle.Danger)
      .setCustomId(
        "setup-menu-step-public-accept--" +
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

    this.setupData[interaction.user.id + "-" + interaction.guildId] = {
      categoryId: value,
    };
    interaction.message.edit({
      content: "Do you accept the TOS and Privacy Policy of Hedges Chatter?",
      components: [row],
    });
  }

  @ButtonComponent({ id: /setup-menu-step-public-accept--(\d+)/gim })
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
        return { label: x?.name!, value: x?.id! };
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
      content: "What Channel you want to sync up:",
      components: [row],
    });
  }

  @SelectMenuComponent({ id: "setup-menu-step-public-2" })
  async setupPublicTopicFinal(interaction: StringSelectMenuInteraction) {
    if (!this.setupData[interaction.user.id + "-" + interaction.guildId]) {
      interaction.reply({ content: "This isnt yours!", ephemeral: true });
      return;
    }
    await interaction.deferUpdate();
    const value = interaction.values?.[0];
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

    this.setupData[interaction.user.id + "-" + interaction.guildId] = {
      ...this.setupData[interaction.user.id + "-" + interaction.guildId],
      selectedChannel: value,
    };
    interaction.message.edit({
      content: `Is ${channel?.toString()} correct?`,
      components: [row],
    });
  }

  @ButtonComponent({ id: "setup-menu-step-finish" })
  async channelSumUp(interaction: ButtonInteraction) {
    if (!this.setupData[interaction.user.id + "-" + interaction.guildId]) {
      interaction.reply({ content: "This isnt yours!", ephemeral: true });
      return;
    }
    await interaction.deferUpdate();

    var embed = new EmbedBuilder();
    // const publicTopics = new StringSelectMenuBuilder()
    //   .addOptions({})
    //   .setCustomId("setup-menu-step-public-2");
    interaction.message.edit({
      content: "In Progress!",
    });
  }
}
