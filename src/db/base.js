class BaseDBAdapter {
  constructor(config) {
    this.config = config;
  }

  connect() {
    console.error('The connect method should be defined by your DB adapter. DO NOT use BaseDBAdapter!');
  }

  getWordCount(spelling) {
    console.error('The getWordCount method should be defined by your DB adapter. DO NOT use BaseDBAdapter!');
  }

  incrementWord(spelling, count) {
    console.error('The incrementWord method should be defined by your DB adapter. DO NOT use BaseDBAdapter!');
  }
}

module.exports = BaseDBAdapter;
