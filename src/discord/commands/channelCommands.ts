import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Discord, SlashGroup, Guard, Slash } from "discordx";
import { Inject } from "typedi";
import GuildConfigService from "../../services/GuildConfigService";
import { noDms } from "../guards/noDms";
import { ObjectID } from "ts-mongodb-orm";
import { asyncForEach } from "../../utils/syncModerationUtils";
import bot from "../../main";

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
    console.log(found)
    console.log(category)
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
}
