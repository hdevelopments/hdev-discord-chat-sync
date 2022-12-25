import {
  ApplicationCommandOptionType,
  CommandInteraction,
} from "discord.js";
import {
  Discord,
  Guard,
  Guild,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";

@Discord()
@SlashGroup({
  description: "Options for Rooki and Hedges collaberation",
  name: "administration",
  dmPermission: false,
  defaultMemberPermissions: ["ManageChannels", "ManageMessages"],
})
@Guild(["932286006156222495", "995759386142179358"])
@SlashGroup("administration")
@Guard(noDms)
class syncAdministration {
  @Inject()
  private guildConfigService: GuildConfigService;

  @Slash({
    description: "Bans a Guild.",
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

    await interaction.editReply("Successfully toggled the ban!");
  }

  @Slash({
    description: "VIP a Guild.",
  })
  async togglevip(
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
    found.vip = !found.vip;
    await this.guildConfigService.save(found);

    await interaction.editReply("Successfully toggled the ban!");
  }

  @Slash({
    description: "Adds a Category.",
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
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      description: "What is the description?",
      name: "description",
    })
    description: string,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();
    var found = await this.guildConfigService.getOrCreateCategory(
      category,
      interaction.member?.user!
    );
    found.nsfw = nsfw === true;
    found.description = description;
    await this.guildConfigService.saveCategory(found);
    await interaction.editReply("Category successfully created!");
  }

  @Slash({
    description: "Removes a Category.",
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
}
