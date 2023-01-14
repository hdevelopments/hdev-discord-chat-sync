import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  Discord,
  Guard,
  Guild,
  ModalComponent,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";
import syncUtils from "../../utils/syncModerationUtils";
import GlobalConfigService from "../../services/GloablConfigService";

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
  private guildConfigService: GuildConfigService

  @Inject()
  private globalConfigService: GlobalConfigService;


  @Inject()
  private syncModeration: syncUtils;

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
    @SlashOption({
      type: ApplicationCommandOptionType.Boolean,
      description: "Are attachments enabled?",
      name: "attachments",
    })
    attachments: boolean = false,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();
    var found = await this.guildConfigService.getOrCreateCategory(
      category,
      interaction.member?.user!
    );
    found.nsfw = nsfw === true;
    found.description = description;
    found.configs["attachments"] = String(attachments)
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

  @Slash({
    description: "Blacklist a user.",
  })
  async toggleblacklist(
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      description: "The User",
      name: "userid",
      required: true,
    })
    userid: string,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply();
    var result = await this.globalConfigService.blacklistUser(userid)
    await interaction.editReply("The user is now " + (result.blacklisted[userid] ? "Banned" : "Unbanned"));
  }

  @Slash({
    description: "Announce Something!",
  })
  async announce(interaction: CommandInteraction) {
    var modal = new ModalBuilder()
      .setTitle("Details about a message")
      .setCustomId("announcement-submit");
    // Create text input fields
    const titleComponent = new TextInputBuilder()
      .setCustomId("title")
      .setLabel("The Title")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(238)
      .setPlaceholder("Somewhat we can identify the Message")
      .setRequired(true);

    const descriptionComponent = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("The description:")
      .setMaxLength(4000)
      .setPlaceholder(
        "Write here your concern! ( Best with a screenshot! [Upload it somewhere])"
      )
      .setStyle(TextInputStyle.Paragraph);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      titleComponent
    );

    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      descriptionComponent
    );

    modal.addComponents(row1, row2);
    await interaction.showModal(modal);
  }

  @ModalComponent({ id: "announcement-submit" })
  async announcement(interaction: ModalSubmitInteraction) {
    const [title, description] = ["title", "description"].map((id) =>
      interaction.fields.getTextInputValue(id)
    );
    await interaction.deferReply({ ephemeral: true });

    var embed = new EmbedBuilder();
    embed.setTitle("BOT Announcement: " + title);
    embed.setDescription(description);
    embed.setColor("Gold");
    await this.syncModeration.sendToAllChannels(undefined, { embeds: [embed] });

    await interaction.editReply("Successfully announced!");
  }
}
