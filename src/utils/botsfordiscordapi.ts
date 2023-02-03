import axios from "axios";
import Config from "../discordConfig";
import bot, { memberCounts } from "../main";

class discordsApi {
  async syncUp() {
    if (!Config.Discords_Api_Token) return;
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
        "server_count": memberCounts
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
