import { Document, Field, ObjectId } from "ts-mongodb-orm";
import BaseModel from "./BaseModel";
import BadgesModel from "./BadgeModel";



@Document({ collectionName: "guildConfig" })
export default class guildConfig extends BaseModel {
  @Field({ isRequired: true })
  guild: string;

  @Field({ isRequired: true })
  banned: boolean = false;

  @Field()
  configs: { [key: string]: any } = {};

  @Field()
  vip: boolean = false;

  @Field()
  profile: {bagdes: BadgesModel[], options: {[key:string]: any}} = {bagdes: [], options: {}}

  @Field({ isRequired: false })
  channels: {
    [key: string]: {
      guild: string;
      channel: string;
      category: string;
      configs: {[key: string]: any}
      lastMessages: {[key: string]: number | undefined};
    };
  } = {};
}
