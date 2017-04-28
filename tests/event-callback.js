/**
 * Cisco Spark WebSocket example using the event handler callback
 */

var accessToken = process.env.SPARK_TOKEN;
if (!accessToken) {
  console.log("No Cisco Spark access token found in env variable SPARK_TOKEN");
  process.exit(2);
}

var SparkWebSocket = require('../index')
var logger = require('winston');

sparkwebsocket = new SparkWebSocket(accessToken);
sparkwebsocket.connect(function (err, res) {
  if (!err) {
    sparkwebsocket.setEventCallback(function (event) {
      logger.info("New Event");
      logger.info("---------");
      logger.info(JSON.stringify(event, null, 2));
    })

    // Forward to webhookURL
    if (process.env.WEBHOOK_URL) {
      sparkwebsocket.setWebHookURL(process.env.WEBHOOK_URL);
    }

  }
  else {
    logger.info("Error starting up websocket: " + err);
  }
});
