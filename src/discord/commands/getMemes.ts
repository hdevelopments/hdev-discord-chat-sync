import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Collection,
  CommandInteraction,
  InteractionEditReplyOptions,
  MessageActionRowComponentBuilder,
} from "discord.js";
import {
  Discord,
  SlashGroup,
  Guard,
  Slash,
  SlashOption,
  SlashChoice,
  ButtonComponent,
} from "discordx";
import { Inject } from "typedi";
import { noDms } from "../guards/noDms";
import redditService from "../../services/redditService";
import { Listing, Submission } from "snoowrap";
import Cache from "timed-cache";
import syncUtils from "../../utils/syncModerationUtils";
import GuildConfigService from "../../services/GuildConfigService";

@Discord()
@SlashGroup({
  description: "Gets you a meme :)",
  name: "memes",
  dmPermission: true,
})
@SlashGroup("memes")
@Guard(noDms)
class getMemes {
  @Inject()
  private guildConfigService: GuildConfigService;
  @Inject()
  private redditService: redditService;
  @Inject()
  private syncUtils: syncUtils;
  private memeCache = new Cache({ defaultTtl: 120 * 1000 });
  private lastMeme: Collection<string, string> = new Collection();
  @Slash({
    description:
      "Lets you get a random post out of the Subreddit (default = dankmemes).",
  })
  async get(
    @SlashOption({
      description: "The Name of the subreddit",
      name: "subreddit",
      type: ApplicationCommandOptionType.String,
    })
    subreddit: string = "dankmemes",
    @SlashChoice(
      {
        name: "Hot",
        value: "Hot",
      },
      {
        name: "New",
        value: "New",
      },
      {
        name: "Best",
        value: "Best",
      }
    )
    @SlashOption({
      description: "Force start from the beginning",
      name: "type",
      type: ApplicationCommandOptionType.String,
    })
    type: "Hot" | "New" | "Best",
    @SlashOption({
      description: "Force start from the beginning",
      name: "refresh",
      type: ApplicationCommandOptionType.Boolean,
    })
    refresh: boolean,
    interaction: CommandInteraction
  ) {
    await interaction.deferReply({ ephemeral: true });
    if((await this.guildConfigService.getOrCreate(interaction.id)).banned){
      interaction.editReply("Your guild got banned! Please create a unbann request on the Support Server (see /info)")
      return
    }
    if (refresh) {
      this.memeCache.put(subreddit, false);
      this.lastMeme.delete(subreddit);
    }
    try {
      var data: Listing<Submission> | undefined;
      var payload: InteractionEditReplyOptions = {};
      if (!this.memeCache.get(subreddit + "-" + type)) {
        data = await this.redditService.fetch(type, subreddit, {
          count: 5,
          before: this.lastMeme.get(subreddit),
        });
        if (!data) {
          interaction.editReply("Something went wrong!");
          return;
        }
        data = data.filter((x) => !x.stickied) as Listing<Submission>;
        this.memeCache.put(subreddit + "-" + type, data);
      } else {
        data = this.memeCache.get(
          subreddit + "-" + type
        ) as Listing<Submission>;
      }
      var firstData = data[0];

      this.lastMeme.set(subreddit, firstData.name);

      payload = await this.redditService.createMessagePayload(
        interaction,
        firstData
      );
      const shareBtn = new ButtonBuilder()
        .setLabel("Share!")
        .setStyle(ButtonStyle.Primary)
        .setCustomId("share-meme");
      var row =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          shareBtn
        );
      payload.components = [row];
      interaction.editReply(payload);
      data = data.reverse() as Listing<Submission>;
      data.pop();
      data = data?.reverse() as Listing<Submission>;
      if (data.length > 0) {
        this.memeCache.put(subreddit + "-" + type, data);
      } else {
        this.memeCache.put(subreddit + "-" + type, false);
      }
      payload;
    } catch (exc) {
      console.log(exc);
      interaction.editReply("Something went wrong!");
    }
  }

  @ButtonComponent({ id: "share-meme" })
  async shareMeme(interaction: ButtonInteraction) {
    await interaction.deferReply({ ephemeral: true });
    this.syncUtils.sendToAllChannels(
      process.env.DEV ? "638f1ec83eeb0d2604999746" : "638f458e96954066bca89e10",
      {
        content: interaction.message.content,
        embeds: interaction.message.embeds,
        attachments: interaction.message.attachments,
      }
    );
    await interaction.editReply("Successfully shared!");
  }
}
