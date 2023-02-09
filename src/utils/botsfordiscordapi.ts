import axios from "axios";
import Config from "../discordConfig";
import bot, { memberCounts } from "../main";
import { InfinityAutoPoster } from "ibl-autopost";
import { BaseClient } from "ibl-autopost/dist/clients/BaseClient";
var poster: BaseClient | undefined;
class discordsApi {
  async syncUp() {
    if (!Config.Discords_Api_Token) return;
    if (!poster && !process.env.DEV) {
      poster = InfinityAutoPoster(process.env.INFINITY_BOT_API_TOKEN!, bot); // your discord.js or eris client

      // Optional Logger
      poster.on("error", (err) => {
        console.log(err);
      });
      // Optional Logger
      poster.on("posted", (stats) => {
        console.log(
          `Posted stats to the Infinity Bot List API | ${stats.servers} servers`
        );
      });
    }
    axios
      .post(
        "https://discords.com/bots/api/bot/" + bot.user?.id,
        { server_count: bot.guilds.cache.size },
        {
          headers: {
            Authorization: Config.Discords_Api_Token,
          },
        }
      )
      .then((x) => {
        return x.data;
      })
      .then((x) => {
        console.log("Synced with discords");
        console.log(x);
      })
      .catch((x) => {});

    axios
      .post(`https://top.gg/api/bots/${bot.user?.id}/stats`, {
        server_count: memberCounts,
      })
      .then((x) => {
        return x.data;
      })
      .then((x) => {
        console.log("Synced with Top.gg");
        console.log(x);
      })
      .catch((x) => {});
  }
}
export default discordsApi;
