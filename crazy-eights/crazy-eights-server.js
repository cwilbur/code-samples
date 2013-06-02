/**********************************************************************
 *
 * crazy-eights-server.js
 *
 * A node.js script implementing a web server and web services
 * protocol over HTTP to manage games of crazy eights.
 *
 * Invoke as node crazy-eights-server.js
 *
 * Copyright 2013 Charlton Wilbur, warts, bugs, and all.
 *
 **********************************************************************/

var http = require('http');
var url = require('url');
var qs = require('querystring');

var util = require('util');

var Deck = require('./card.js').Deck;
var Hand = require('./card.js').Hand;

// player management

function generateKey(length) {
    var i;
    var key = '';

    for (i = 0; i < length; i++) {
        key += Math.floor(Math.random()*16).toString(16);
    }

    return key;
}

function Player(name, playerClass, desiredGameSize) {
    this.name = name;
    this.class = playerClass;
    this.desiredGameSize = desiredGameSize;
    this.playerId = Player.playerId;
    Player.playerId++;
    this.playerKey = generateKey(16);
    this.hand = new Hand();
    return this;
}

Player.playerId = 1;
Player.allPlayers = {};

Player.prototype.assignToGame = function () {
    // if player insists on a particular size of game, assign him
    // to that size game.

    if (this.desiredGameSize !== 0) {
        if (Game.waitingGames[this.desiredGameSize] === undefined) {
            Game.waitingGames[this.desiredGameSize] = new Game(this.desiredGameSize);
        }
        Game.waitingGames[this.desiredGameSize].addPlayer(this);
    }

    // if there are no waiting games, put him in a 2-player

    else if (Object.keys(Game.waitingGames).length === 0) {
        Game.waitingGames[2] = new Game(2);
        Game.waitingGames[2].addPlayer(this);
    }

    // otherwise, assign him to the largest game still waiting for players

    else {

        var largestGame = { desiredPlayers: -1 };
        Object.keys(Game.waitingGames).forEach(function (size){
            var thisGame = Game.waitingGames[size];
            if (largestGame.desiredPlayers < thisGame.desiredPlayers) {
                largestGame = thisGame;
            }
        });

        largestGame.addPlayer(this);
    }
};

// game management

function Game(desiredPlayers) {

    this.desiredPlayers = desiredPlayers;
    this.players = [];
    this.currentPlayer = 0;
    this.drawPile = new Deck().newDeck().shuffle();
    this.discardPile = new Deck();
    this.calledSuit = undefined;
    this.history = [];
    this.gameOver = false;
    this.winner = undefined;
    return this;
}

Game.waitingGames = {};
Game.byPlayerId = {};

Game.prototype.isFull = function () {
    return this.players.length === this.desiredPlayers;
};

Game.prototype.getCurrentHistoryRecord = function () {
    var record;

    if (this.history.length === 0) {
        record = { playerIndex: this.currentPlayer, draw: 0 };
    }
    else {
        record = this.history.pop();
        if (record.playerIndex !== this.currentPlayer) {
            this.history.push(record);
            record = { playerIndex: this.currentPlayer, draw: 0 };
        }
    }

    return record;
};

Game.prototype.recordDraw = function () {
    var record = this.getCurrentHistoryRecord();
    record.draw++;
    this.history.push(record);
};

Game.prototype.recordPlay = function (card, calledSuit) {
    var record = this.getCurrentHistoryRecord();
    record.card = card.asValue();
    if (card.suit.asValue() === 8) {
        record.calledSuit = calledSuit.asValue();
    }
    this.history.push(record);
};

Game.prototype.addPlayer = function (player) {
    if (Math.floor(Math.random() * 100) % 2) {
        this.players.push(player);
    }
    else {
        this.players.unshift(player);
    }

    Game.byPlayerId[player.playerId] = this;

    if (this.isFull()) {

        delete Game.waitingGames[this.desiredPlayers];
        this.start();

    }
    return this;
};

Game.prototype.start = function () {
    var i;
    var self = this;

    for (i = 0; i < 8; i++) {
        this.players.forEach(function (player){
            var card = self.drawPile.pullTopCard();
            player.hand.addTopCard(card);
        });
    }

    var c = this.drawPile.pullTopCard();
    this.discardPile.addTopCard(c);
    return this;
};

Game.prototype.status = function (player) {
    var status = {};

    if (this.isFull()) {

        status.players = this.players.map(function (p) {
            return { name: p.name, class: p.class, cardCount: p.hand.count() };
        });
        status.deckRemaining = this.drawPile.count();
        status.facedCard = this.discardPile.topCard().asValue();
        if (status.facedCard === 8) {
            status.calledSuit = this.calledSuit.asValue();
        }
        status.currentPlayerId = this.players[this.currentPlayer].playerId;
        status.currentPlayerIndex = this.currentPlayer;
        status.hand = player.hand.map(function (c) {
            return c.asValue();
        });
        status.lastPlays = this.history.slice(-this.players.length)
            .map(function (history) {
                return {
                    playerIndex: history.playerIndex,
                    draw: history.drawCount,
                    play: history.playedCard.asValue(),
                    suit: history.calledSuit.asValue()
                };
            });
        status.gameOver = this.gameOver;
        if (this.gameOver && this.winner) {
            status.winner = this.winner;
        }
    }

    else {
        status.waiting = true;
    }

    return status;
};

