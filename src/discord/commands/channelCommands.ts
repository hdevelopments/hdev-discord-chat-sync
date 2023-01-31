import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  CommandInteraction,
  EmbedBuilder,
  TextBasedChannel,
} from "discord.js";
import {
  Discord,
  SlashGroup,
  Guard,
  Slash,
  SlashOption,
  SlashChoice,
} from "discordx";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";
import { ObjectID } from "ts-mongodb-orm";
import { asyncForEach } from "../../utils/syncModerationUtils";
import bot from "../../main";

const options: { [key: string]: string[] } = {
  ["noInvites"]: ["true", "false"],
  ["noEmbeddedLinks"]: ["true", "false"],
  ["type"]: [
    "Embed ( Big, Default )",
    "Webhook ( Small, it does need the Webhook permission! )",
  ],
  ["noButtons"]: ["true", "false"],
};

@Discord()
@SlashGroup({
  description: "Some Chat Options",
  name: "chat",
  dmPermission: false,
})
@SlashGroup("chat")
@Guard(noDms)
class channelCommands {
  @Inject()
  private guildConfigService: GuildConfigService;
  @Slash({
    description: "Shows you the information about this Channel.",
  })
  async info(interaction: CommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    var found = await this.guildConfigService.getByChannel(
      interaction.guildId!,
      interaction.channelId
    );
    var category = await this.guildConfigService.findCategory(
      new ObjectID(found?.category)
    );
    if (category) {
      var allFound = await this.guildConfigService.getAllByCategoryId(
        found?.category!
      );
      var foundText = "------\n";

      await asyncForEach(allFound, async (x) => {
        try {
          var foundGuild = await bot.guilds.fetch(x.guild);
          foundText += `**${foundGuild.name}** | ${x.guild} \n`;
        } catch (exc) {}
      });

      var owner = "Not Available";
      try {
        owner = category.owner
          ? (
              await bot.users.fetch(
                typeof category.owner === "string"
                  ? category.owner
                  : category.owner.user
              )
            ).username
          : "Public";
      } catch (exc) {
        owner = "Not Available";
      }
      var embed = new EmbedBuilder().setTitle("Information");
      embed.addFields(
        { name: "Category:", value: category.name },
        { name: "NSFW:", value: String(category.nsfw) },
        {
          name: "Owner:",
          value: owner,
        },
        { name: "Servers:", value: foundText }
      );
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply("This isnt a Chat Sync chat!");
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
      autocomplete: channelCommands.optionCompleter,
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    newValue: any,
    @SlashOption({
      description: "The chanel",
      name: "channel",
      type: ApplicationCommandOptionType.Channel,
    })
    channel: TextBasedChannel,
    interaction: CommandInteraction
  ) {
    if (!options[option].includes(newValue)) {
      await interaction.reply({
        ephemeral: true,
        content: "You need to select one of the given options!",
      });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    var config = await this.guildConfigService.getOrCreate(
      interaction.guildId!
    );

    var foundchannel = config.channels[channel?.id || interaction.channelId];

    if (!foundchannel) {
      interaction.editReply("Sorry the choosen channel isnt a sync channel!");
      return;
    }
    if (!foundchannel.configs) {
      foundchannel.configs = {};
    }
    foundchannel.configs[option] = newValue;
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
