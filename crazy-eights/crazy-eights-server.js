//
// crazy-eights-server.js 
// 
// A node.js script implementing a web server and web services protocol over HTTP
// to manage games of crazy eights.
//
// invoke as node crazy-eights-server.js
// 
// change the variable gamePlayerCount to control how many players in a game
// (games with 2 players are most interesting; games with 4+ players are over quickly)
//
// Copyright 2012 Charlton Wilbur, warts, bugs, and all.  
//

var Util = require('util');
var HTTP = require('http');
var URL = require('url');
var QS = require('querystring');

var Card = require('./card.js');
var Deck = require('./deck.js');

var logLevel = 1;
function logIt(level, message, precision) {
    if ((precision && level === logLevel) || level <= logLevel) {
        Util.log(message);
    }
}

logIt(1, 'Crazy Eights Server Initializing');

// constants 

var playerQueue = [];
var players = {};
var gamePlayerCount = 2;

// game management

function Game() {
    var i, j, p;

    this.players = [];
    this.currentPlayer = 0;
    this.deck = Deck.create().initialize().shuffle();
    this.topCard = undefined;
    this.winner = undefined;

    if (playerQueue.length < gamePlayerCount) {
        throw { name: 'GameFail', message: 'Not enough players for a game' };
    }

    for (i = 0; i < gamePlayerCount; i++) {
        p = playerQueue.shift();
        logIt(1, 'Adding player ID ' + p.playerId + '(' + p.name + ')');
        this.players.push(p);
        p.setGame(this);
    }

    for (i = 0; i < 8; i++) {
        for (j = 0; j < gamePlayerCount; j++) {
            this.players[j].giveCard(this.deck.deal());
        }
    }

    this.topCard = this.deck.deal();
    this.currentSuit = this.topCard.suit();

    logIt(1, 'New game created with '
        + this.players.map(function (e, i, a) { return e.name; }).join(', '));
}

Game.prototype = {
    status: function (p) {
        var st = {
            players: this.players.map(function (e, i, a) {
                return { id: e.playerId, name: e.name, cards: e.handSize() };
            }),

            deckRemaining: this.deck.count(),
            topCard: this.topCard,
            currentSuit: this.currentSuit,
            currentPlayer: this.players[this.currentPlayer].name,
            winner: this.winner,
        };

        if (p !== undefined && p.game === this) {
            st.playerHand = p.hand;
        }

        logIt(1, 'Player ' + p.name + ' requests status', true);
        logIt(2, ['Status requested: ',
            'players = [' + st.players.map(function (e, i, a) {
                return e.name + '(' + e.cards + ')';
            }).join(', ') + ']',
            'current player = ' + st.currentPlayer,
            'cards remaining in deck = ' + st.deckRemaining,
            'top card of discard = ' + st.topCard.displayString(),
            'current suit = ' + st.currentSuit,
            'winner = ' + st.winner || 'nobody yet',
            ].join('\n     '), true);

        logIt(3, 'status requested; response is ' + JSON.stringify(st), true);

        return st;
    },

	resign: function (player) {
		logIt(1, 'Player ' + player.name + 'attempting to resign.');

        if (this.players.indexOf(player) === -1) {
            throw { name: 'NotInGame', message: 'Player not in this game' };
        }
      
      	logIt(1, 'Resignation accepted.  Everyone loses.'); 
        this.winner = 'nobody';
	},        

    play: function (player, card, eightSuit) {
        logIt(1, 'Player ' + player.name + ' attempting to play ' + card.displayString()
            + (card.rank() === '8' ? (' and declaring suit ' + eightSuit) : ''));

        if (this.players.indexOf(player) === -1) {
            throw { name: 'NotInGame', message: 'Player not in this game' };
        }
        if (this.players[this.currentPlayer] !== player) {
            throw { name: 'BrokenRule', message: 'Player playing out of turn' };
        }
        if (player.hand.filter(function (x) {
                return card.toString() === x.toString();
            }).length === 0) {
            throw { name: 'BrokenRule', message: 'Player playing a card not in hand' };
        }
        if (this.winner !== undefined) {
            throw { name: 'BrokenRule', message: 'Game over' };
        }
        // is it a card that can legitimately be played?
        // it matches suit or rank of the most recently played card(except for 8s)
        // OR the most recently played card is an 8 and it matches the declared suit
        // OR it is an 8

        if ((this.topCard.rank() !== '8'
                    && (this.topCard.rank() === card.rank()
                        || this.topCard.suit() === card.suit()))
                || (this.topCard.rank() === '8' && this.currentSuit === card.suit())
                || (card.rank() === '8')) {
            this.topCard = card;
            
            if (card.rank() === '8') {
                this.currentSuit = eightSuit;
            } 
            
            player.hand = player.hand.filter(function (x) { return card.toString() !== x.toString(); });
            this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
            logIt(1, 'Card accepted.');
        } else {
            logIt(1, 'Card not accepted');
            throw { name: 'BrokenRule', message: 'Card cannot be played at this time' };
        }

        // did this player just win?

        if (player.hand.length === 0) {
            logIt(1, 'Player ' + player.name + ' wins!');
            this.winner = player.name;
        }
    },

    draw: function (player) {
        if (this.players.indexOf(player) === -1) {
            throw { name: 'NotInGame', message: 'Player not in this game' };
        }
        if (this.players[this.currentPlayer] !== player) {
            throw { name: 'BrokenRule', message: 'Player playing out of turn' };
        }
        if (this.winner !== undefined) {
            throw { name: 'BrokenRule', message: 'Game over' };
        }

        logIt(1, 'Player ' + player.name + ' attempting to draw.');

        // any cards left?

        if (this.deck.count() === 0) {
            logIt(1, 'No cards left.  Everyone loses.');
            this.winner = 'nobody';
        } else {
            logIt(1, 'Draw successful.');
            player.giveCard(this.deck.deal());
        }
    },
};

