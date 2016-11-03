const mongoose = require('mongoose');

const base = require('./base.js')

mongoose.Promise = global.Promise;

let Word = mongoose.model('Word', {spelling: String, count: { type: Number, default: 0 }});

// The MongoDB adapter's config only needs an "url" field, which represents the DB server's location
class MongoDBAdapter extends base {
  connect(url) {
    mongoose.connect(this.config.url);
    this.db = mongoose.connection;
    this.db.on('error', this.handleConnectionError);
  }

  getWordCount(spelling) {
    return Word.findOne({ spelling: spelling }).exec();
  }

  incrementWord(spelling, count) {
    Word.findOneAndUpdate(
      { spelling: spelling },
      { $inc: { count: count }},
      { upsert: true, new: true, setDefaultsOnInsert: true },
      () => {});
  }

  handleConnectionError(err) {
    console.error('DB connection error: ' + err);
  }
}

module.exports = MongoDBAdapter;
