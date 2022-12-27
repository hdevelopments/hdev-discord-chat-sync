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

export { router as apirouter };
