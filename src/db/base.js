class BaseDBAdapter {
  constructor(config) {
    this.config = config;
  }

  connect() {
    throw new TypeError('The connect method should be overriden by your DB adapter.');
  }

  getWordCount(spelling, guildId, channelId = null) {
    throw new TypeError('The getWordCount method should be overriden by your DB adapter.');
  }

  incrementMessageCount(guildId, channelId) {
    throw new TypeError('The getWordCount method should be overriden by your DB adapter.');
  }

  incrementWord(guildId, channelId, spelling, count) {
    throw new TypeError('The incrementWord method should be overriden by your DB adapter.');
  }
}

module.exports = BaseDBAdapter;
