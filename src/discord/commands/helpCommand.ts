import { Pagination, PaginationType } from "@discordx/pagination";
import { CommandInteraction, PermissionsBitField } from "discord.js";
import { EmbedBuilder } from "discord.js";
import { Discord, MetadataStorage, SelectMenuComponent, Slash } from "discordx";

@Discord()
export class HelpCommands {
  @Slash({
    description: "Help for all slash command",
    name: "help",
  })
  async pages(interaction: CommandInteraction): Promise<void> {
    const commands = MetadataStorage.instance.applicationCommandSlashesFlat
      .filter((cmd) => {
        if (!interaction.inGuild()) {
          if (cmd.defaultMemberPermissions) return false;
          return cmd.guards.findIndex((x) => x.fn.name === "noDms") === -1;
        } else {
          var onlyDmsCmds =
            cmd.guards.findIndex((x) => x.fn.name === "onlyDms") !== -1;
          if (onlyDmsCmds) return false;
          if (cmd.defaultMemberPermissions) {
            return (
              interaction.member?.permissions as Readonly<PermissionsBitField>
            ).has(cmd.defaultMemberPermissions);
          }
        }

        return true;
      })
      .map((cmd) => ({
        name: cmd.name,
        description: cmd.description || "||No Description||",
      }));

    var pages: {
      description: string;
      name: string;
    }[][] = [[]];

    commands.forEach((cmd, i) => {
      if (pages[pages.length - 1].length < 5) {
        pages[pages.length - 1].push({
          description: cmd.description,
          name: cmd.name,
        });
      } else {
        pages.push([]);
        pages[pages.length - 1].push({
          description: cmd.description,
          name: cmd.name,
        });
      }
    });

    const paginations = pages.map((page, i) => {
      const embed = new EmbedBuilder()
        .setFooter({ text: `Page ${i + 1} of ${pages.length}` })
        .setTitle("**Slash command info**")
        .setDescription("If you need more help ping Team. ");

      page.forEach((cmd) => {
        embed.addFields({ name: cmd.name, value: cmd.description });
      });

      return { embeds: [embed] };
    });

    const pagination = new Pagination(interaction, paginations);
    pagination.option = {
      type: PaginationType.SelectMenu,
      enableExit: true,
      ephemeral: true,
      showStartEnd: false,
      time: 120 * 1000,
    };

    await pagination.send();
  }

  @SelectMenuComponent({ id: "discordx@pagination@menu" })
  async noerrorspls() {}
}
