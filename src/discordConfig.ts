import dotenv from 'dotenv'

dotenv.config({
  path: process.env.DEV && "./src/.env_dev" || "./src/.env",
  debug: true,
});

var Config = {
  Bot_Token: process.env.BOT_TOKEN,
  Db_Address: process.env.DB_ADDRESS,
  Discords_Api_Token: process.env.DISCORDS_API
};

export default Config;
