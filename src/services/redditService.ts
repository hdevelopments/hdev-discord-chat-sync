import { Service } from "typedi";
import snoowrap from "snoowrap";
import { Listing, ListingOptions, Submission } from "snoowrap/dist/objects";
import { EmbedBuilder } from "@discordjs/builders";
import {
  AttachmentBuilder,
  CommandInteraction,
  InteractionEditReplyOptions,
} from "discord.js";
@Service()
class redditService {
  private snoowrap = new snoowrap({
    userAgent:
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
    clientId: "mr8WfLEWbTt3y2oFEvUrAg",
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN,
  });

  async fetch(
    type: "Hot" | "Best" | "New" = "New",
    subReddit?: string,
    options?: ListingOptions
  ) {
    var data: Listing<Submission> | undefined;
    switch (type) {
      case "Hot":
        if (!subReddit) throw Error("SubReddit is required!");
        data = await this.fetchHot(subReddit, options);
        break;
      case "New":
        if (!subReddit) throw Error("SubReddit is required!");
        data = await this.fetchNew(subReddit, options);
        break;
      case "Best":
        data = await this.fetchBest(options);
        break;
      default:
        if (subReddit) {
          data = await this.fetchNew(subReddit, options);
        } else {
          data = await this.fetchBest(options);
        }
    }
    return data;
  }

  async fetchNew(subReddit: string, options?: ListingOptions) {
    try {
      return await this.snoowrap.getNew(subReddit, options);
    } catch (exc) {
      console.log(exc);
    }
  }

  async fetchHot(subReddit: string, options?: ListingOptions) {
    try {
      return await this.snoowrap.getHot(subReddit, options);
    } catch (exc) {
      console.log(exc);
    }
  }

  async fetchBest(options?: ListingOptions) {
    try {
      return await this.snoowrap.getBest(options);
    } catch (exc) {
      console.log(exc);
    }
  }

  async createMessagePayload(inter: CommandInteraction, data: Submission) {
    var payload: InteractionEditReplyOptions = {};
    var embed = new EmbedBuilder();
    embed.setTitle("**Score: " +
    data.ups +
    "\nUpvote Ratio: " +
    data.upvote_ratio * 100 +
    "%**");
    embed.setURL("https://www.reddit.com" + data.permalink);
    embed.addFields({name: "Title:", value: data.title})
    
    embed.setAuthor({
      name: data.author.name,
      url: "https://www.reddit.com/user/" + data.author.name,
    });
    embed.setFooter({
      text: `Found by: ${inter.member?.user.username}@${inter.member?.user.discriminator} | ${inter.member?.user.id}`,
      iconURL: inter.user.avatarURL() || undefined,
    });
    if (data.is_video) {
      if (data.media?.reddit_video?.is_gif) {
        embed.setImage(data.media?.reddit_video?.fallback_url || null);
      } else {
        var attachment = new AttachmentBuilder(
          data.media?.reddit_video?.fallback_url!,
          { description: "Your Meme :)" }
        );
        payload.files = [attachment];
      }
    } else {
      embed.setImage(data.url);
    }

    payload.embeds = [embed];
    payload.content = data.selftext;
    return payload;
  }
}

export default redditService;
