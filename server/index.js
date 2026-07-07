import express from 'express';
import { ParseServer } from 'parse-server';
import ParseDashboard from 'parse-dashboard';
import path from 'path';
const __dirname = path.resolve();
import https from 'https';
import ParseSwagger from 'parse-server-swagger';
import fs from 'fs';

import config from "./config.js";


export const app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/', express.static(path.join(__dirname, '/react')));

// Serve the Parse API on the /parse URL prefix
if (!process.env.TESTING) {
  const mountPath = process.env.PARSE_MOUNT || '/parse';
  const server = new ParseServer({
    ...config,
    cloud: __dirname + '/cloud/main.js',
  });
  await server.start();
  app.use(mountPath, server.app);

//  const parseSwagger = new ParseSwagger({});
  var parseSwagger = new ParseSwagger({
     serverURL: config.publicServerURL,
     apiRoot: "/parse",
     appId: config.appId,
     masterKey: config.masterKey,
  });
  app.use(parseSwagger);

  const dashboard = new ParseDashboard({
    "apps": [
      {
         serverURL: config.publicServerURL,
         appId: config.appId,
         masterKey: config.masterKey,
         appName: config.appName
      }
    ],
    "users": [
      {
         "user":"admin",
         "pass":"pass"
      }
    ]
  });
  app.use("/dashboard", dashboard);
}

// Parse Server plays nicely with the rest of your web routes
app.get('/dupa', function (req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function (req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

const options = {
    key: fs.readFileSync('./key.pem', 'utf8'),
    cert: fs.readFileSync('./server.crt', 'utf8'),
};

if (!process.env.TESTING) {
  const port = process.env.PORT || 1337;
  const httpServer = https.createServer(options, app);
  httpServer.listen(port, function () {
    console.log('parse-server-example running on port ' + port + '.');
  });
  // This will enable the Live Query real-time server
  await ParseServer.createLiveQueryServer(httpServer);
}
console.log(app.routes)
