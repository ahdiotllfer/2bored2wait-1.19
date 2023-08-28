import * as mcproxy from './plugins/mcproxy-1.19/src';
const minecraft_protocol = require('minecraft-protocol');
const fs = require('fs');
let inactivityInterval: NodeJS.Timeout | null = null;
const stripAnsi = require('strip-ansi');
import * as http from 'http';
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
let isqueued = true;
const version = config.version;
const str = config.serverIp;
const host = str.split(':')[0];
const port = Number(str.split(':')[1]);
const username = config.username;
const authMethod = config.authMethod;
const whost = 'localhost';
const wport = 8080;
const path = require('path');

let conn = new mcproxy.Conn({
    username,
    auth: authMethod,
    version,
    host,
    port,
  });
  
let client = conn.bot._client;
const inactivityThreshold = 12 * 1000;
conn.stateData.bot.on('spawn', async () => {
    if (isqueued == true) {
      isqueued = false;
      console.log('queue is completed. Connecting to server');
    }
    else {
      console.log('respawn')
    }
    let lastActivityTime = Date.now();
    inactivityInterval = setInterval(() => {
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivityTime;
  
      if (timeSinceLastActivity >= inactivityThreshold) {
        const directions = ['forward', 'back', 'left', 'right'];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
  
        conn.bot.setControlState('jump', true);
        setTimeout(() => {
          conn.bot.setControlState('jump', false);
        }, 500);
  
        conn.bot.setControlState('sneak', true);
        setTimeout(() => {
          conn.bot.setControlState('sneak', false);
        }, 500);
  
        conn.bot.setControlState('forward', randomDirection === 'forward');
        conn.bot.setControlState('back', randomDirection === 'back');
        conn.bot.setControlState('left', randomDirection === 'left');
        conn.bot.setControlState('right', randomDirection === 'right');
  
        lastActivityTime = Date.now();
      } else {
        conn.bot.setControlState('forward', false);
        conn.bot.setControlState('back', false);
        conn.bot.setControlState('left', false);
        conn.bot.setControlState('right', false);
        conn.bot.setControlState('jump', false);
        conn.bot.setControlState('sneak', false);
      }
    }, 1500);
});
conn.stateData.bot.on('error', (err: any) => {
  console.error(err);
});

const server = minecraft_protocol.createServer({
  version,
  host: '0.0.0.0',
  'online-mode': false,
  port: 25567,
});

server.on('listening', () => {
  console.info('Listening on', 25566);
});

server.on('login', async (client: any) => {

  conn.sendPackets(client);
  conn.link(client);
  console.log('client connected to proxy')
});
let position: string; 

conn.bot.on('message', (message) => {
  if (isqueued == true) {
    const plainMessage = stripAnsi(message.toAnsi());
    if (plainMessage.includes('Position in queue:')) {
      position = plainMessage.match(/\d+/)[0];
      console.log(`Position in queue: ${position}`);
    }
  }
});
const requestListener = function (req: any, res: any) {
  res.writeHead(200);
  res.end(`Position in queue: ${position}`);
};
setInterval(() => {
  wserver.removeAllListeners('request');
  
  wserver.on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200);
    res.end(`Position in queue: ${position}`);
  });
  
}, 5000);

const wserver = http.createServer(requestListener);
wserver.listen(wport, whost, () => {
    console.log(`Server is running on http://${whost}:${wport}`);
});