const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

let Word = mongoose.model('Word', {spelling: String, count: { type: Number, default: 0 }});

// TODO: Should extend a base class
class MongoDBAdapter {
  constructor(url) {
    this.url = url;
  }

  connect() {
    mongoose.connect(this.url);
    this.db = mongoose.connection;
    this.db.on('error', this.handleConnectionError);
    this.db.once('open', this.handleConnectionSuccess);
  }

  getWordCount(spelling) {
    return Word.findOne({ spelling: spelling }).exec();
  }

  incrementWord(spelling, count) {
    Word.findOneAndUpdate(
      { spelling: spelling },
      { $inc: { count: count }},
      { upsert: true, new: true, setDefaultsOnInsert: true },
      this.handleIncrementResponse);
  }

  handleConnectionError(err) {
    console.log('DB connection error: ' + err);
  }

  handleConnectionSuccess() {
    console.log('DB connection success!');
  }

  handleIncrementResponse(err, res) {
    if (err) {
      console.log('Increment error! ' + err);
    }
    else {
      console.log('Increment success! ' + res);
    }
  }
}

module.exports = MongoDBAdapter;
