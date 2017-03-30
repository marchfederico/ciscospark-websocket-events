var WebSocket = require('ws');
var uuid = require('node-uuid');
var logger = require('winston');

function ConnectionService(url, token, eventHandler) {
    this.eh = eventHandler;
    this.ws = new WebSocket(url);
    this.url = url;
    this.ws.binaryType = 'arraybuffer';
    this.token = token;
    this.reconnectAttempts = 0
    this.pingInterval = 10000
    this.pingTimeout = this.pingInterval + 20000
    this.lastPingId = ''
    this.setupHandlers()
    this.reconnecting = false;
}


ConnectionService.prototype.setToken = function (token) {
    this.token = token
}

ConnectionService.prototype.setupHandlers = function () {

    var self = this

    self.ws.on('open', function (connection) {

        logger.info('WebSocket client open');

        self.ws.send(JSON.stringify(
            {
                id: uuid.v4(),
                type: 'authorization',
                data: {
                    token: 'Bearer ' + self.token
                }
            }))

        self.pingIntervalTimer = setTimeout(function () {
            self.sendPing(self);
        }, self.pingInterval);
        self.pingTimeoutTimer = setTimeout(function () {
            clearTimeout(self.pingIntervalTimer)
            logger.info("ping timeout trying to reconnect....")
            self.reconnect()
        }, self.pingTimeout);
    })

    self.ws.on('message', function (data, flags) {

        self.reconnectAttempts = 0;
        var message;
        message = new Uint8Array(data);
        message = String.fromCharCode.apply(null, message);
        try {
            message = JSON.parse(message);
        }
        catch (e) {
            logger.info("Failed to parse message.")
        }
        if (message.type == 'pong') //send another ping
        {
            if (self.lastPingId != message.id)
            {
                logger.info("Warning PONG ID doesn't match Ping id...")
            }

            clearTimeout(self.pingIntervalTimer)
            clearTimeout(self.pingTimeoutTimer)

            self.pingIntervalTimer=setTimeout(function () {
                self.sendPing(self);
            }, self.pingInterval);

            self.pingTimeoutTimer = setTimeout(function () {
                logger.info("ping timeout trying to reconnect....")
                clearTimeout(self.pingIntervalTimer)
                self.reconnect()
            }, self.pingTimeout);
        }
        else {
            // send message to the event handler
            self.eh.handleMessage(message)

        }
    });

    self.ws.on('close', function close(err) {
        logger.info("web socket closed:", err)
    });

    self.ws.on('error', function wserror(err) {

        clearTimeout(self.pingIntervalTimer)
        clearTimeout(self.pingTimeoutTimer)
        logger.error('web sockect error: ', err);
        setTimeout(function () {
            self.reconnect();
        }, 5000);
    });
};

ConnectionService.prototype.reconnect = function () {
    logger.info("web scoket reconnecting...")
    var self = this
    clearTimeout(self.pingIntervalTimer)
    clearTimeout(self.pingTimeoutTimer)
    self.ws.reconnecting = true
    self.ws.close();
    self.ws = new WebSocket(self.url);
    self.ws.reconnecting = false
    self.ws.binaryType = 'arraybuffer';
    self.setupHandlers()
}

ConnectionService.prototype.sendPing = function (self)
{

    if (self.ws.readyState == WebSocket.CLOSING || self.ws.readyState == WebSocket.CLOSED)
    {
        if (!self.ws.reconnecting)
        {
            clearTimeout(self.pingIntervalTimer)
            clearTimeout(self.pingTimeoutTimer)
            self.reconnect()
        }
    }
    else {
        self.lastPingId = uuid.v4()
        self.ws.send(JSON.stringify({
            type: 'ping',
            id: self.lastPingId
        }));
    }

}

// export the class
module.exports = ConnectionService;
