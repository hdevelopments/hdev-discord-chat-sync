import { Message, MessageType } from "discord.js";
import axios from "axios";
import phishingResponse from "../../models/db-models/Phishing";
import { Service } from "typedi";

@Service()
export class Phishing {
  constructor() {}
  private check(url: string, fullUrl: string) {
    var checksPromises = [];

    checksPromises.push(
      new Promise((res, rej) => {
        axios
          .get("https://api.fishfish.gg/v1/domains/" + url)
          .then((x) => {
            return x.data;
          })
          .then(async (x: phishingResponse) => {
            if (x.category !== "safe") {
              res({ result: true, url: url });
            } else {
              res({ result: false, url: url });
            }
          })
          .catch((x) => {
            res({ result: false, url: url });
            // Ignore
          });
      })
    );

    checksPromises.push(
      new Promise((res, rej) => {
        axios
          .get("https://phish.sinking.yachts/v2/check/" + url)
          .then((x) => {
            return x.data;
          })
          .then(async (x: boolean) => {
            res({ result: Boolean(x), url: url });
          })
          .catch((x) => {
            res({ result: false, url: url });
            // Ignore
          });
      })
    );
    
    checksPromises.push(
      new Promise((res, rej) => {
        const params = new URLSearchParams();
        params.append("url", fullUrl);
        axios
          .post("https://urlhaus-api.abuse.ch/v1/url/", params)
          .then((x) => {
            return x.data;
          })
          .then((x) => {
            res({
              result:
                x &&
                x.query_status !== "no_results" &&
                x.url_status === "online",
              url: url,
            });
          })
          .catch((x) => {
            res({ result: false, url: url });
          });
      })
    );

    return Promise.all(checksPromises);
  }

  async checkForPhishing(message: Message): Promise<boolean> {
    if (
      !message.inGuild() ||
      !message.author ||
      message.author.bot ||
      !message.member ||
      message.type === MessageType.ThreadCreated ||
      message.type === MessageType.GuildBoost ||
      message.type === MessageType.GuildBoostTier1 ||
      message.type === MessageType.GuildBoostTier2 ||
      message.type === MessageType.GuildBoostTier3 ||
      message.type === MessageType.ThreadStarterMessage
    ) {
      return false;
    }
    var links = Array.from(
      message.content.matchAll(/(http[s]?:\/\/([^ \n])*)/gim)
    );
    if (links.length <= 0) return false;

    var promises: Promise<unknown>[] = [];
    links.forEach((x) => {
      var fullUrl = x[0];
      var url = x[0].substring(x[0].toLowerCase().indexOf("://") + 3).trim();

      url = url.substring(0, url.indexOf("/") || url.length);

      promises.push(this.check(url, fullUrl));
    });
    var result = await Promise.allSettled(promises);

    try {
      var values = result.flatMap((x) => x.status === "fulfilled" && x.value);
      var found = values.find((data: any) => {
        return (data as { result: boolean; url: string }).result;
      }) as { result: boolean; url: string } | undefined;
      return (found !== undefined && found.result) || false;
    } catch (x) {
      console.log(x);
      return false;
    }
  }
}
