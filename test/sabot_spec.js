const assert = require('assert');
const sinon = require('sinon');

const Sabot = require('../src/sabot.js');

describe('Sabot', function() {
  const DISCORD_TOKEN = 'DISCORD_TOKEN';
  let dbAdapter;
  let discordClient;
  let sabot;

  function setupMocks() {
    dbAdapter = {
      connect: sinon.spy(),
      incrementMessageCount: sinon.spy(),
      incrementWord: sinon.spy(),
    };
    discordClient = {
      destroy: sinon.spy(),
      login: sinon.spy(),
      on: sinon.spy(),
      once: sinon.spy(),
    };
    sabot = new Sabot(dbAdapter);
    sinon.stub(sabot, 'makeDiscordClient').returns(discordClient);
  }

  function makeMessage(content, isBot = false, guildId = 1, channelId = 2) {
    return {
      author: {
        bot: isBot,
      },
      content: content,
      channel: {
        guild: {
          id: guildId,
        },
        id: channelId,
        sendMessage: sinon.spy(),
      },
    };
  }

  describe('constructor()', function() {
    beforeEach(function() {
      setupMocks();
    });

    it('should keep reference to dbAdapter', function() {
      assert(sabot.dbAdapter.hasOwnProperty('connect'));
      assert(sabot.stopWords.length > 0);
    });
  });

  describe('login()', function() {
    beforeEach(function() {
      setupMocks();
      sabot.login(DISCORD_TOKEN);
    });

    it('should login to discord', function() {
      assert(discordClient.login.calledOnce);
      assert(discordClient.login.calledWith(DISCORD_TOKEN));
    });

    it('should be waiting for one \'ready\' event from Discord', function() {
      assert(discordClient.once.calledWith('ready'));
      assert(discordClient.once.calledOnce);
    });

    it('should be waiting for one or more \'message\' events from Discord', function() {
      assert(discordClient.on.calledWith('message'));
      assert(discordClient.on.calledOnce);
    });

    it('should connect to the database', function() {
      assert(dbAdapter.connect.calledOnce);
    });
  });

  describe('logout()', function() {
    beforeEach(function() {
      setupMocks();
      sabot.login(DISCORD_TOKEN);
      sabot.logout(DISCORD_TOKEN);
    });

    it('should log the Discord client out', function() {
      assert(discordClient.destroy.calledOnce);
    });
  });

  describe('handleMessage()', function() {
    let countMessageSpy;
    let processMessageSpy;
    let processWordCountCommandSpy;

    beforeEach(function() {
      setupMocks();
      countMessageSpy = sinon.spy(sabot, 'countMessage');
      processMessageSpy = sinon.spy(sabot, 'processMessage');
      processWordCountCommandSpy = sinon.spy(sabot, 'processWordCountCommand');
    });

    it('should not react to messages sent by bots', function() {
      sabot.handleMessage(makeMessage('abcd', true));
      assert.equal(0, countMessageSpy.callCount);
      assert.equal(0, processMessageSpy.callCount);
      assert.equal(0, processWordCountCommandSpy.callCount);
    });

    it('should react to !message_count command', function() {
      let processMessageCountCommandStub = sinon.stub();
      sabot.processMessageCountCommand = processMessageCountCommandStub;
      let message = makeMessage('!message_count');
      sabot.handleMessage(message);
      assert(processMessageCountCommandStub.calledWith(message));
      assert(processMessageCountCommandStub.calledOnce);
    });

    it('should react to !popular_words command', function() {
      let processPopularWordsCommandStub = sinon.stub();
      sabot.processPopularWordsCommand = processPopularWordsCommandStub;
      let message = makeMessage('!popular_words');
      sabot.handleMessage(message);
      assert(processPopularWordsCommandStub.calledWith(message));
      assert(processPopularWordsCommandStub.calledOnce);
    });

    it('should react to !word_count command', function() {
      let processWordCountCommandStub = sinon.stub();
      sabot.processWordCountCommand = processWordCountCommandStub;
      let message = makeMessage('!word_count abcd');
      sabot.handleMessage(message);
      assert(processWordCountCommandStub.calledWith(message));
      assert(processWordCountCommandStub.calledOnce);
    });

    it('should count normal messages', function() {
      let message = makeMessage('abcd');
      sabot.handleMessage(message);
      assert(countMessageSpy.calledWith(message));
      assert(countMessageSpy.calledOnce);
    });

    it('should count command messages', function() {
      sabot.processWordCountCommand = sinon.spy();
      let message = makeMessage('!word_count');
      sabot.handleMessage(message);
      assert(countMessageSpy.calledWith(message));
      assert(countMessageSpy.calledOnce);
    });

    it('should count words in normal message', function() {
      let message = makeMessage('abcd');
      sabot.handleMessage(message);
      assert(processMessageSpy.calledWith(message));
      assert(processMessageSpy.calledOnce);
    });
  });

  describe('countMessage()', function() {
    beforeEach(function() {
      setupMocks();
    });

    it('should count messages properly', function() {
      sabot.countMessage(makeMessage('abcd'));
      assert(dbAdapter.incrementMessageCount.calledWith(1, 2));
      assert.equal(1, dbAdapter.incrementMessageCount.callCount);
    });
  });

  describe('processMessage()', function() {
    beforeEach(function() {
      setupMocks();
    });

    it('should count words properly', function() {
      sabot.processMessage(makeMessage('word1, word2+word3  word1! word1_word1'));
      assert(dbAdapter.incrementWord.calledWith(1, 2, 'word1', 2));
      assert(dbAdapter.incrementWord.calledWith(1, 2, 'word1_word1', 1));
      assert(dbAdapter.incrementWord.calledWith(1, 2, 'word2', 1));
      assert(dbAdapter.incrementWord.calledWith(1, 2, 'word3', 1));
      assert.equal(4, dbAdapter.incrementWord.callCount);
    });
  });

  describe('processMessageCountCommand()', function() {
    beforeEach(function() {
      setupMocks();
      dbAdapter.getMessageCount = sinon.stub();
    });

    it('should properly output message count', function() {
      dbAdapter.getMessageCount.returns(Promise.resolve(42));
      let message = makeMessage('!message_count');
      return sabot.processMessageCountCommand(message).then(() => {
        assert(message.channel.sendMessage.calledOnce);
        assert(message.channel.sendMessage.calledWith('42 messages have been sent on this channel!'));
      });
    });

    it('should properly output server-wide message count', function() {
      dbAdapter.getMessageCount.returns(Promise.resolve(42));
      let message = makeMessage('!message_count -S');
      return sabot.processMessageCountCommand(message).then(() => {
        assert(message.channel.sendMessage.calledOnce);
        assert(message.channel.sendMessage.calledWith('42 messages have been sent on this server!'));
      });
    });
  });

  describe('processWordCountCommand()', function() {
    beforeEach(function() {
      setupMocks();
      dbAdapter.getWordCount = sinon.stub();
    });

    it('should properly handle existing words', function() {
      dbAdapter.getWordCount.returns(Promise.resolve({count: 42}));
      let message = makeMessage('!word_count some_word');
      return sabot.processWordCountCommand(message).then(() => {
        assert(message.channel.sendMessage.calledOnce);
        assert(message.channel.sendMessage.calledWith('Word "some_word" has been spotted 42 times on this channel!'));
      });
    });

    it('should properly handle existing words server-wide', function() {
      dbAdapter.getWordCount.returns(Promise.resolve({count: 42}));
      let message = makeMessage('!word_count some_word -S');
      return sabot.processWordCountCommand(message).then(() => {
        assert(message.channel.sendMessage.calledOnce);
        assert(message.channel.sendMessage.calledWith('Word "some_word" has been spotted 42 times on this server!'));
      });
    });

    it('should properly handle non existing words', function() {
      dbAdapter.getWordCount.returns(Promise.resolve(null));
      let message = makeMessage('!word_count some_word');
      return sabot.processWordCountCommand(message).then(() => {
        assert(message.channel.sendMessage.calledOnce);
        assert(message.channel.sendMessage.calledWith('Word "some_word" has never been spotted on this channel...'));
      });
    });

    it('should properly handle non existing words server-wide', function() {
      dbAdapter.getWordCount.returns(Promise.resolve(null));
      let message = makeMessage('!word_count some_word -S');
      return sabot.processWordCountCommand(message).then(() => {
        assert(message.channel.sendMessage.calledOnce);
        assert(message.channel.sendMessage.calledWith('Word "some_word" has never been spotted on this server...'));
      });
    });
  });

  describe('processPopularWordsCommand()', function() {
    beforeEach(function() {
      setupMocks();
      dbAdapter.getPopularWords = sinon.stub();
    });

    it('should properly output popular words', function() {
      dbAdapter.getPopularWords.returns(Promise.resolve([
        {spelling: 'eh', count: 4},
        {spelling: 'ah', count: 3},
        {spelling: 'oh', count: 2},
      ]));
      let message = makeMessage('!popular_words');
      return sabot.processPopularWordsCommand(message).then(() => {
        assert(message.channel.sendMessage.calledOnce);
        assert(message.channel.sendMessage.calledWith('The most popular words on this channel are:'
          + '\neh: 4 times'
          + '\nah: 3 times'
          + '\noh: 2 times'));
      });
    });

    it('should properly output server-wide popular words', function() {
      dbAdapter.getPopularWords.returns(Promise.resolve([
        {spelling: 'eh', count: 4},
        {spelling: 'ah', count: 3},
        {spelling: 'oh', count: 2},
      ]));
      let message = makeMessage('!popular_words -S');
      return sabot.processPopularWordsCommand(message).then(() => {
        assert(message.channel.sendMessage.calledOnce);
        assert(message.channel.sendMessage.calledWith('The most popular words on this server are:'
          + '\neh: 4 times'
          + '\nah: 3 times'
          + '\noh: 2 times'));
      });
    });
  });
});