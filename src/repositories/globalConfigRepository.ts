import { Service } from "typedi";
import baseRepo from "./baseRepo";
import globalConfigModel from "../models/db-models/GlobalConfigModel";

@Service()
export default class GlobalConfigRepository extends baseRepo<globalConfigModel> {
  constructor(){
    super(globalConfigModel)
  }
}
