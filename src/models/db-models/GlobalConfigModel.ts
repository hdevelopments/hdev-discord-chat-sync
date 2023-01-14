import { Document, Field } from "ts-mongodb-orm";
import BaseModel from "./BaseModel";

@Document({ collectionName: "globalConfigModel" })
export default class globalConfigModel extends BaseModel {
  @Field()
  blacklisted: {[key:string]:boolean} = {}
}
