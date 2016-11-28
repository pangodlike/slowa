const discord = require('discord.js');
const englishStopWords = require('stopwords').english;
const frenchStopWords = require('stopwords').french;

class Sabot {
  constructor(dbAdapter) {
    this.dbAdapter = dbAdapter;
    this.stopWords = englishStopWords.concat(frenchStopWords);
  }

  countMessage(message) {
    this.dbAdapter.incrementMessageCount(message.channel.guild.id, message.channel.id);
  }

  login(token) {
    this.client = this.makeDiscordClient();
    this.client.once('ready', () => {this.handleReady();});
    this.client.on('message', (message) => {this.handleMessage(message);});
    this.client.login(token);
    this.dbAdapter.connect();
  }

  logout() {
    this.client.destroy();
  }

  processMessage(message) {
    // Split message's text into words
    let words = message.content.split(/\s+\W+|\s+|\W+/);
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
      this.dbAdapter.incrementWord(message.channel.guild.id, message.channel.id, word, counter[word]);
    }
  }

  processMessageCountCommand(message) {
    let splitCommand = message.content.split(' ');
    let serverWide = splitCommand.indexOf('-S') !== -1;
    let channelId = serverWide ? null : message.channel.id;
    let outputPostfix = serverWide ? 'server' : 'channel';
    return this.dbAdapter.getMessageCount(message.channel.guild.id, channelId).then(
      (res) => {
        message.channel.sendMessage(`${res} messages have been sent on this ${outputPostfix}!`);
      }, (err) => { return err; });
  }

  processPopularWordsCommand(message) {
    let splitCommand = message.content.split(' ');
    let serverWide = splitCommand.indexOf('-S') !== -1;
    let channelId = serverWide ? null : message.channel.id;
    let outputPostfix = serverWide ? 'server' : 'channel';
    return this.dbAdapter.getPopularWords(message.channel.guild.id, channelId, 10, this.stopWords).then(
      (res) => {
        let output = `The most popular words on this ${outputPostfix} are:`;
        for (let word of res) {
          output += `\n${word.spelling}: ${word.count} times`
        }
        message.channel.sendMessage(output);
      }, (err) => { return err; });
  }

  processWordCountCommand(message) {
    let splitCommand = message.content.split(' ');
    let spelling = splitCommand[1];
    let serverWide = splitCommand.indexOf('-S') !== -1;
    let channelId = serverWide ? null : message.channel.id;
    let outputPostfix = serverWide ? 'server' : 'channel';
    return this.dbAdapter.getWordCount(spelling, message.channel.guild.id, channelId).then(
      (res) => {
        if (res === null) {
          message.channel.sendMessage(`Word "${spelling}" has never been spotted on this ${outputPostfix}...`);
        } else {
          message.channel.sendMessage(`Word "${spelling}" has been spotted ${res.count} times on this ${outputPostfix}!`);
        }
      }, (err) => { return err; });
  }

  // When the bot arrives online
  handleReady() {
    console.log('Sabot ready!');
    // Maybe say hello or something
  }

  // When a message is posted in a channel
  handleMessage(message){
    const content = message.content;
    if (message.author.bot === true) {
      return;
    }
    this.countMessage(message);
    if (content.startsWith('!word_count')) {
      this.processWordCountCommand(message);
    } else if (content.startsWith('!popular_words')) {
      this.processPopularWordsCommand(message);
    } else if (content.startsWith('!message_count')) {
      this.processMessageCountCommand(message);
    } else {
      this.processMessage(message);
    }
  }

  makeDiscordClient() {
    return new discord.Client();
  }
}

module.exports = Sabot;
