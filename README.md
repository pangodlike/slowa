# Sabot

Sabot is a Node.js bot used to obtain anonymous statistics about the interactions on a **Discord** server.

### Features

* Can serve multiple channels and guilds at once.
* Supports the MongoDB database.
* Does not count messages sent by bots.

### Commands

* ```!message_count [-S]``` Displays the amount of messages that have been sent.
* ```!word_count <word> [-S]``` Displays the amount of times a *word* has been sent.

When the ```-S``` option is present, statistics for the whole server will be outputed instead of statistics for the current channel.

### Installation

1. ```git clone git@github.com:ianfdk/sabot.git```
2. ```cd sabot```
3. ```mv ./config_example.js ./config.js```
4. Edit config.js with your Discord token and database URL.
5. ```npm install```

### Running the bot

1. Make sure that your database server is running
2. ```node index.js```
