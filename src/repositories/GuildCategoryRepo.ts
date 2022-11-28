import { Service } from "typedi";
import guildCategory from "../models/db-models/GuildCategoryModel";
import baseRepo from "./baseRepo";

@Service()
export default class GuildCategoryRepo extends baseRepo<guildCategory> {
  constructor(){
    super(guildCategory)
  }
}
