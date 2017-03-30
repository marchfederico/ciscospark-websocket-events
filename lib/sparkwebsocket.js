/**
 * Created by marfeder on 3/30/17.
 */
var logger = require('winston');
const low = require('lowdb')
var crypto = require('crypto');

const device_db = low('device.json')
var EventHandler = require('./EventHandler');
var ConnectionService = require('./ConnectionService');
var request = require('request');

devices_table = device_db.has('devices').value()

if(!devices_table)
{
      device_db.defaults({ devices: [] })
        .write()

}


function sparkwebsocket(token) {
    this.id = crypto.createHash('md5').update(token).digest("hex");
    this.accessToken = token
    this.connectionService = "";
    this.eventHandler = "";
    this.name = 'sparkwebsocket';

}
sparkwebsocket.prototype.setEventCallback = function (callback) {
    this.eventHandler.setEventCallback(callback)
}

sparkwebsocket.prototype.setWebHookURL = function (url) {
  this.eventHandler.setWebHookURL(url)
}
sparkwebsocket.prototype.connect = function (callback) {
    var self = this;
    var deviceDesc = '{"deviceName":"nodewebscoket-client","deviceType":"DESKTOP","localizedModel":"nodeJS","model":"nodeJS","name":"node-spark-client","systemName":"node-spark-client","systemVersion":"0.1"}';
    var headers = {
        Authorization: 'Bearer ' + this.accessToken,
        'Content-Type': 'application/json; charset=UTF-8'
    };

    var devices =  device_db.get('devices').find({ id: self.id})

    if (devices.value())
    {
      //delete the device...so we don't run into the 100 device limit.
      var device = devices.value()
      device_db.get('devices')
        .remove({ id: self.id })
        .write()

      request(
          {
              method: 'DELETE'
              , headers: headers
              , uri: device.device.url
              , 'auth': {'bearer': self.accessToken}
          }
          , function (error, response, body) {
              if (response.statusCode == 200) {
                logger.info("Deleted old device")
              } else {
                logger.info("Error deleting old device")
                logger.info(body)
              }
          }
       )
    }

    // create a new device.
    request(
        {
            method: 'POST'
            , headers: headers
            , uri: 'https://wdm-a.wbx2.com/wdm/api/v1/devices'
            , body: deviceDesc
            , 'auth': {'bearer': self.accessToken}
        }
        , function (error, response, body) {
            if (response.statusCode == 200) {

                var device = JSON.parse(body);
                device_db.get('devices')
                  .push({ id: self.id, device: device})
                  .write()

                var webSocketUrl = device.webSocketUrl;
                var deviceUrl = device.url;

                self.eventHandler = new EventHandler(self.accessToken);
                self.connectionService = new ConnectionService(webSocketUrl, self.accessToken, self.eventHandler);
                callback(null,"success")
            } else {
                callback("Could Not Create Device")
            }
        }
    )
}


module.exports = sparkwebsocket;
