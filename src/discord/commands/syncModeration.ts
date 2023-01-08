import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChannelType,
  CommandInteraction,
  EmbedBuilder,
  GuildTextBasedChannel,
  MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import {
  Discord,
  Guard,
  SelectMenuComponent,
  Slash,
  SlashChoice,
  SlashGroup,
  SlashOption,
} from "discordx";
import { ObjectID } from "ts-mongodb-orm";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";
import syncUtils, { asyncForEach } from "../../utils/syncModerationUtils";
import bot from "../../main";

export const options: { [key: string]: string[] } = {
  ["noInvites"]: ["True", "False"],
  ["noEmbeddedLinks"]: ["True", "False"],
  ["type"]: [
    "Embed ( Big, Default )",
    "Webhook ( Small, it does need the Webhook permission! )",
  ],
  ["noButtons"]: ["True", "False"],
};

@Discord()
@SlashGroup({
  description: "Options for Chat collaberation",
  name: "moderation",
  dmPermission: false,
  defaultMemberPermissions: ["ManageChannels", "ManageMessages"],
})
@SlashGroup("moderation")
@Guard(noDms)
class syncModeration {
  @Inject()
  private guildConfigService: GuildConfigService;
  @Inject()
  private syncUtils: syncUtils;

  private setupData: { [key: string]: { channel: string } } = {};

  @Slash({
    description: "Set the channel for chatting.",
    dmPermission: false,
    name: "setchannel",
  })
  async setchatchannel(
    @SlashOption({
      type: ApplicationCommandOptionType.Channel,
      description: "The Channel",
      name: "channel",
      channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
      required: true,
    })
    channel: GuildTextBasedChannel,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();

    var categories = await this.guildConfigService.getAllCategories();

    // create menu for roles
    const menu = new StringSelectMenuBuilder()
      .addOptions(
        ...categories
          .filter((x) => !x.password)
          .map((x) => ({
            label: x.name + (x.nsfw ? " (NSFW)" : ""),
            value: x._id.toString(),
            description:
              x.description &&
              x.description + (x.nsfw ? " (possible NSFW)" : ""),
          }))
      )
      .setCustomId("categories-menu");
    const row =
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        menu
      );
    interaction
      .editReply({
        components: [row],
        content: `Select the category you want!`,
      })
      .then((x) => {
        this.setupData[x.id] = { channel: channel.id };
      });
  }

  @SelectMenuComponent({ id: "categories-menu" })
  async handle(interaction: StringSelectMenuInteraction): Promise<unknown> {
    await interaction.deferReply();

    // extract selected value by member
    const category = interaction.values?.[0];

    // if value not found
    if (!category) {
      return interaction.editReply("invalid Selection!, select again");
    }

    var data = await this.guildConfigService.getOrCreate(interaction.guildId!);
    var setupData = this.setupData[interaction.message.id].channel;
    if (!data.channels) data.channels = {};
    data.channels[setupData] = {
      category: category,
      channel: setupData,
      guild: interaction.guildId!,
      lastMessage: Date.now(),
    };
    await this.guildConfigService.save(data);

    await this.syncUtils.sendToAllChannels(category, {
      content: "**" + interaction.guild?.name + "** joined the chat!",
    });

    await interaction.editReply("Success!");
    return;
  }

  @Slash({
    description: "Removes the current channel from being synced.",
  })
  async remove(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    var foundchannel = await this.guildConfigService.getByChannel(
      interaction.guildId!,
      interaction.channelId
    );
    var found = await this.guildConfigService.getOrCreate(interaction.guildId!);
    try {
      delete found.channels[foundchannel?.channel!];
      await this.guildConfigService.save(found);
      await interaction.editReply({ content: "Success" });
    } catch (exc: any) {
      await interaction.editReply({ content: "Failed" });
    }
  }

  @Slash({
    description: "Lets you set some options.",
  })
  async set(
    @SlashChoice(
      ...Object.entries(options).map((data) => {
        return { name: data[0], value: data[0] };
      })
    )
    @SlashOption({
      description: "The Option",
      name: "option",
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    option: string,
    @SlashOption({
      description: "The new Value",
      name: "value",
      autocomplete: syncModeration.optionCompleter,
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    newValue: any,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply({ ephemeral: true });
    var config = await this.guildConfigService.getOrCreate(
      interaction.guildId!
    );

    config.configs[option] = newValue;

    await this.guildConfigService.save(config);
    await interaction.editReply("Success!");
  }

  static optionCompleter(interaction: AutocompleteInteraction) {
    var option = interaction.options.getString("option");
    if (!option) {
      interaction.respond([{ name: "please select a option!", value: "no" }]);
      return;
    }

    interaction.respond(
      options[option].map((x) => {
        return { name: x, value: x };
      })
    );
  }
}
