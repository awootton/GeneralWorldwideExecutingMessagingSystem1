/**
 * An interface to the GeneralWorldwideExecutingMessageSystem on github. Mostly it's generic websockets. Copyright 2015
 * Alan Wootton see included license.
 */

var GWEMS = {
	REVISION : '1'
};

GWEMS.WebSocketClient = function(host, port, uri) {

	this.host = host;
	this.port = port;
	this.uri = uri;
	this.isOpen = 0;

	this.socket = {};
};

GWEMS.WebSocketClient.prototype.setOpen = function( val ){
	this.isOpen = val;
}

GWEMS.WebSocketClient.prototype.start = function() {
	// ReconnectingWebSocket
	this.socket = new WebSocket("ws://" + this.host + ":" + this.port + this.uri);
	
	var gewms = this;

	this.socket.onopen = function(event) {
		gewms.setOpen(1);
		gewms.handleOpen(event);
	};
	this.socket.onclose = function(event) {
		gewms.setOpen(0);
		gewms.handleClose(event);
	};
	this.socket.onerror = function(event) {
		gewms.handleError(event);
	};
	this.socket.onmessage = function(event) {
		var msg = event.data;
		gewms.handleMessage(msg);
	};
	
	// set up keep alive.
	window.setInterval(function() {
		gewms.send('{"@C":"Live"}');
	},  12 * 60 * 1000);// every 12 minutes. 
};

GWEMS.WebSocketClient.prototype.send = function(string) {
	try {
		if (string && string.length > 0) {
			this.socket.send(string);
		}
	} catch (e) {
		// say something
	}
	;
};

GWEMS.WebSocketClient.prototype.handleOpen = function(event) {
	console.log("Have Open " + event);
};

GWEMS.WebSocketClient.prototype.handleClose = function(event) {
	console.log("Have Close " + event);
};

GWEMS.WebSocketClient.prototype.handleError = function(event) {
	this.socket.close();
	console.log("Have error " + event);
};

GWEMS.WebSocketClient.prototype.handleMessage = function(string) {
	console.log("Have message " + string);
};

/**
 * Subtract the before Set from the after Set and return a new Set. Expects an object where keys and value are the same.
 * eg. { key:key } Because this I show I do a Set.
 * 
 */
GWEMS.addedToSet = function(before, after) {
	var res = JSON.parse(JSON.stringify(after));
	for (key in before) {
		res[key] = null;
	}
	var res2 = {};
	for (key in res) {
		if (res[key]) {
			res2[key] = key;
		}
	}
	return res2;
}

GWEMS.removedFromSet = function(before, after) {
	return GWEMS.addedToSet(after, before);
}

GWEMS.subscribeJsonObject = {
	"@C" : "gwems.Subscribe",
	"channel" : ""
};

GWEMS.getSubscribeString = function(channel) {
	GWEMS.subscribeJsonObject.channel = channel;
	var s = JSON.stringify(GWEMS.subscribeJsonObject);
	return s;
};

GWEMS.unsubscribeJsonObject = {
	"@C" : "gwems.Unsubscribe",
	"channel" : ""
};

GWEMS.getUnsubscribeString = function(channel) {
	GWEMS.unsubscribeJsonObject.channel = channel;
	var s = JSON.stringify(GWEMS.unsubscribeJsonObject);
	return s;
}

GWEMS.publishObject = {
	"@C" : "gwems.Publish",
	"channel" : "",
	"msg" : {
		"@C" : "gwems.Push2Client",
		"msg" : ""
	}
};

// fixme: use bulk subscribe
GWEMS.subscribe = function(aMap, gwemsSocket) {
	for (key in aMap) {
		var msg = GWEMS.getSubscribeString(key);
		gwemsSocket.send(msg);
	}
};

// fixme: use bulk unsub
GWEMS.unsubscribe = function(aMap, gwemsSocket) {
	for (key in aMap) {
		var msg = GWEMS.getUnsubscribeString(key);
		gwemsSocket.send(msg);
	}
};

GWEMS.getPublishString = function(channel, message) {
	GWEMS.publishObject.channel = channel;
	GWEMS.publishObject.msg.msg = message;
	var s = JSON.stringify(GWEMS.publishObject);
	return s;
};

GWEMS.subscribeChanges = function(before, after, gwemsSocket) {

	var added = GWEMS.addedToSet(before, after);
	var removed = GWEMS.removedFromSet(before, after);
	if (Object.keys(added).length) {
		GWEMS.subscribe(added,gwemsSocket);
	}
	if (Object.keys(removed).length) {
		GWEMS.unsubscribe(removed,gwemsSocket);
	}
	return after;
};
