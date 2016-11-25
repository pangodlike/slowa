const mongoose = require('mongoose');

const base = require('./base.js');

mongoose.Promise = global.Promise;

let Channel = mongoose.model('Channel', {
  id: String,
  guild_id: String,
  message_count: { type: Number, default: 0 },
});

let Word = mongoose.model('Word', {
  channel_id: String,
  guild_id: String,
  count: { type: Number, default: 0 },
  spelling: String,
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

  getMessageCount(guildId, channelId = null) {
    let findParams = { guild_id: guildId };
    if (channelId !== null) {
      findParams.id = channelId;
    }
    return Channel.find(findParams).exec().then(
      (res) => {
        let messageCount = 0;
        if (res !== null) {
          for (let channel of res) {
            messageCount += channel.message_count;
          }
        }
        return messageCount;
      },
      (err) => {});
  }

  incrementMessageCount(guildId, channelId) {
    Channel.findOneAndUpdate(
      { guild_id: guildId, id: channelId },
      { $inc: { message_count: 1 }},
      { upsert: true, new: true, setDefaultsOnInsert: true },
      (err, res) => {});
  }

  incrementWord(guildId, channelId, spelling, count) {
    Word.findOneAndUpdate(
      { guild_id: guildId, channel_id: channelId, spelling: spelling },
      { $inc: { count: count }},
      { upsert: true, new: true, setDefaultsOnInsert: true },
      (err, res) => {});
  }

  handleConnectionError(err) {
    console.error('DB connection error: ' + err);
  }
}

module.exports = MongoDBAdapter;
