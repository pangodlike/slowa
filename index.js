const MongoDBAdapter = require('./src/db/mongodb_adapter.js');
const Sabot = require('./src/sabot.js');
const config = require('./config.js');

// Initialize bot
dbAdapter = new MongoDBAdapter({ url: config.mongoDBURL });
let bot = new Sabot(dbAdapter);
bot.login(config.discordToken);

// Log the bot out on SIGTERM
process.on('SIGTERM', function () {
  bot.logout();
});
