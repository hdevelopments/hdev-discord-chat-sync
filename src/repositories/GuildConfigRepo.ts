import { Service } from "typedi";
import guildConfig from "../models/db-models/GuildConfigModel";
import baseRepo from "./baseRepo";

@Service()
export default class GuildConfigRepo extends baseRepo<guildConfig> {
  constructor(){
    super(guildConfig)
  }
}
