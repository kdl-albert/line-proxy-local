const Koa = require('koa');
const app = new Koa();

const Router = require('koa-router');
const router = new Router();

const io = require('socket.io-client');

const request = require('superagent');

const makePost = (url, body, header) => {
  return new Promise((resolve, reject) => {
    request
      .post(url)
      .set('x-line-signature', header['x-line-signature'])
      .set('content-type', header['content-type'])
      .set('accept', header['accept'])
      .set('user-agent', header['user-agent'])
      .send(body)
      .end((err, res) => {
        if (res && res.statusCode === 200) {
          resolve(res);
        } else {
          reject(err, res);
        }
      });
  });
};

const APP_PROXY_HOST = 'https://line-proxy-heroku.herokuapp.com';

const config = {
  lineConn: 'http://localhost:3010',
};

const lineConn = {
  qa: 'https://qa-line-connector.minarai.ch',
  stg: 'https://qa-line-connector.minarai.ch',
  prod: 'https://qa-line-connector.minarai.ch',
};


if (process.argv && process.argv.slice(2) && process.argv.slice(2).length > 0) {
  const envId = process.argv.slice(2)[0];
  if (lineConn.hasOwnProperty(envId)) {
    config.lineConn = lineConn[envId];
  }
}

const socket = io(APP_PROXY_HOST);
socket.on('connect', function () {
  console.log('connected');
});

socket.on('message', async (data) => {

  const query = JSON.parse(data.query);
  const url = `${config.lineConn}/message?channel_id=${query.channel_id}&application_secret=${query.application_secret}`;

  await makePost(url, JSON.parse(data.body), JSON.parse(data.header));

});

socket.on('event', function () {
  console.log('event');
});

socket.on('error', function () {
  console.log('error');
});


socket.on('disconnect', function () {
  console.log('disconnect');
});

app.use(router.routes())
  .use(router.allowedMethods());

app.listen(process.env.PORT || 4045);

console.log('Server start');
console.log('Connecting to socket ' + config.lineConn);
