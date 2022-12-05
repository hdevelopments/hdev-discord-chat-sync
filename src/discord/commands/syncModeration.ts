import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ChannelType,
  CommandInteraction,
  EmbedBuilder,
  GuildTextBasedChannel,
  MessageActionRowComponentBuilder,
  SelectMenuBuilder,
  SelectMenuInteraction,
} from "discord.js";
import {
  Discord,
  Guard,
  SelectMenuComponent,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";
import { ObjectID } from "ts-mongodb-orm";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";

@Discord()
@SlashGroup({
  description: "Options for Chat collaberation",
  name: "moderation",
  dmPermission: false,
  defaultMemberPermissions: ["ManageChannels", "ManageMessages"],
})
@Guard(noDms)
class syncModeration {
  @Inject()
  private guildConfigService: GuildConfigService;

  private setupData: { [key: string]: { channel: string } } = {};

  @Slash({ description: "Set the channel for chatting." })
  @SlashGroup("moderation")
  async setchatchannel(
    @SlashOption({
      type: ApplicationCommandOptionType.Channel,
      description: "The Channel",
      name: "channel",
      channelTypes: [ChannelType.GuildText],
      required: true,
    })
    channel: GuildTextBasedChannel,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();

    var categories = await this.guildConfigService.getAllCategories();

    // create menu for roles
    const menu = new SelectMenuBuilder()
      .addOptions(
        ...categories.map((x) => ({
          label: x.name + (x.nsfw ? "(NSFW)" : ""),
          value: x._id.toString(),
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

  @Slash({
    description: "Bans a Guild.",
    guilds: ["932286006156222495", "995759386142179358"],
  })
  async toggleban(
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      description: "The Guild",
      name: "guild",
      required: true,
    })
    guild: string,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();
    var found = await this.guildConfigService.getOrCreate(guild);
    found.banned = !found.banned;
    await this.guildConfigService.save(found);

    await interaction.editReply("Successfully set the chat channel!");
  }

  @Slash({
    description: "Adds a Category.",
    guilds: ["932286006156222495", "995759386142179358"],
  })
  async addcategory(
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      description: "The Category",
      name: "category",
      required: true,
    })
    category: string,
    @SlashOption({
      type: ApplicationCommandOptionType.Boolean,
      description: "Is the category NSFW?",
      name: "nsfw",
    })
    nsfw: boolean,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();
    var found = await this.guildConfigService.getOrCreateCategory(
      category,
      interaction.member?.user!
    );
    if (nsfw) {
      found.nsfw = nsfw;
      await this.guildConfigService.saveCategory(found);
    }
    await interaction.editReply("Category successfully created!");
  }

  @Slash({
    description: "Removes a Category.",
    guilds: ["932286006156222495", "995759386142179358"],
  })
  async removecategory(
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      description: "The Category",
      name: "category",
      required: true,
    })
    category: string,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();
    var found = await this.guildConfigService.getOrCreateCategory(
      category,
      interaction.member?.user!
    );
    
    await this.guildConfigService.removeCategory(found);
    await interaction.editReply("Category successfully removed!");
  }

  @SelectMenuComponent({ id: "categories-menu" })
  async handle(interaction: SelectMenuInteraction): Promise<unknown> {
    await interaction.deferReply();

    // extract selected value by member
    const category = interaction.values?.[0];

    // if value not found
    if (!category) {
      return interaction.followUp("invalid Selection!, select again");
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

    await interaction.editReply("Success!");
    return;
  }

  @Slash({
    description: "Shows you the information about this Channel.",
  })
  @SlashGroup("moderation")
  async info(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    var found = await this.guildConfigService.getByChannel(
      interaction.guildId!,
      interaction.channelId
    );
    var category = await this.guildConfigService.findCategory(new ObjectID(found?.category))
   
    if (category) {
      var embed = new EmbedBuilder().setTitle("Information");
      embed.addFields(
        { name: "Category:", value: category.name },
        { name: "NSFW:", value: String(category.nsfw) }
      );
      await interaction.editReply({ embeds: [embed] });
    }else{
      await interaction.editReply("This isnt a Chat Sync chat!");
    }
  }
}
