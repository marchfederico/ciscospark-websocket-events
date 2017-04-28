/**
 * Cisco Spark WebSocket example using BotKit
 */

var accessToken = process.env.SPARK_TOKEN;
if (!accessToken) {
  console.log("No Cisco Spark access token found in env variable SPARK_TOKEN");
  process.exit(2);
}

var PORT = process.env.PORT || 8080;


// Spark Websocket Intialization
var SparkWebSocket = require('ciscospark-websocket-events');
sparkwebsocket = new SparkWebSocket(accessToken);
sparkwebsocket.connect(function (err, res) {
  if (!err) {
    sparkwebsocket.setWebHookURL("http://localhost:" + PORT + "/flint");
  }
  else {
    console.log("Error starting up websocket: " + err);
  }
});


// Flint Bot Initialization ///////////////////////////////
var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());

// flint options
var config = {
  token: accessToken,
  port: PORT,
  removeWebhooksOnStart: true,
  maxConcurrent: 5,
  minTime: 50
};

// init flint
var flint = new Flint(config);
flint.start();

flint.on('initialized', function () {
  flint.debug('initialized %s rooms', flint.bots.length);
});

// define express path for incoming webhooks
app.post('/flint', webhook(flint));

// start express server
var server = app.listen(config.port, function () {
  flint.debug('Flint listening on port %s', config.port);
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', function () {
  flint.debug('stoppping...');
  server.close();
  flint.stop().then(function () {
    process.exit();
  });
});


//
// Bot custom logic
//

// say hello
flint.hears('hello', function (bot, trigger) {
  flint.debug('Flint hears hello');
  bot.say('I hear you, %s!', trigger.personDisplayName);
});


// add flint event listeners
flint.on('message', function (bot, trigger, id) {
  flint.debug('"%s" said "%s" in room "%s"', trigger.personEmail, trigger.text, trigger.roomTitle);
  if (trigger.text === 'hello') {
    bot.say('"%s" said keyword in room "%s".', trigger.personEmail, trigger.roomTitle);
  }
});
