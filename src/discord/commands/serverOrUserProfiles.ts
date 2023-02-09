import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChannelType,
  Colors,
  CommandInteraction,
  EmbedBuilder,
  GuildTextBasedChannel,
  MessageActionRowComponentBuilder,
  Snowflake,
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
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";
import syncUtils from "../../utils/syncModerationUtils";
import bot from "../../main";

export const options: {
  [key: string]: { globalOnly?: boolean; options: any[]; helpText?: string };
} = {
  ["noInvites"]: { options: ["true", "false"] },
  ["noEmbeddedLinks"]: { options: ["true", "false"] },
  ["type"]: {
    options: [
      "Embed ( Big, Default )",
      "Webhook ( Small, it does need the Webhook permission! )",
    ],
  },
  ["noButtons"]: { options: ["true", "false"] },
  ["memesChannel"]: {
    globalOnly: true,
    options: ["*"],
    helpText: "The Channel Id",
  },
};

@Discord()
@SlashGroup({
  description: "Profiles for User/Server",
  name: "profile",
  dmPermission: false,
})
@SlashGroup("profile")
@Guard(noDms)
class serverOrUserProfiles {
  @Inject()
  private guildConfigService: GuildConfigService;

  private setupData: { [key: string]: { channel: string } } = {};

  @Slash({
    description: "Set the channel for chatting.",
    name: "setchannel",
  })
  async get(
    @SlashChoice("Server", "User")
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      description: "Type of Profile",
      name: "channel",
      required: true,
    })
    type: "Server" | "User",
    @SlashOption({
      type: ApplicationCommandOptionType.String,
      description: "The Id",
      name: "id",
      required: true,
    })
    id: Snowflake,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply({ ephemeral: true });
    var embed = new EmbedBuilder();
    if (type === "Server") {
      var guildCfg = await this.guildConfigService.getOrCreate(id);
      var guild = bot.guilds.cache.find((x) => x.id === id);
      if (!guild) {
        await interaction.editReply(
          "I couldnt find a Server with that id! ( Is hedges chatter on that server? )"
        );
        return;
      }
      embed.setTitle(`Server: ${guild.name} | ${id}`);
      embed.setThumbnail(guild.iconURL());
      embed.setImage(guild.bannerURL());
      embed.setColor(guildCfg.profile.options["serverColor"] || Colors.Aqua);
      embed.addFields({
        name: "Server-Data:",
        value: `Server Name: ${guild.name} 
    Server ID: ${guild.id}
    Members: ${guild.memberCount} 
    Badges: ${
      guildCfg.profile.bagdes.length == 0
        ? "None"
        : guildCfg.profile.bagdes.map(
            (x) => x.iconEmoji + " - " + x.name + "\n"
          )
    }`,
      });
    } else {
    }

    interaction.editReply({
      embeds: [embed],
    });
  }
}
