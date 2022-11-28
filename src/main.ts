import "reflect-metadata";
import { dirname, importx } from "@discordx/importer";
import {
  BaseGuildTextChannel,
  DMChannel,
  Interaction,
  Message,
  Partials,
} from "discord.js";
import { IntentsBitField } from "discord.js";
import { Client, DIService, typeDiDependencyRegistryEngine } from "discordx";
import Config from "./discordConfig";
import { NoBot } from "./discord/guards/noBots";
import { Container, Service } from "typedi";

DIService.engine = typeDiDependencyRegistryEngine
  .setService(Service)
  .setInjector(Container);

export const bot = new Client({
  // Discord intents
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessageReactions,
    IntentsBitField.Flags.DirectMessageTyping,
    IntentsBitField.Flags.DirectMessages,
  ],
  partials: [Partials.Channel],
  // Debug logs are disabled in silent mode
  silent: false,
  guards: [NoBot],
  // Configuration for @SimpleCommand
  simpleCommand: {
    prefix: "!",
  },
});

bot.once("ready", async () => {
  // Make sure all guilds are cached
  await bot.guilds.fetch();
  // await bot.clearApplicationCommands();
  // Synchronize applications commands with Discord
  try {
    await bot.initApplicationCommands();
  } catch {
    (exc: any) => {
      console.log(exc.rawError);
    };
  }

  console.log("Bot started");
});

bot.on("interactionCreate", (interaction: Interaction) => {
  try {
    bot.executeInteraction(interaction);
  } catch (exc) {
    {
      console.log(exc);
    }
  }
});

bot.on("messageCreate", (message: Message) => {
  try {
    bot.executeCommand(message);
  } catch (exc) {
    {
      console.log(exc);
    }
  }
});

async function run() {
  // The following syntax should be used in the commonjs environment
  //
  // await importx(__dirname + "/{events,commands}/**/*.{ts,js}");

  // The following syntax should be used in the ECMAScript environment
  const __dirname = dirname(import.meta.url);

  await importx(`${__dirname}/discord/{events,commands}/**/*.{ts,js}`);

  // Let's start the bot
  if (!Config.Bot_Token) {
    throw Error("Could not find BOT_TOKEN in the config");
  }

  // Log in with your bot token
  await bot.login(Config.Bot_Token);
}
run();
export default bot;
