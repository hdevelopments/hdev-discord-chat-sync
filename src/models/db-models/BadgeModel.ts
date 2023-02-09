import { Document, Field } from "ts-mongodb-orm";

@Document({collectionName: "badges"})
export default class BadgesModel {
    @Field()
    name: string = ""

    @Field()
    iconEmoji: string
}