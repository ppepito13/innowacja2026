require('dotenv').config();
const express = require('express');
const { ParseServer } = require('parse-server');

const config = {
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY,
    appName: process.env.APP_NAME,
    databaseURI: process.env.DATABASE_URI,
    serverURL: 'http://127.0.0.1:1337/parse',
    publicServerURL: process.env.PUBLIC_SERVER_URL,
    port: 1337,
    liveQuery: { classNames: [] },
    masterKeyIps: ['0.0.0.0/0', '::/0'],
    allowHeaders: [
        'X-Parse-Application-Id',
        'X-Parse-REST-API-Key',
        'X-Parse-Master-Key',
        'Content-Type'
    ],
    allowOrigin: '*'
};

const app = express();

async function start() {
    const server = new ParseServer(config);
    await server.start();
    app.use('/parse', server.app);
    app.listen(config.port, () => {
        console.log(`Parse Server działa na http://127.0.0.1:${config.port}/parse`);
    });
}

start().catch(console.error);