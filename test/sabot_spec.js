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

  function makeMessage(content, isBot = false) {
    return {
      author: {
        bot: isBot,
      },
      content: content,
      channel: {
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

    it('should be waiting for one "ready" event from Discord', function() {
      assert(discordClient.once.calledWith('ready', sabot.handleReady));
      assert(discordClient.once.calledOnce);
    });

    it('should be waiting for one or more "message" events from Discord', function() {
      assert(discordClient.on.calledWith('message', sabot.handleMessage));
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
    let processMessageSpy;
    let processWordCountCommandSpy;

    beforeEach(function() {
      setupMocks();
      processMessageSpy = sinon.spy(sabot, 'processMessage');
      processWordCountCommandSpy = sinon.spy(sabot, 'processWordCountCommand');
    });

    it('should not react to messages sent by bots', function() {
      sabot.handleMessage(makeMessage('abcd', true));
      assert.equal(0, processMessageSpy.callCount);
      assert.equal(0, processWordCountCommandSpy.callCount);
    });

    it('should react to !word_count command', function() {
      let processWordCountCommandStub = sinon.stub();
      sabot.processWordCountCommand = processWordCountCommandStub;
      message = makeMessage('!word_count abcd');
      sabot.handleMessage(message);
      assert(processWordCountCommandStub.calledWith(message));
      assert(processWordCountCommandStub.calledOnce);
    });

    it('should count words in normal message', function() {
      message = makeMessage('abcd');
      sabot.handleMessage(message);
      assert(processMessageSpy.calledWith(message));
      assert(processMessageSpy.calledOnce);
    });
  });

  describe('processMessage()', function() {
    beforeEach(function() {
      setupMocks();
    });

    it('should count words properly', function() {
      sabot.processMessage(makeMessage('word1, word2+word3  word1! word1_word1'));
      assert(dbAdapter.incrementWord.calledWith('word1', 2));
      assert(dbAdapter.incrementWord.calledWith('word1_word1', 1));
      assert(dbAdapter.incrementWord.calledWith('word2', 1));
      assert(dbAdapter.incrementWord.calledWith('word3', 1));
      assert.equal(4, dbAdapter.incrementWord.callCount);
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
        assert(message.channel.sendMessage.calledWith('Word "some_word" has been spotted 42 times here!'));
      });
    });

    it('should properly handle non existing words', function() {
      dbAdapter.getWordCount.returns(Promise.resolve(null));
      let message = makeMessage('!word_count some_word');
      return sabot.processWordCountCommand(message).then(() => {
        assert(message.channel.sendMessage.calledOnce);
        assert(message.channel.sendMessage.calledWith('Word "some_word" has never been spotted here...'));
      });
    });
  });
});