import express from "express";
import bot from "../../main";
import { typeDiDependencyRegistryEngine } from "discordx";
import GuildConfigService from "../../services/GuildConfigService";
import { channel } from "diagnostics_channel";
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
  res.json({
    members: guild?.memberCount,
    online: guild?.members.cache.filter(
      (x) =>
        x.presence?.clientStatus?.desktop === "online" ||
        x.presence?.clientStatus?.desktop === "dnd"
    ).size,
    idle: guild?.members.cache.filter(
      (x) => x.presence?.clientStatus?.desktop === "idle"
    ).size,
    offline: guild?.members.cache.filter(
      (x) => !x.presence?.clientStatus?.desktop
    ).size,
  });
});

export { router as apirouter };
