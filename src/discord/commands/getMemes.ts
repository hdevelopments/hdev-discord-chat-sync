import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
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
  dmPermission: false,
})
@SlashGroup("memes")
class getMemes {
  @Inject()
  private guildConfigService: GuildConfigService;
  @Inject()
  private redditService: redditService;
  @Inject()
  private syncUtils: syncUtils;
  private shareCache = new Cache({ defaultTtl: 60 * 1000 });
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
    var guildCfg = await this.guildConfigService.getOrCreate(
      interaction.guildId!
    );
    if (guildCfg.banned) {
      interaction.editReply(
        "Your guild got banned! Please create a unbann request on the Support Server (see /info)"
      );
      return;
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
          count: 10,
          before: this.lastMeme.get(subreddit),
        });
        if (!data) {
          interaction.editReply("Something went wrong!");
          return;
        }
        var lastTempMeme = data[data.length - 1].name;
        data = data.filter(
          (x) => !x.stickied && !x.over_18
        ) as Listing<Submission>;
        if (!data) {
          this.lastMeme.set(subreddit, lastTempMeme);
          data = await this.redditService.fetch(type, subreddit, {
            count: 10,
            before: this.lastMeme.get(subreddit),
          });
        }
        if (!data) {
          interaction.editReply("Something went wrong! (Possible all NSFW?)");
          return;
        }
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
      const publishBtn = new ButtonBuilder()
        .setLabel("Publish! (Send in Channel)")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId("publish-meme");
      var row =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          shareBtn
        );

      if (
        !guildCfg.configs["memesChannel"] ||
        guildCfg.configs["memesChannel"] === interaction.channelId
      ) {
        row.addComponents(publishBtn);
      }
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
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "You need to be in a guild!",
        ephemeral: true,
      });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    var guildCfg = await this.guildConfigService.getOrCreate(
      interaction.guildId
    );

    if (
      !Object.values(guildCfg.channels).find((x) =>
        x.category === process.env.DEV
          ? "638f1ec83eeb0d2604999746"
          : "638f458e96954066bca89e10"
      ) === undefined
    ) {
      interaction.editReply("This guild has to have a Memes Topic Channel!");
      return;
    }
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

  @ButtonComponent({ id: "publish-meme" })
  async publishMeme(interaction: ButtonInteraction) {
    var hasPublished = this.shareCache.get(
      interaction.user.id + "-" + interaction.guildId
    ) as number;
    var restTime = hasPublished - Date.now();
    if (restTime > 0) {
      await interaction.reply({
        content: "You have to wait!",
        ephemeral: true,
      });
      return;
    }

    this.shareCache.put(
      interaction.user.id + "-" + interaction.guildId,
      Date.now() + 300 * 1000
    );

    var files = interaction.message.attachments.map(
      (x) => new AttachmentBuilder(x.attachment)
    );
    var guildCfg = await this.guildConfigService.getOrCreate(
      interaction.guildId!
    );
    var memesChannel = guildCfg.configs["memesChannel"];
    if (!memesChannel || memesChannel === interaction.channelId) {
      await interaction.reply({
        content: interaction.message.content,
        embeds: interaction.message.embeds,
        files: files,
      });
    }
  }
}
