Cisco Spark Websocket Events
===========================================

Provides a simple way to get events through Cisco Spark's native websocket.

This module is useful when deploying a Cisco Spark bot behind a firewall with no way to get the traditional inbound webhooks back to the bot.


## Installation

`npm install ciscospark-websocket-events`


## Usage

This module can be used in two different ways.
The first is by setting an event callback to handle the events directly in your code.
The second is to define URL to the location you would like to post event data to.

The current events supported are:

* Message Created
* Membership Created
* Room Updated

Here is an example event:
```json
{
  "event": "created",
  "resource": "messages",
  "data": {
    "id": "Y2lzY29zcGFyazovL3VzL01FU1NBR0UvMzkyM2RiNDAtMTU4ZS0xMWU3LWI1OWItMjNiODI4NTFiY2Fh",
    "roomId": "Y2lzY29zcGFyazovL3VzL1JPT00vOTAwYjZiNTEtNDc2ZC0zMjkzLThlMTAtYmI1MTVjN2RjNDQy",
    "roomType": "direct",
    "text": "Hello",
    "personId": "Y2lzY29zcGFyazovL3VzL1BFT1BMRS83M2YwNThiZS01MTRjLTQ5OTAtYTkyZi00MWNlY2M4NWFiMzc",
    "personEmail": "marfeder@cisco.com",
    "html": "<p><strong>Hello</strong></p>",
    "created": "2017-03-30T21:17:04.628Z"
  }
}
```


## Example 1: using the event handler callback

Run the sample from a terminal:

```shell
> cd ciscospark-websocket-events
> npm install
> cd tests
> SPARK_TOKEN=XXXXXXXXXXXXXXXXX node event-callback.js
...
``` 

Check the code:

```javascript
   var SparkWebSocket = require('ciscospark-websocket-events');
   var accessToken = process.env.SPARK_TOKEN;

   sparkwebsocket = new SparkWebSocket(accessToken);
   sparkwebsocket.connect(function (err, res){
      if (!err) {
        sparkwebsocket.setEventCallback(function (event){
          console.log("New Event");
          console.log("---------");
          console.log(JSON.stringify(event, null, 2));
          
          // do something with the event
        });

      }
      else {
        console.log("Error starting up websocket: " + err);
      }
   }):
```


## Example 2: forwarding the event using the webhook_url

```javascript
   var SparkWebSocket = require('ciscospark-websocket-events');
   var accessToken = process.env.SPARK_TOKEN;
   var webHookUrl =  process.env.WEBHOOK_URL; // http://localhost:8080/mybot/incoming_event

   sparkwebsocket = new SparkWebSocket(accessToken);
   sparkwebsocket.connect(function(err, res){
      if (!err) {
         if (webHookUrl) {
            sparkwebsocket.setWebHookURL(webHookUrl);
         }
      }
      else {
         console.log("Error starting up websocket: " + err);
      }
   });
```


## BotKit Example

Run the sample from a terminal:

```shell
> cd examples
> cd botkit
> npm install
> SPARK_TOKEN=XXXXXXXXXXXXXXXXX node bot.js
...
```

Check the [BotKit code sample](examples/botkit/bot.js):

```javascript
/// Setup the Cisco Spark Websocket

var SparkWebSocket = require('ciscospark-websocket-events')

var accessToken = process.env.SPARK_TOKEN
var PORT = process.env.PORT || 3000

var webHookUrl =  "http://localhost:"+PORT+"/ciscospark/receive"

sparkwebsocket = new SparkWebSocket(accessToken)
sparkwebsocket.connect(function(err,res){
   if (!err) {
         if(webHookUrl)
             sparkwebsocket.setWebHookURL(webHookUrl)
   }
   else {
        console.log("Error starting up websocket: "+err)
   }
})

//////// Bot Kit //////

var Botkit = require('botkit');

var controller = Botkit.sparkbot({
    debug: true,
    log: true,
    public_address: "https://localhost",
    ciscospark_access_token: process.env.SPARK_TOKEN
});


var bot = controller.spawn({
});

controller.setupWebserver(PORT, function(err, webserver) {

 //setup incoming webhook handler
  webserver.post('/ciscospark/receive', function(req, res) {
            res.sendStatus(200)
            controller.handleWebhookPayload(req, res, bot);
  });

});

controller.hears('hello', 'direct_message,direct_mention', function(bot, message) {
    bot.reply(message, 'Hi');
});

controller.on('direct_mention', function(bot, message) {
    bot.reply(message, 'You mentioned me and said, "' + message.text + '"');
});

controller.on('direct_message', function(bot, message) {
    bot.reply(message, 'I got your private message. You said, "' + message.text + '"');
});
```


## Flint Example

Run the sample from a terminal:

```shell
> cd examples
> cd flint
> npm install
> SPARK_TOKEN=XXXXXXXXXXXXXXXXX node bot.js
...
```


Check the [flint code sample](examples/flint/bot.js):

```javascript
// Spark Websocket Intialization
var SparkWebSocket = require('ciscospark-websocket-events')

var accessToken = process.env.SPARK_TOKEN
var PORT = process.env.PORT || 8080

var webHookUrl =  "http://localhost:"+PORT+"/flint"

sparkwebsocket = new SparkWebSocket(accessToken)
sparkwebsocket.connect(function(err,res){
      if (!err)
      {
        sparkwebsocket.setWebHookURL(webHookUrl)
      }
      else {
        console.log("Error starting up websocket: "+err)
      }

   })

// Flint Bot Initialization

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

// say hello
flint.hears('/hello', function(bot, trigger) {
  flind.debug('Flind hears /hello');
  bot.say('I hear you, %s!', trigger.personDisplayName);
});

// add flint event listeners
flint.on('message', function(bot, trigger, id) {
  flint.debug('"%s" said "%s" in room "%s"', trigger.personEmail, trigger.text, trigger.roomTitle);
  if (trigger.text === '/hello') {
    bot.say('"%s" said keyword in room "%s".', trigger.personEmail, trigger.roomTitle);
  }
});

flint.on('initialized', function() {
  flint.debug('initialized %s rooms', flint.bots.length);
});

// define express path for incoming webhooks
app.post('/flint', webhook(flint));

// start express server
var server = app.listen(config.port, function () {
  flint.debug('Flint listening on port %s', config.port);
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', function() {
  flint.debug('stoppping...');
  server.close();
  flint.stop().then(function() {
    process.exit();
  });
});
```

## Proxy Support

Cisco Spark Websockets now support web proxies!

To enable web proxy support set the following enviroment variables:
* HTTP_PROXY=(to your web proxy URL)
* NO_PROXY=localhost


