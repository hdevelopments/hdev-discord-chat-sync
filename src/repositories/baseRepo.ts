import { createConnection, ObjectID, Repository } from "ts-mongodb-orm";
import { QueryOperator } from "ts-mongodb-orm/build/queries/QueryOperator";
import Config from "../discordConfig";
import BaseModel from "../models/db-models/BaseModel";
const connection = await createConnection({
  uri:
    Config.Db_Address!,
  dbName: process.env.DEV !== undefined ? "chat-bot-dev" : "chat-bot",
  mongoClientOptions: {
    ignoreUndefined: true, // preventing saving null value in server side
    serverSelectionTimeoutMS: 5000,
  },
});

export type ObjectType<T> = new (...args: any[]) => T;

export { connection };
export default class baseRepo<T extends BaseModel> {
  public repository: Repository<ObjectType<T>>;
  protected type: ObjectType<T>;

  protected ready: Promise<any>;
  constructor(model: ObjectType<T>) {
    this.type = model;
    this.repository = connection.getRepository(model);
    this.ready = this.sync();
  }

  public async sync() {
    await this.ready;
    await this.repository.syncIndex();
    await this.repository.syncSchemaValidation();
  }
  async getOneById(id: ObjectID): Promise<T | undefined> {
    await this.ready;
    return await this.repository.findOne(id);
  }

  async filterMany(key: keyof T, filter: (query: QueryOperator<T>) => void) {
    await this.ready;
    return await this.repository.query().filter(key, filter).findMany();
  }

  async filterOne(key: keyof T, filter: (query: QueryOperator<T>) => void) {
    await this.ready;
    return await this.repository.query().filter(key, filter).findOne();
  }

  async insert(item: any | any[]) {
    await this.ready;
    return await this.repository.insert(item);
  }

  async insertOrUpdate(item: T | T[]) {
    await this.ready;
    if (Array.isArray(item)) {
      var results: T[] = [];
      item.forEach(async (item) => {
        var old = await this.getOneById(item._id);
        if (old) {
          results.push(await this.repository.update(item));
        } else {
          results.push(await this.repository.insert(item));
        }
      });
      return results;
    } else {
      var results: T[] = [];
      var old = await this.getOneById(item._id);
      if (old) {
        results.push(await this.repository.update(item));
      } else {
        results.push(await this.repository.insert(item));
      }
      return results;
    }
  }

  async getOrInsert(id: ObjectID) {
    await this.ready;
    var found = await this.getOneById(id);
    if (!found) {
      return this.repository.create();
    } else {
      return found;
    }
  }

  async save(data: T) {
    await this.ready;
    var found = await this.getOneById(data._id);
    if (!found) {
      return await this.repository.insert(data);
    } else {
      return await this.repository.update(data);
    }
  }

  async createOne() {
    return this.repository.create();
  }

  async removeOne(data: T) {
    return this.repository.delete(data);
  }
}
