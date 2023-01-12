import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  AutocompleteInteraction,
  CommandInteraction,
  EmbedBuilder,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { ContextMenu, Discord, Guard, Slash, SlashOption } from "discordx";
import { noDms } from "../guards/noDms";
import translate, { languages } from "translate-google";

const langs = languages as { [key: string]: string };

@Discord()
@Guard(noDms)
export class translateCommands {
  @Slash({ description: "Translates the given Text" })
  async translate(
    @SlashOption({
      description: "The Text you want to translate!",
      type: ApplicationCommandOptionType.String,
      name: "text",
      required: true,
    })
    text: string,
    @SlashOption({
      description: "To what language? (Default = English)",
      type: ApplicationCommandOptionType.String,
      name: "language",
      autocomplete: translateCommands.optionCompleter,
    })
    to: string = "en",
    interaction: CommandInteraction
  ): Promise<unknown> {
    await interaction.deferReply();
    if (!langs[to]) {
      await interaction.editReply("Invalid Language");
      return;
    }
    var embed = new EmbedBuilder();
    var translatedText = await translate(text, { from: "auto", to: to });
    embed.setTitle("Translated!");
    embed.setDescription(translatedText);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  @ContextMenu({ type: ApplicationCommandType.Message, name: "Quick Translate" })
  async quickTranslate(
    interaction: MessageContextMenuCommandInteraction
  ): Promise<unknown> {
    if(!interaction.targetMessage.content){
        await interaction.reply({ephemeral: true, content: "No Text is available!"})
        return
    }
    await interaction.deferReply({ephemeral: true});
    var embed = new EmbedBuilder();
    var translatedText = await translate(interaction.targetMessage.content, {
      to: "en",
    });
    embed.setTitle("Translated!");
    embed.setDescription(translatedText);
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  static optionCompleter(interaction: AutocompleteInteraction) {
    var text = interaction.options.getString("language");

    var results = Object.keys(langs)
      .filter(
        (x) =>
          !["isSupported", "getCode"].includes(x) && (!text || x.includes(text))
      )
      .map((x) => ({ name: langs[x], value: x }));

    if (results.length > 25) results.length = 25;
    interaction.respond(results);
  }
}
