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
    SlashChoiceType,
    SlashGroup,
    SlashOption,
  } from "discordx";
  import { ObjectID } from "ts-mongodb-orm";
  import { Inject } from "typedi";
  import GuildConfigService from "../../services/GuildConfigService";
  import { noDms } from "../guards/noDms";
  
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
  @Guard(noDms)
  class syncModeration {
    @Inject()
    private guildConfigService: GuildConfigService;
  
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
  
      await interaction.editReply("Successfully toggled the ban!");
    }
  
    @Slash({
      description: "VIP a Guild.",
      guilds: ["932286006156222495", "995759386142179358"],
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
  