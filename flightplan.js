const plan = require('flightplan');
const secret = require('./secret.json').deploy;

plan.target('production', {
  host: secret.host,
  username: secret.username,
  agent: process.env.SSH_AUTH_SOCK,
});

// plan.remote('provision', {
  // XXX: some day figure out how to provision node here:
  // curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
  // sudo apt-get install -y nodejs

  // XXX: by default you have to be sudo to do this (both due to /usr/lib/node_modules being
  // root-owned and /usr/lib/bin being root-owned...)
  // might be okay to chown but idk?
  // remote.npm('install -g forever');
// });

plan.local((local) => {
  const srcFiles = local.git('ls-files', {silent: true}).stdout.split('\n');
  srcFiles.push('secret.json');

  local.log('Uploading files...');
  local.transfer(srcFiles, '/tmp/gbbot');
});

plan.remote((remote) => {
  remote.mkdir(`-p ${secret.path}`);
  remote.cd(secret.path);

  remote.with(`cd ${secret.path}`, () => {
    remote.log('Replacing files...');

    remote.cp('-r /tmp/gbbot/. .');

    remote.log('Installing dependencies...');

    remote.npm('install --only=production');

    remote.log('Restarting app...');

    remote.exec('forever stop main.js', {failsafe: true});
    remote.exec('forever start main.js');
  });
});
