class BaseDBAdapter {
  constructor(config) {
    this.config = config;
  }

  connect() {
    console.error('The connect method should be defined by your DB adapter. DO NOT use BaseDBAdapter!');
  }

  getWordCount(spelling, guildId, channelId = null) {
    console.error('The getWordCount method should be defined by your DB adapter. DO NOT use BaseDBAdapter!');
  }

  incrementWord(guildId, channelId, spelling, count) {
    console.error('The incrementWord method should be defined by your DB adapter. DO NOT use BaseDBAdapter!');
  }
}

module.exports = BaseDBAdapter;
