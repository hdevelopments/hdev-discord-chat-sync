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

  async getCategory(category: string) {
    return await this.GuildCategoryRepo.filterOne("name", (x) =>
      x.eq(category)
    );
  }

  async getByCategoryId(categoryId: string) {
    return await this.GuildCategoryRepo.filterOne("_id", (x) =>
      x.eq(categoryId)
    );
  }

  async getAllByCategoryId(categoryId: string) {
    return (await this.getAllChannels()).filter(x => {
      return Object.values(x.channels).find(x =>  x.category === categoryId ) !== undefined
    })
  }

  async getByChannel(guild: string, channel: string) {
    return (await this.GuildConfigRepo.filterOne("guild", (x) => x.eq(guild)))
      ?.channels[channel];
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
    var channels = await this.getAllChannels();
    channels.forEach(async (guilds) => {
      let changed = false;
      Object.entries(guilds.channels).forEach(async (channels) => {
        if (channels[1].category === category._id.toString()) {
          changed = true;
          delete guilds.channels[channels[0]];
        }
        if (changed) {
          await this.GuildConfigRepo.save(guilds);
        }
      });
    });
    return await this.GuildCategoryRepo.removeOne(category);
  }

  async remove(config: guildConfig) {
    return await this.GuildConfigRepo.removeOne(config);
  }

  async getAllChannels() {
    return await this.GuildConfigRepo.filterMany("channels", (x) => x.exists());
  }

  async getAllCategories() {
    return await this.GuildCategoryRepo.filterMany("_id", (x) => x.exists());
  }

  async changeAllChannelsFromTo(oldCategory: string, newCategory: string) {
    console.log(
      await this.GuildConfigRepo.filterMany(
        "channels.$all",
        (x) => x.exists(true),
        true
      )
    );
  }
}

export default GuildConfigService;
