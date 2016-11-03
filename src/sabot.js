const discord = require('discord.js');

class Sabot {
  constructor(dbAdapter) {
    this.dbAdapter = dbAdapter;
  }

  login(token) {
    this.client = this.makeDiscordClient();
    this.client.once('ready', () => {this.handleReady()});
    this.client.on('message', (message) => {this.handleMessage(message)});
    this.client.login(token);
    this.dbAdapter.connect();
  }

  logout() {
    this.client.destroy();
  }

  processMessage(message) {
    let content = message.content;
    // Split message's text into words
    let words = content.split(/\s+\W+|\s+|\W+/);
    // Count how many times each word appears
    let counter = {};
    words.forEach((word) => {
      if (word.length === 0) {
        return;
      }
      if (counter.hasOwnProperty(word)) {
        counter[word]++;
      } else {
        counter[word] = 1;
      }
    });
    // Increment every word's count in the DB
    for (let word in counter) {
      this.dbAdapter.incrementWord(word, counter[word]);
    }
  }

  processWordCountCommand(message) {
    let spelling = message.content.split(' ')[1];
    return this.dbAdapter.getWordCount(spelling).then(
      (res) => {
        console.log(res)
        if (res === null) {
          message.channel.sendMessage(`Word "${spelling}" has never been spotted here...`);
        } else {
          message.channel.sendMessage(`Word "${spelling}" has been spotted ${res.count} times here!`);
        }
    });
  }

  // When the bot arrives online
  handleReady() {
    console.log('ready')
    // Maybe say hello or something
  }

  // When a message is posted in a channel
  handleMessage(message) {
    const content = message.content;
    if (message.author.bot === true) {
      return;
    }
    if (content.startsWith('!word_count')) {
      this.processWordCountCommand(message);
    } else {
      this.processMessage(message);
    }
  }

  makeDiscordClient() {
    return new discord.Client();
  }
}

module.exports = Sabot;
