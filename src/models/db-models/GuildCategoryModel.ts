import { Document, Field, ObjectId } from "ts-mongodb-orm";
import BaseModel from "./BaseModel";


@Document({collectionName: "guildCategory"})
export default class guildCategory extends BaseModel{
    @Field()
    name: string = "DEFAULTPLEASENAMEME"
    @Field()
    nsfw: boolean = false
    @Field()
    owner?: string
    @Field()
    description?: string
}