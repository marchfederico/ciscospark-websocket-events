var SparkWebSocket = require('./index')
var logger = require('winston');

var accessToken = process.env.BOT_TOKEN
var webHookUrl =  process.env.WEBHOOK_URL

sparkwebsocket = new SparkWebSocket(accessToken)
sparkwebsocket.connect(function(err,res){
      if (!err)
      {
        sparkwebsocket.setEventCallback(function(event){
          logger.info("New Event")
          logger.info("---------")
          logger.info(JSON.stringify(event,null,2))
        })
        
        if(webHookUrl)
        sparkwebsocket.setWebHookURL(webHookUrl)

      }
      else {
        logger.info("Error starting up websocket: "+err)
      }

})
