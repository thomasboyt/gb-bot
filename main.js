'use strict';

const Discord = require('discord.js');

const twitterFetch = require('./twitterFetch');
const secret = require('./secret.json');

const bot = new Discord.Client();

const adminName = secret.admin.split('#');

let channels;
let lastTweetId = null;

function sendToChannels(msg) {
  channels.forEach((channel) => {
    bot.sendMessage(channel, msg);
  });
}

bot.on('ready', () => {
  const server = bot.servers.get('name', secret.server);

  if (!server) {
    throw new Error(`Not connected to server: ${secret.server}`);
  }

  channels = secret.channels.map((channelName) => {
    const channel = bot.channels.filter((channel) => {
      return channel.server.name === secret.server && channel.name === channelName;
    })[0];

    if (!channel) {
      throw new Error(`Channel not found: #${channelName} on ${secret.server}`);
    }

    return channel;
  });


  const admin = bot.users.getAll('username', adminName[0]).get('discriminator', adminName[1]);
  bot.sendMessage(admin, `*** Giant Bot connected, outputting to #${secret.channels.join(', #')} on ${secret.server}`);

  checkLiveStream();
  setInterval(checkLiveStream, 60 * 1000);
});

function checkLiveStream() {
  console.log('Checking...');
  const twitterUrl = 'https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=giantbomblive&count=1';

  twitterFetch(twitterUrl).then((resp) => {
    return resp.json();
  }).then((resp) => {
    const latestId = resp[0].id;

    if (lastTweetId !== latestId) {
      console.log('New tweet');

      if (lastTweetId !== null) {
        sendToChannels(resp[0].text);
      }

      lastTweetId = latestId;
    }
  });
}

bot.login(secret.email, secret.password);

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.error(err.stack);
  process.exit(1);
});
