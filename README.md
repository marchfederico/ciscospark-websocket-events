# ciscospark-websocket-events

Cisco Spark Websocket Events
===========================================

[ciscospark-websocket-events](https://github.com/marchfederico/ciscospark-websocket-events) It provides a simple way to get events through Cisco Sparks native websockets.

## Installation

`npm install ciscospark-websocket-events`

## Usage

This module can be used in two different ways.  The first is by setting an event callback to handle the events directly in your code.  The second is to define URL to  
the location you would like to post event data to.

The current events supported are:

Message Created
Membership Created
Room Updated


Here is an example event:
```json
{
  "event": "created",
  "resource": "messages"
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

### Exmaple

```javascript
   var SparkWebSocket = require('ciscospark-websocket-events')
   var accessToken = process.env.BOT_TOKEN
   var webHookUrl =  process.env.WEBHOOK_URL

   sparkwebsocket = new SparkWebSocket(accessToken)
   sparkwebsocket.connect(function(err,res){
      if (!err)
      {
        sparkwebsocket.setEventCallback(function(event){
          console.log("New Event")
          console.log("---------")
          console.log(JSON.stringify(event,null,2))
        })
        
        if(webHookUrl)
            sparkwebsocket.setWebHookURL(webHookUrl)

      }
      else {
        console.log("Error starting up websocket: "+err)
      }

   })
```
---
