import { Document, Field, ObjectId } from "ts-mongodb-orm";

@Document({collectionName: "baseModel"})
export default class BaseModel {
    @Field({index: "text", indexOptions: {unique: true}})
    _id: ObjectId = new ObjectId()
}