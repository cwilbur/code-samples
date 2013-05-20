//
// analytics.js 
// 
// Abstraction layer for crazy-eights analytics.
//
// Copyright 2013 Charlton Wilbur, warts, bugs, and all.  
//

'use strict';

var Util = require('util');
var Mongo = require('mongodb');
var Events = require('events');

var Card = require('./card.js');

var connectString = Util.format('mongodb://%s:%s/crazy-eights?w=1', 
    'localhost', Mongo.Connection.DEFAULT_PORT);

function Analytics() {
    var self = this;

    this.ready = false;
    
    this.queues = {
        gameInserts: [],
        gameUpdates: [],
        playInserts: []
    };

    this.serials = {};

    this.on('dbConnected', function() { self.processQueues(); });
    this.on('dataQueued', function() { self.processQueues(); });
    this.on('dbShouldClose', function() { self.processQueues(); });

    return this;
}

Analytics.prototype.__proto__ = Events.EventEmitter.prototype;

Analytics.prototype.connect = function () {
    var self = this;
    
    Mongo.Db.connect(connectString, function (err, db){
        self.db = db;
        self.games = db.collection('games');
        self.plays = db.collection('plays');
        self.ready = true;
        self.emit('dbConnected');
    });
};

Analytics.prototype.disconnect = function() {
    this.dbCanClose = true;
    this.emit('dbShouldClose');
};

Analytics.prototype.generateUUID = function() {
    // stolen from stackoverflow, by broofa:
    // http://stackoverflow.com/a/2117523
    // there's an npm for RFC-compliant GUID/UUIDs
    // but in this case it seems like overkill
    
    return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};

// here is what I'm using for a schema for now.

// the 'games' collection includes a list of games as seen
// from the perspective of the player.  games have uuid and
// a record of whether the player won.

// the 'plays' collection includes a list of information the
// player might reasonably use to make a decision: how many
// cards are left in the deck, the contents of his hand, and
// what the faced card is.  also the game uuid.

Analytics.prototype.processQueues = function () {
    var self = this;
    if (!this.ready) {
        this.connect();
    } else if (this.queues.gameInserts.length > 0) {
        var record = this.queues.gameInserts.shift();
        this.games.insert(record, { safe: true }, function (err) {
            if (err) {
                self.gameInserts.unshift(record);
                self.connect();
            } else {
                self.emit('dataQueued');
            }   
        });
    } else if (this.queues.playInserts.length > 0) {
        var record = this.queues.playInserts.shift();
        this.plays.insert(record, { safe: true }, function (err) {
            if (err) {
                self.playInserts.unshift(record);
                self.connect();
            } else {
                self.emit('dataQueued');
            }   
        });
    } else if (this.queues.gameUpdates.length > 0) {
        var record = this.queues.gameUpdates.shift();
        this.games.update(record.search, record.update, { safe: true }, function (err) {
            if (err) {
                self.gameUpdates.unshift(record);
                self.connect();
            } else {
                self.emit('dataQueued');
            }
        });
    } else {
        // we're connected, but there's nothing queued

        if (this.dbCanClose) {
            this.db.close();
        }
    }
};

Analytics.prototype.newGame = function (gameUuid) {
    this.serials[gameUuid] = 0; 
    this.queues.gameInserts.push ( { gameUuid: gameUuid, outcome: 'in-progress' } );
    this.emit('dataQueued');
};

Analytics.prototype.recordWinner = function (gameUuid, gameOutcome) {
    delete this.serials[gameUuid];
    this.queues.gameUpdates.push ( { search: { gameUuid: gameUuid },
        update: { $set: { outcome: gameOutcome } } } );
    this.emit('dataQueued');
};

Analytics.prototype.recordOpponentsPlay = 
        function (gameUuid, handSize, deckRemaining, cardChosen, suitChosen) {
    this.serials[gameUuid] = this.serials[gameUuid] + 1;
    this.queues.playInserts.push( {
        gameUuid: gameUuid,
        serial: this.serials[gameUuid],
        player: 'opponent',
        handSize: handSize + 0,
        deckRemaining: deckRemaining + 0,
        cardChosen: cardChosen.toDB(),
        suitChosen: suitChosen
    });
    this.emit('dataQueued');
};

Analytics.prototype.recordMyPlay = 
        function (gameUuid, hand, facedCard, handSize, deckRemaining, cardChosen, suitChosen) {
    this.serials[gameUuid] = this.serials[gameUuid] + 1;
    this.queues.playInserts.push( {
        gameUuid: gameUuid,
        serial: this.serials[gameUuid],
        player: 'self',
        hand: Card.normalizeArrayForDB(hand),
        facedCard: facedCard.toDB(),
        handSize: handSize + 0,
        deckRemaining: deckRemaining + 0,
        cardChosen: cardChosen.toDB(),
        suitChosen: suitChosen
    });
    this.emit('dataQueued');
};

module.exports = Analytics;





