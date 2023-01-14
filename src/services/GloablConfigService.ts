import { Inject, Service } from "typedi";
import GlobalConfigRepository from "../repositories/globalConfigRepository";

@Service()
class GlobalConfigService {
  @Inject()
  private GlobalConfigRepo: GlobalConfigRepository;
  async getOrCreate() {
    var found = await this.GlobalConfigRepo.filterOne("blacklisted", (x) =>
      x.exists()
    );
    if (found) return found;

    var created = await this.GlobalConfigRepo.createOne();

    created = await this.GlobalConfigRepo.save(created);

    return created;
  }

  async blacklistUser(user: string) {
    var config = await this.getOrCreate();
    config.blacklisted[user] = true;

    await this.GlobalConfigRepo.save(config);
    return config;
  }
  
  async unBlacklistUser(user: string) {
    var config = await this.getOrCreate();
    config.blacklisted[user] = false;

    await this.GlobalConfigRepo.save(config);
    return config;
  }

  async isBlacklistedText(text: string){
    var config = await this.getOrCreate()
    return config.blacklistText.find(x => {
        return text.match(RegExp(x, "gim"))?.length !== undefined
    }) !== undefined
  }
}


export default GlobalConfigService;
