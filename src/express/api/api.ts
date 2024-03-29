import express from "express";
import bot from "../../main";
import { typeDiDependencyRegistryEngine } from "discordx";
import GuildConfigService from "../../services/GuildConfigService";
const router = express.Router();

var guildConf: GuildConfigService;
// middleware that is specific to this router
router.use((req, res, next) => {
  if (!guildConf)
    guildConf = typeDiDependencyRegistryEngine.getService(GuildConfigService)!;
  console.log("Time: ", Date.now());
  next();
});
// define the home page route
router.get("/servers", (req, res) => {
  res.json({
    servers: bot.guilds.cache.size,
  });
});
// define the about route
router.get("/channels", async (req, res) => {
  var guilds = await guildConf.getAllChannels();
  var channels = 0;
  guilds.forEach((x) => {
    Object.entries(x.channels).forEach((x) => {
      channels++;
    });
  });

  res.json({
    channels: channels,
  });
});

// define the about route
router.get("/support", async (req, res) => {
  var guild = bot.guilds.cache.get("995759386142179358");
  var members = await guild?.members.fetch({ withPresences: true });
  res.json({
    members: members?.size,
    online: members?.filter(
      (x) => x.presence?.status === "online" || x.presence?.status === "dnd"
    ).size,
    idle: members?.filter((x) => x.presence?.status === "idle").size,
    offline: members?.filter(
      (x) =>
        !x.presence?.status ||
        x.presence?.status === "offline" ||
        x.presence?.status === "invisible"
    ).size,
  });
});

export { router as apirouter };