Game.prototype.draw = function (player) {
    var drawnCard;

    if (this.gameOver) {
        throw new Error('game over, man, game over!');
    }
    if (player.playerId !== this.players[this.currentPlayer].playerId) {
        throw new Error('playing out of turn');
    }

    if (this.drawPile.count() === 0) {
        this.gameOver = true;
    } else {
        drawnCard = this.drawPile.pullTopCard();
        player.hand.addTopCard(drawnCard);
        player.hand.sort();
        this.recordDraw();
    }

    return drawnCard.asValue();
};

Game.prototype.isValidPlay = function (card) {
    var topCard = this.discardPile.topCard();
    var currentSuit = topCard.rank.asValue() === 8
        ? this.calledSuit.asValue
        : topCard.suit.asValue();

    return card.suit.asValue() === currentSuit
        || card.rank.asValue() === topCard.rank.asValue()
        || card.rank === 8;
};

Game.prototype.play = function (player, card, suit) {
    if (this.gameOver) {
        throw new Error('game over, man, game over!');
    }
    if (player.playerId !== this.players[this.currentPlayer].playerId) {
        throw new Error('playing out of turn');
    }
    if (!this.isValidPlay(card)) {
        throw new Error('not following suit or rank or playing 8');
    }

    var handCount = player.hand.count();
    player.hand.removeCard(card);
    if (player.hand.count() === handCount) {
        throw new Error('playing card not in hand');
    }

    this.discardPile.addTopCard(card);
    if (card.suit.asValue() === 8) {
        this.calledSuit = suit;
    }
    this.recordPlay (card, calledSuit);
    this.playerIndex = (this.playerIndex + 1) % this.players.length;

    if (player.hand.count() === 0) {
        this.gameOver = 1;
        this.winner = this.currentPlayer;
    }

    return this;
};

// now we put the server together


var serverVerbs = {
    register: {
        requiredParameters: [ 'playerName', 'playerClass' ],
        defaults: { desiredGameSize: 0 },
        action: function (input) {
            var newPlayer = new Player(input.playerName, input.playerClass,
                input.desiredGameSize);
            Player.allPlayers[newPlayer.playerId] = newPlayer;
            newPlayer.assignToGame();
            return {};
        }
    },

    status: {
        requiredParameters: [ 'playerId', 'playerKey' ],
        action: function (input) {
            var player = Player.allPlayers[input.playerId];
            var game = Game.byPlayerId[input.playerId];
            return game.status(player);
        }
    },

    play: {
        requiredParameters: [ 'playerId', 'playerKey', 'cardValue' ],
        defaults: { suitValue: 0 },
        action: function (input) {
            var player = Player.allPlayers[input.playerId];
            var game = Game.byPlayerId[input.playerId];
            game.play(player, new Card(input.cardValue), new Suit(input.suitValue));
            return {};
        }
    },
    draw: {
        requiredParameters: [ 'playerId', 'playerKey' ],
        action: function (input) {
            var player = Player.allPlayers[input.playerId];
            var game = Game.byPlayerId[input.playerId];
            return { drawnCard: game.draw(player) };
        }
    }
};

function consolidateInputs (verbName, requiredParams, defaultParams, postData) {
    var input = {};

    requiredParams.append(Object.keys(defaultParams)).forEach(function (key) {
        input[key] = postData[key] || defaultParams[key];

        if (input[key] === undefined) {
            throw new Error('required parameter ' + key + ' not passed in call to ' + verbName);
        }
    });

    return input;
}

// this isn't really a module, but here we export the things we intend to unit-test

module.exports = {
    generateKey: generateKey,
    Player: Player,
    Game: Game,
    consolidateInputs: consolidateInputs
};


// here endeth the easily unit-testable code

var requestSerial = 1;

if (require.main === module) {

    // only start the server if we're loaded directly

    http.createServer(function (request, response){
        request.crazyEightsSerial = requestSerial;
        response.crazyEightsSerial = requestSerial;
        requestSerial++;

        var requestInfo = url.parse(request.url, true);
        var requestBody = '';
        var verbName = requestInfo.pathname.slice(1);

        if (serverVerbas[verbName] !== undefined) {
            request.on('data', function (data) { requestBody += data; });
            request.on('end', function () {
                var postData = qs.parse(requestBody);
                var responseBody;

                try {
                    var input = consolidateInputs(verbName,
                        serverVerbs[verbName].requiredParameters,
                        serverVerbs[verbName].defaults, postData);

                    var actionResponse = verb.action(input);
                    responseBody = { status: 'OK' };
                    if (Object.keys(actionResponse).length > 0) {
                        responseBody.info = actionResponse;
                    }

                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify(responseBody));

                }
                catch (err) {
                    response.writeHead(400);
                    responseBody = {
                        status: 'NOT OK',
                        errorName: err.name,
                        errorMessage: err.message };
                    response.end(JSON.stringify(responseBody));

                }
            });
        }
        else {
            response.writeHead(403);
            response.end('Forbidden method');
        }

    }).listen(8888);

}

