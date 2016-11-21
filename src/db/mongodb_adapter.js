const mongoose = require('mongoose');

const base = require('./base.js')

mongoose.Promise = global.Promise;

let Word = mongoose.model('Word', {
  channelId: String,
  guildId: String,
  count: { type: Number, default: 0 },
  spelling: String
});

// The MongoDB adapter's config only needs an "url" field, which represents the DB server's location
class MongoDBAdapter extends base {
  connect(config) {
    mongoose.connect(this.config.url);
    this.db = mongoose.connection;
    this.db.on('error', this.handleConnectionError);
  }

  getWordCount(spelling, guildId, channelId = null) {
    let findParams = { spelling: spelling, guild_id: guildId };
    if (channelId !== null) {
      findParams.channel_id = channelId;
    }
    return Word.findOne(findParams).exec();
  }

  incrementWord(guildId, channelId, spelling, count) {
    Word.findOneAndUpdate(
      { guild_id: guildId, channel_id: channelId, spelling: spelling },
      { $inc: { count: count }},
      { upsert: true, new: true, setDefaultsOnInsert: true },
      (yes, no) => {console.log('lel')});
  }

  handleConnectionError(err) {
    console.error('DB connection error: ' + err);
  }
}

module.exports = MongoDBAdapter;
