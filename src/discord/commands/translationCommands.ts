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
import { translate,
  } from 'google-translate-api-x';
export const languages:{[key:string]:string} = {
  "auto" : "Automatic",
  "af" : "Afrikaans",
  "sq" : "Albanian",
  "am" : "Amharic",
  "ar" : "Arabic",
  "hy" : "Armenian",
  "as" : "Assamese",
  "ay" : "Aymara",
  "az" : "Azerbaijani",
  "bm" : "Bambara",
  "eu" : "Basque",
  "be" : "Belarusian",
  "bn" : "Bengali",
  "bho" : "Bhojpuri",
  "bs" : "Bosnian",
  "bg" : "Bulgarian",
  "ca" : "Catalan",
  "ceb" : "Cebuano",
  "ny" : "Chichewa",
  "zh-CN" : "Chinese (Simplified)",
  "zh-TW" : "Chinese (Traditional)",
  "co" : "Corsican",
  "hr" : "Croatian",
  "cs" : "Czech",
  "da" : "Danish",
  "dv" : "Dhivehi",
  "doi" : "Dogri",
  "nl" : "Dutch",
  "en" : "English",
  "eo" : "Esperanto",
  "et" : "Estonian",
  "ee" : "Ewe",
  "tl" : "Filipino",
  "fi" : "Finnish",
  "fr" : "French",
  "fy" : "Frisian",
  "gl" : "Galician",
  "ka" : "Georgian",
  "de" : "German",
  "el" : "Greek",
  "gn" : "Guarani",
  "gu" : "Gujarati",
  "ht" : "Haitian Creole",
  "ha" : "Hausa",
  "haw" : "Hawaiian",
  "iw" : "Hebrew",
  "he" : "Hebrew",
  "hi" : "Hindi",
  "hmn" : "Hmong",
  "hu" : "Hungarian",
  "is" : "Icelandic",
  "ig" : "Igbo",
  "ilo" : "Ilocano",
  "id" : "Indonesian",
  "ga" : "Irish",
  "it" : "Italian",
  "ja" : "Japanese",
  "jw" : "Javanese",
  "kn" : "Kannada",
  "kk" : "Kazakh",
  "km" : "Khmer",
  "rw" : "Kinyarwanda",
  "gom" : "Konkani",
  "ko" : "Korean",
  "kri" : "Krio",
  "ku" : "Kurdish (Kurmanji)",
  "ckb" : "Kurdish (Sorani)",
  "ky" : "Kyrgyz",
  "lo" : "Lao",
  "la" : "Latin",
  "lv" : "Latvian",
  "ln" : "Lingala",
  "lt" : "Lithuanian",
  "lg" : "Luganda",
  "lb" : "Luxembourgish",
  "mk" : "Macedonian",
  "mai" : "Maithili",
  "mg" : "Malagasy",
  "ms" : "Malay",
  "ml" : "Malayalam",
  "mt" : "Maltese",
  "mi" : "Maori",
  "mr" : "Marathi",
  "mni-Mtei" : "Meiteilon (Manipuri)",
  "lus" : "Mizo",
  "mn" : "Mongolian",
  "my" : "Myanmar (Burmese)",
  "ne" : "Nepali",
  "no" : "Norwegian",
  "or" : "Odia (Oriya)",
  "om" : "Oromo",
  "ps" : "Pashto",
  "fa" : "Persian",
  "pl" : "Polish",
  "pt" : "Portuguese",
  "pa" : "Punjabi",
  "qu" : "Quechua",
  "ro" : "Romanian",
  "ru" : "Russian",
  "sm" : "Samoan",
  "sa" : "Sanskrit",
  "gd" : "Scots Gaelic",
  "nso" : "Sepedi",
  "sr" : "Serbian",
  "st" : "Sesotho",
  "sn" : "Shona",
  "sd" : "Sindhi",
  "si" : "Sinhala",
  "sk" : "Slovak",
  "sl" : "Slovenian",
  "so" : "Somali",
  "es" : "Spanish",
  "su" : "Sundanese",
  "sw" : "Swahili",
  "sv" : "Swedish",
  "tg" : "Tajik",
  "ta" : "Tamil",
  "tt" : "Tatar",
  "te" : "Telugu",
  "th" : "Thai",
  "ti" : "Tigrinya",
  "ts" : "Tsonga",
  "tr" : "Turkish",
  "tk" : "Turkmen",
  "ak" : "Twi",
  "uk" : "Ukrainian",
  "ur" : "Urdu",
  "ug" : "Uyghur",
  "uz" : "Uzbek",
  "vi" : "Vietnamese",
  "cy" : "Welsh",
  "xh" : "Xhosa",
  "yi" : "Yiddish",
  "yo" : "Yoruba",
  "zu" : "Zulu"
}
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
    if (!languages[to]) {
      await interaction.editReply("Invalid Language");
      return;
    }
    var embed = new EmbedBuilder();
    var translatedText = await translate(text, { from: "auto", to: to });
    console.log("TEST")
    console.log(translatedText)
    embed.setTitle("Translated!");
    embed.setDescription("text" in translatedText ? translatedText.text.toString() : "To Big Text!");

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
    embed.setDescription("text" in translatedText ? translatedText.text.toString() : "To Big Text!");
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  static optionCompleter(interaction: AutocompleteInteraction) {
    var text = interaction.options.getString("language");

    var results = Object.keys(languages)
      .filter(
        (x) =>
          !["isSupported", "getCode"].includes(x) && (!text || x.includes(text))
      )
      .map((x) => ({ name: languages[x], value: x }));

    if (results.length > 25) results.length = 25;
    interaction.respond(results);
  }
}
