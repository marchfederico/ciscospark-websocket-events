// Constructor

var logger = require('winston')
var request = require('request')
var SparkClient = require('node-sparkclient')

function EventHandler(accessToken) {
    var self  = this
    this.webHookUrl = null
    this.eventCallback = null
    this.accessToken = accessToken
    this.sparkclient = new SparkClient(accessToken)
    this.sparkclient.getMe(function(err,me){
      if (!err)
        self.me = me
    })

}

EventHandler.prototype.formatActivity = function (activity,callback) {
  var self = this
  var event ={data:{}}
    if (activity.verb == 'post' || activity.verb == 'share')
    {
      this.sparkclient.getMessage(activity.id,function(err,message){
        if (!err) {
          event.event = "created"
          event.resource = "messages"
          event.data = message
          callback(null,event)
        }
        else {
          callback(err)
        }
      })

    }
    else if (activity.verb == 'create' )
    {
      var queryParams ={}
      queryParams.personId =self.me.id
      this.sparkclient.listMemberships(activity.object.id,queryParams,function(err,room){
        if(!err) {
          event.event = "added"
          event.resource = "memberships"
          event.data = room.items[0]
          callback(null,event)
        }
        else {
          callback(err)
        }
      })

    }
    else if (activity.verb == 'add' && activity.object.objectType == 'person')
    {
      var queryParams ={}
      queryParams.personEmail =activity.object.emailAddress
      this.sparkclient.listMemberships(activity.target.id,queryParams,function(err,room){
        if(!err) {
          event.event = "added"
          event.resource = "memberships"
          event.data = room.items[0]
          callback(null,event)
        }
        else {
          callback(err)
        }
      })

    }
    else if (activity.verb == 'lock' || activity.verb == 'unlock' || activity.verb == 'update')
    {

      this.sparkclient.getRoom(activity.object.id,function(err,room){
        if (!err) {
          event.resource = "rooms"
          event.event = "updated"
          event.data = room
          callback(null,event)
        }
        else {
          callback(err)
        }
      })

    }
    else {
     logger.debug("Uknown Event:")
     logger.debug(JSON.stringify(activity,null,2))
    }
}

EventHandler.prototype.setEventCallback = function (callback) {
    this.eventCallback = callback
}
EventHandler.prototype.setWebHookURL = function (url) {
    this.webHookUrl = url
}
EventHandler.prototype.postToWebHookUrl = function (activity, callback) {

    var self = this;


    var uri = self.webHookUrl

    request(
        {
            method: 'POST'
            , headers: {'content-type': 'application/json;charset=UTF-8'}
            , uri: uri
            , json: activity
        }
        , function (error, response, body) {
            if (error) {
                logger.error(error)
            }
            else if (response.statusCode == 200) {
                if (callback)
                    callback(JSON.parse(body))
            }
            else if (response.statusCode == 204) {
                if (callback) {
                    callback({message: "success"})

                }
            }
            else {
                logger.error(response.statusCode)
                logger.error(body)
                if (callback)
                  callback(body)
            }
        }
    )



}

EventHandler.prototype.handleMessage = function (message) {

    var self = this
    if (message.data && message.data.eventType) {
        var e = message.data.eventType
        var m = message.data;

        //logger.info(JSON.stringify(message, null, 2))
        if (e == 'conversation.activity') {

            act = message.data.activity
            self.formatActivity(act,function(err,event){
              if(!err)
              {
                if (self.webHookUrl != null)
                    self.postToWebHookUrl(event)
                if (self.eventCallback != null)
                   self.eventCallback(event)
              }
              else {
                logger.info("Error formating event: "+err)
              }
            })


        }

    }
    else {

        logger.info("Unknown event!")

    }

}
// export the class
module.exports = EventHandler;
