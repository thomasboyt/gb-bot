"use strict";

const fetch = require('node-fetch');
const secret = require('./secret.json');

let bearer;

/*
 * adapted from twit: https://github.com/ttezel/twit
 */
function getBearer() {
  if (bearer) {
    return new Promise((resolve) => resolve(bearer));
  }

  const consumerKey = secret.twitter.consumerKey;
  const consumerSecret = secret.twitter.consumerSecret;
  const b64Credentials = new Buffer(consumerKey + ':' + consumerSecret).toString('base64');

  return fetch('https://api.twitter.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${b64Credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: 'grant_type=client_credentials',
  }).then((resp) => {
    if (resp.status !== 200) {
      return resp.text().then((text) => {
        console.error(text);
        throw new Error(`${resp.status} - ${resp.statusText}`);
      });
    }

    return resp.json();
  }).then((resp) => {
    console.log('Retrieved Twitter bearer token');
    bearer = resp.access_token;
    return resp.access_token;
  });
}

module.exports = function twitterFetch(url, opts) {
  opts = opts || {};
  opts.headers = opts.headers || {};

  return getBearer().then((bearer) => {
    opts.headers['Authorization'] = `Bearer ${bearer}`;

    return fetch(url, opts);
  });
}
