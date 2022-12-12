import axios from "axios"
import Config from "../discordConfig"
import bot from "../main"

class discordsApi {
    async syncUp(){
        if(!Config.Discords_Api_Token) return
        axios.post("https://discords.com/bots/api/bot/" + bot.botId, {server_count: bot.guilds.cache.size}, {headers: {
            Authorization: Config.Discords_Api_Token
        }}).then(x =>{
            return x.data
        }).then(x => {
            console.log("Synced with discords")
            console.log(x)
        }).catch(x => {
            console.error(x)
        })
    }
}
export default discordsApi