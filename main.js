'use strict';

const Discord = require('discord.js');

const twitterFetch = require('./twitterFetch');
const secret = require('./secret.json');

const bot = new Discord.Client();

const adminName = secret.admin.split('#');

let channel;
let lastTweetId = null;

bot.on('ready', () => {
  const server = bot.servers.get('name', secret.server);

  if (!server) {
    throw new Error(`Not connected to server: ${secret.server}`);
  }

  channel = bot.channels.filter((channel) => channel.server.name === secret.server && channel.name === secret.channel)[0];

  if (!channel) {
    throw new Error(`Channel not found: #${secret.channel} on ${secret.server}`);
  }

  const admin = bot.users.getAll('username', adminName[0]).get('discriminator', adminName[1]);
  bot.sendMessage(admin, `*** Giant Bot connected, outputting to #${secret.channel} on ${secret.server}`);

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
        bot.sendMessage(channel, resp[0].text);
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
