import { APIUser, User } from "discord.js";
import { ObjectID } from "ts-mongodb-orm";
import { Inject, Service } from "typedi";
import guildCategory from "../models/db-models/GuildCategoryModel";
import guildConfig from "../models/db-models/GuildConfigModel";
import GuildCategoryRepo from "../repositories/GuildCategoryRepo";
import GuildConfigRepo from "../repositories/GuildConfigRepo";

@Service()
class GuildConfigService {
  @Inject()
  private GuildConfigRepo: GuildConfigRepo;
  @Inject()
  private GuildCategoryRepo: GuildCategoryRepo;
  async getOrCreate(guild: string) {
    var found = await this.GuildConfigRepo.filterOne("guild", (x) =>
      x.eq(guild)
    );
    if (found) return found;

    var created = await this.GuildConfigRepo.createOne();
    created.guild = guild;

    created = await this.GuildConfigRepo.save(created);

    return created;
  }
  async getOrCreateCategory(category: string, owner: User | APIUser | string) {
    var found = await this.GuildCategoryRepo.filterOne("name", (x) =>
      x.eq(category)
    );
    if (found) return found;

    var created = await this.GuildCategoryRepo.createOne();
    created.name = category;
    created.owner =
      owner instanceof User
        ? owner.id
        : owner instanceof User
        ? owner.id
        : (owner as string);

    return await this.GuildCategoryRepo.save(created);
  }
  async findCategory(categoryId: ObjectID) {
    return await this.GuildCategoryRepo.getOneById(categoryId);
  }
  async save(guildConfig: guildConfig) {
    return await this.GuildConfigRepo.save(guildConfig);
  }

  async saveCategory(category: guildCategory) {
    return await this.GuildCategoryRepo.save(category);
  }

  async removeCategory(category: guildCategory) {
    return await this.GuildCategoryRepo.removeOne(category);
  }

  async getAllChannels() {
    return await this.GuildConfigRepo.filterMany("channels", (x) => x.exists());
  }

  async getAllCategories() {
    return await this.GuildCategoryRepo.filterMany("_id", (x) => x.exists());
  }

  async changeAllChannelsFromTo(oldCategory: string, newCategory: string){
    console.log(await this.GuildConfigRepo.filterMany("channels.$all", x => x.exists(true), true))
  }
}

export default GuildConfigService;
