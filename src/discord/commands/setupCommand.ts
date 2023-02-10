import {
  CommandInteraction,
  InteractionEditReplyOptions,
  SelectMenuComponentOptionData,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import {
  Discord,
  SlashGroup,
  Guard,
  Slash,
  SelectMenuComponent,
} from "discordx";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";
import GlobalConfigService from "../../services/GloablConfigService";

const step01: SelectMenuComponentOptionData[] = [
  {
    label: "Public Chat-Rooms",
    value: "public",
    default: true,
    description: "Talk to many Servers!",
  },
  {
    label: "Private Chat-Rooms",
    value: "private",
    description: "Private Chat Rooms for only you and your Buddies!",
  },
];
const step02: { [key: string]: () => InteractionEditReplyOptions } = {
  public: () => {
    return  {
        content: "Select the Chat Room you want to join:"
    }
  },
   
  private: () => {
    return  {
        content: "Select the Chat Room you want to join:"
    }
  }
};
@Discord()
@SlashGroup("chat")
@Guard(noDms)
class setupCommands {
  @Inject()
  private guildConfigService: GuildConfigService;
  @Inject()
  private globalConfig: GlobalConfigService;
  @Slash({
    description: "Lets you set up a synced Channel.",
  })
  async setup(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    // create menu for roles
    const menu = new StringSelectMenuBuilder()
      .addOptions(step01)
      .setCustomId("setup-menu-step-1");
      interaction.editReply()
  }
  @SelectMenuComponent({ id: "setup-menu-step-1" })
  async setupMenu(interaction: StringSelectMenuInteraction) {
    const value = interaction.values?.[0];
  }
}
