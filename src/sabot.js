const discord = require('discord.js');

class Sabot {
  constructor(dbAdapter) {
    this.dbAdapter = dbAdapter;

    this.api = new discord.Client();
    this.api.on('ready', () => { this.handleReady(); });
    this.api.on('message', (message) => { this.handleMessage(message); });
  }

  login(token) {
    console.log('Sabot logging in...')
    this.api.login(token);
    this.dbAdapter.connect();
  }

  logout() {
    console.log('Sabot logging out...')
    this.api.destroy();
  }

  // When the bot arrives online
  handleReady() {
    console.log('Sabot ready!');
  }

  // When a message is posted in a channel
  handleMessage(message) {
    const content = message.content;
    if (message.author.bot === true) {
      return;
    }
    if (content.startsWith('!word_count')) {
      let word = content.split(' ')[1]
      this.dbAdapter.getWordCount(word).then(
        (res) => {
          if (res === null) {
            message.channel.sendMessage(`Word "${word}" has never been spotted here...`);
          } else {
            message.channel.sendMessage(`Word "${word}" has been spotted ${res.count} times here!`);
          }
        });
    } else {
      this.dbAdapter.incrementWord(message, 1);
    }
  }

  splitCommand(content) {
    return content.split(' ');
  }
}

module.exports = Sabot;