// player management

var nextPlayerId = 1;

function Player(name) {
    this.playerId = nextPlayerId;
    nextPlayerId++;
    this.playerKey = Math.floor(Math.random() * 65536).toString(16);
    this.name = name;
    this.game = undefined;
    this.hand = [];

    players[this.playerId] = this;
    playerQueue.push(this);

    if (playerQueue.length >= gamePlayerCount) {
        var g = new Game();
    }
}

Player.prototype = {
    setGame: function (g) { this.game = g; return this; },
    giveCard: function (c) { this.hand.push(c); return this; },
    handSize: function () { return this.hand.length; }
};


// HTTP server

// verbs: register, resign, status, play, draw
// register: takes name, responds with id, key
// resign: responds with OK or NOT OK
// status: takes id, key; responds with game status info
// play: takes id, key, card, suit(only meaningful on 8); responds with OK or NOT OK
// draw: takes id, key; responds with OK or NOT OK

var gameMoves = {
    '/register': function (params, res) {
        var p = new Player(params.name),
            response = JSON.stringify({ id: p.playerId, key: p.playerKey });
        logIt(3,  'Response(' + res.crazyEightsSerial + '): 200 ' +  response);
        res.end(response);
    },

	'/resign': function (params, res) {
		var p = players[params.id],
			response;

        if (p.playerKey !== params.key) {
            throw { name: 'Impostor', message: 'Player key mismatch' };
        }
        
    	try {
            p.game.resign(p);
            response = JSON.stringify({ status: 'OK' });
        } catch (e) {
            e.status = 'NOT OK';
            response = JSON.stringify(e);
        }
    },

    '/status': function (params, res) {
        var p = players[params.id],
            response;

        if (p.playerKey !== params.key) {
            throw { name: 'Impostor', message: 'Player key mismatch' };
        }

        if (p.game === undefined) {
            response = JSON.stringify({ currentPlayer: 'nobody', info: 'Waiting for players' });
        } else {
            response = JSON.stringify(p.game.status(p));
        }

        logIt(3,  'Response(' + res.crazyEightsSerial + '): 200 ' +  response);
        res.end(response);
    },

    '/play': function (params, res) {
        var p = players[params.id],
            playedCard = Card.createFromSerial(params.card),
            response;

        if (p.playerKey !== params.key) {
            throw { name: 'Impostor', message: 'Player key mismatch' };
        }

        try {
            p.game.play(p, playedCard, params.declaredSuit);
            response = JSON.stringify({ status: 'OK' });
        } catch (e) {
            e.status = 'NOT OK';
            response = JSON.stringify(e);
        }

        logIt(2, 'Response to player ' + params.id + ': ' + response);
        logIt(3,  'Response(' + res.crazyEightsSerial + '): 200 ' +  response);
        res.end(response);
    },

    '/draw': function (params, res) {
        var p = players[params.id],
            response;

        if (p.playerKey !== params.key) {
            throw { name: 'Impostor', message: 'Player key mismatch' };
        }

        try {
            p.game.draw(p);
            response = JSON.stringify({ status: 'OK' });
        } catch (e) {
            e.status = 'NOT OK';
            response = JSON.stringify(e);
        }

        logIt(3,  'Response(' + res.crazyEightsSerial + '): 200 ' +  response);
        res.end(response);

    },
};


var requestSerial = 1;

HTTP.createServer(function (req, res) {
    req.crazyEightsSerial = requestSerial;
    res.crazyEightsSerial = requestSerial;
    requestSerial++;

    var reqInfo = URL.parse(req.url, true),
        reqBody = '';

    if (gameMoves[reqInfo.pathname] !== undefined) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        req.on('data', function (data) { reqBody += data; });
        req.on('end', function () {
            var postData = QS.parse(reqBody);
            logIt(2, 'Request for ' + reqInfo.pathname + ' from user id ' + postData.id);
            logIt(3,  'Request(' + req.crazyEightsSerial + '): ' + reqInfo.pathname + ': ' + JSON.stringify(postData));
            gameMoves[reqInfo.pathname](postData, res);
        });
    } else {
        res.writeHead(403);
        res.end('Forbidden method');
        logIt(3,  'Response(' + res.crazyEightsSerial + '): 403 Forbidden Method');
    }
}).listen(8080);

