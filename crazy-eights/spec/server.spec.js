/**********************************************************************
 *
 * server.spec.js
 *
 * Jasmine unit test suite for the Crazy Eights server.
 *
 * Copyright 2013 Charlton Wilbur, warts, bugs, and all.
 *
 **********************************************************************/

var util = require('util');

var testMe = require('../crazy-eights-server.js');
var Card = require('../card.js').Card;
var Suit = require('../card.js').Suit;

var testPlayerNames = [
    'adam', 'bob', 'chet', 'dan', 'ed', 'frank', 'gabe', 'hank',
    'ian', 'joe', 'ken', 'lou', 'mike', 'ned', 'owen', 'phil',
    'quentin', 'rich', 'sam', 'todd', 'uri', 'victor', 'will',
    'xavier', 'yves', 'zach'
];

function dump(arg) {
    console.log(util.inspect(arg, { showHidden: true }));
}

function countEightsInHand(hand) {
    return hand.cards.filter(function (c) {
        return c.rank.asValue() == 8;
    }).length;
}

function countEightsInPlay(game) {
    return game.players.reduce(function (x, e) {
        return x + countEightsInHand(e.hand);
    }, 0);
}

function cardPlayable(topCard, proposedCard) {
    return topCard.suit === proposedCard.suit
        || topCard.rank === proposedCard.rank
        || proposedCard.rank.asValue() === 8;
}

describe('utility function generateKey', function () {
    it('should generate a string of hex digits', function () {
        var i, key;
        for (i = 4; i <= 30; i++) {
            key = testMe.generateKey(i);
            expect(key.length).toBe(i);
            expect(/^[0-9A-Fa-f]+$/.test(key)).toBeTruthy();
        }
    });

    var testLength = 16;
    var testAttempts = 10000;

    it('should not repeat a string of ' + testLength + ' characters in ' +
        testAttempts + ' attempts', function () {
        var i;
        var key;
        var allKeys = {};

        for (i = 0; i < 10000; i++) {
            key = testMe.generateKey(16);
            expect(allKeys[key]).not.toBeDefined();
            allKeys[key] = true;
        }
        expect(Object.keys(allKeys).length).toEqual(testAttempts);
    });
});

describe('Player class objects', function () {

    it('should create players successfully without duplicating IDs',
        function () {
            var allPlayersById = {};
            var allPlayersByKey = {};

            testPlayerNames.forEach(function (playerName) {
                var desiredSize = Math.floor(Math.random() * 8);
                var p = new testMe.Player(playerName, 'test', desiredSize);
                expect(p.name).toEqual(playerName);
                expect(p.class).toEqual('test');
                expect(p.desiredGameSize).toEqual(desiredSize);
                expect(p.hand.count()).toEqual(0);

                allPlayersById[p.playerId] = p;
                allPlayersByKey[p.playerKey] = p;
            });

            expect(Object.keys(allPlayersById).length)
                .toEqual(testPlayerNames.length);
            expect(Object.keys(allPlayersByKey).length)
                .toEqual(testPlayerNames.length);
        });

    it('should assign players who have a preference to that size game',
        function () {
            var gameCounts = { 2: 4, 3: 9, 4: 8, 5: 5 };
            var playersByName = {};

            testPlayerNames.forEach(function (pName) {
                var open = Object.keys(gameCounts)
                    .filter(function (count) {
                        return gameCounts[count] !== 0
                    });
                var thisCount = open[Math.floor(Math.random() * open.length)];
                gameCounts[thisCount]--;
                var size = parseInt(thisCount.toString());

                playersByName[pName] = new testMe.Player(pName, 'test', size);
            });

            Object.keys(playersByName).forEach(function (pName) {
                playersByName[pName].assignToGame();
            });

            Object.keys(playersByName).forEach(function (pName) {
                var p = playersByName[pName];
                var g = testMe.Game.byPlayerId[p.playerId];
                expect(p.desiredGameSize).toEqual(g.desiredPlayers);
                expect(g.isFull()).toBeTruthy();
            });
        });

    it('should assign players without pref to the largest existing game '
        + 'or to a new game with size 2',
        function () {
            var gameCounts = { 0: 11, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
            var playersByName = {};

            testPlayerNames.forEach(function (pName) {
                var open = Object.keys(gameCounts)
                    .filter(function (count) {
                        return gameCounts[count] !== 0
                    });
                var thisCount = open[Math.floor(Math.random() * open.length)];
                gameCounts[thisCount]--;
                var size = parseInt(thisCount.toString());

                playersByName[pName] = new testMe.Player(pName, 'test', size);
            });

            var withPref = [];
            var withoutPref = [];

            Object.keys(playersByName).forEach(function (pName) {
                if (playersByName[pName].desiredGameSize === 0) {
                    withoutPref.push(playersByName[pName]);
                }
                else {
                    withPref.push(playersByName[pName]);
                }
            });

            withPref.forEach(function (p) { p.assignToGame(); });

            var i;
            for (i = 6; i > 2; i--) {
                var p = withoutPref.shift();
                p.assignToGame();

                var g = testMe.Game.byPlayerId[p.playerId];
                expect(g.desiredPlayers).toEqual(i);
                expect(g.isFull()).toBeTruthy();
            }

            withoutPref.forEach(function (p) {p.assignToGame(); });

            withoutPref.forEach(function (p) {
                var g = testMe.Game.byPlayerId[p.playerId];
                expect(g.desiredPlayers).toEqual(2);
                expect(g.isFull()).toBeTruthy();
            });
        });

});

describe('Game class objects', function () {
    it('should keep track of how many players it wants', function () {
        var pNames = testPlayerNames.concat(testPlayerNames);
        [2, 3, 4, 5].forEach(function (playerCount) {
            var p = new testMe.Player(pNames.shift(), 'test', playerCount);
            p.assignToGame();
            var g = testMe.Game.byPlayerId[p.playerId];

            while (!g.isFull()) {
                var q = new testMe.Player(pNames.shift(), 'test', 0);
                q.assignToGame();
            }

            expect(g.players.length).toEqual(playerCount);
            expect(g.players.length).toEqual(g.desiredPlayers);
            expect(g.drawPile.count()).toEqual(52 - playerCount * 8 - 1);
            expect(g.discardPile.count()).toEqual(1);
            expect(g.history.length).toEqual(0);
            expect(g.calledSuit).toBeDefined();
            expect(g.gameOver).toBeFalsy();
            expect(g.winner).not.toBeDefined();
        });
    });

    it('should correctly record draws and plays', function () {
        var plays = [
            { draws: 3, card: new Card('5', 'H') },
            { draws: 0, card: new Card('2', 'S') },
            { draws: 0, card: new Card('6', 'D') },
            { draws: 1, card: new Card('8', 'C'), suit: new Suit('S') }
        ];

        var g = new testMe.Game(3);

        plays.forEach(function (thisPlay) {
            var i;
            for (i = 0; i < thisPlay.draws; i++) {
                g.recordDraw();
            }
            g.recordPlay(thisPlay.card, thisPlay.suit);
            g.currentPlayer++;
            g.currentPlayer %= 3;
        });

        var playerIdx = 0;

        plays.forEach(function (thisPlay, i) {
            var thisRecord = g.history[i];

            expect(thisRecord.playerIndex).toEqual(playerIdx);
            expect(thisPlay.draws).toEqual(thisRecord.draws);
            expect(thisPlay.card).toEqual(thisRecord.card);
            if (thisPlay.card.rank.asValue() === 8) {
                expect(thisPlay.suit).toEqual(thisRecord.calledSuit);
            }
            playerIdx++;
            playerIdx %= 3;
        });
    });

    it('should correctly add players and start game', function () {
        [2, 3, 4, 5].forEach(function (playerCount) {
            var g = new testMe.Game(playerCount);
            var pNames = testPlayerNames.slice(0, playerCount);

            while (pNames.length > 1) {
                var p = new testMe.Player(pNames.shift(), 'test', 0);
                g.addPlayer(p);

                expect(testMe.Game.byPlayerId[p.playerId]).toBe(g);
                expect(g.players.length).toBe(playerCount - pNames.length);
                expect(g.isFull()).toBeFalsy();
            }

            p = new testMe.Player(pNames.shift(), 'test', 0);
            g.addPlayer(p);

            expect(testMe.Game.byPlayerId[p.playerId]).toBe(g);
            expect(g.players.length).toBe(playerCount);
            expect(g.isFull()).toBeTruthy();

            // and it kicked off the game automatically

            expect(g.players.length).toEqual(playerCount);
            expect(g.players.length).toEqual(g.desiredPlayers);
            expect(g.drawPile.count()).toEqual(52 - playerCount * 8 - 1);
            expect(g.discardPile.count()).toEqual(1);
            expect(g.history.length).toEqual(0);
            expect(g.calledSuit).toBeDefined();
            expect(g.gameOver).toBeFalsy();
            expect(g.winner).not.toBeDefined();
        });
    });

    it('should correctly report status', function () {
        // we'll test playing an 8 and recording history later

        var adam = new testMe.Player('adam', 'test', 2);
        var bill = new testMe.Player('bill', 'test', 2);
        var game = new testMe.Game(2);

        game.addPlayer(adam);
        expect(game.status(adam)).toEqual({ waiting: true });

        game.addPlayer(bill);
        var status = game.status(bill);
        expect(status.players.length).toEqual(2);
        expect(status.deckRemaining).toEqual(52 - 2 * 8 - 1);
        expect(status.facedCard).toBeDefined();
        expect(status.currentPlayerId).toBeDefined();
        expect(status.currentPlayerIndex).toEqual(0);
        expect(status.hand).toEqual(bill.hand.cards.map(function (c) {
            return c.asValue();
        }));
        expect(status.lastPlays.length).toEqual(0);
        expect(status.gameOver).toEqual(false);
    });

    it('should correctly report status as a game goes on', function () {

        var players = {};
        var game;

        // create a game until the first player has at least one 8

        do {
            game = new testMe.Game(2);
            ['adam', 'bill'].forEach(function (name) {
                var p = new testMe.Player(name, 'test', 2);
                players[name] = p;
                players[p.playerId] = p;
                game.addPlayer(p);
            });
        } while (countEightsInHand(game.players[0].hand) < 1);

        var playerNames = game.players.map(function (p) { return p.name; });
        var currentTurn = 0;
        var thisPlayerName, thisPlayer, cardToPlay, status, suitToCall;

        // first player: draw at least one, then draw until you can
        // follow suit, then follow suit -- but keep your 8

        thisPlayerName = playerNames[currentTurn % 2];
        thisPlayer = players[thisPlayerName];
        thisPlayerDraws = 0;

        game.draw(thisPlayer);
        thisPlayerDraws++;
        expect(thisPlayer.hand.count()).toEqual(8 + thisPlayerDraws);
        while (thisPlayer.hand.cards.filter(function (c) {
            return game.calledSuit.asValue() === c.suit.asValue()
                && c.rank.asValue() !== 8;
        }).length === 0) {
            game.draw(thisPlayer);
            if (game.drawPile.count() === 0) {
                throw new Error('test invalid ' +
                    '- shuffle made test suite invalid');
            }
            thisPlayerDraws++;
            expect(thisPlayer.hand.count()).toEqual(8 + thisPlayerDraws);
        }

        cardToPlay = thisPlayer.hand.cards.filter(function (c) {
            return game.calledSuit.asValue() === c.suit.asValue()
                && c.rank.asValue() !== 8;
        })[0];
        game.play(thisPlayer, cardToPlay);
        currentTurn++;

        expect(thisPlayer.hand.count()).toEqual(8 + thisPlayerDraws - 1);

        console.log('%s draws %d, plays %s', thisPlayerName, thisPlayerDraws,
            cardToPlay.asShortString());

        // second player: draw until you can match rank, then match rank

        thisPlayerName = playerNames[currentTurn % 2];
        thisPlayer = players[thisPlayerName];

        // but first: we check the status

        status = game.status(thisPlayer);
        expect(status.lastPlays[0].draw).toEqual(thisPlayerDraws);
        expect(status.lastPlays[0].play).toEqual(cardToPlay.asValue());
        expect(status.lastPlays[0].calledSuit).not.toBeDefined();

        thisPlayerDraws = 0;

        while (thisPlayer.hand.cards.filter(function (c) {
            return game.discardPile.topCard().rank.asValue()
                === c.rank.asValue();
        }).length === 0) {
            game.draw(thisPlayer);
            if (game.drawPile.count() === 0) {
                throw new Error('test invalid ' +
                    '- shuffle made test suite invalid');
            }
            thisPlayerDraws++;
            expect(thisPlayer.hand.count()).toEqual(8 + thisPlayerDraws);
        }

        cardToPlay = thisPlayer.hand.cards.filter(function (c) {
            return game.discardPile.topCard().rank.asValue()
                === c.rank.asValue();
        })[0];
        game.play(thisPlayer, cardToPlay);
        currentTurn++;

        console.log('%s draws %d, plays %s', thisPlayerName, thisPlayerDraws,
            cardToPlay.asShortString());

        // third player: play the 8 you have

        thisPlayerName = playerNames[currentTurn % 2];
        thisPlayer = players[thisPlayerName];

        // but first: we check the status

        status = game.status(thisPlayer);
        expect(status.lastPlays[1].draw).toEqual(thisPlayerDraws);
        expect(status.lastPlays[1].play).toEqual(cardToPlay.asValue());
        expect(status.lastPlays[1].calledSuit).not.toBeDefined();


        thisPlayerDraws = 0;

        cardToPlay = thisPlayer.hand.cards.filter(function (c) {
            return c.rank.asValue() === 8;
        })[0];

        // we call a suit that does NOT match the 8
        if (cardToPlay.suit.asValue() === 0) {
            suitToCall = new Suit(1);
        }
        else {
            suitToCall = new Suit(0);
        }

        console.log('%s draws %d, plays %s', thisPlayerName, thisPlayerDraws,
            cardToPlay.asShortString());

        game.play(thisPlayer, cardToPlay, suitToCall);
        currentTurn++;

        // check status and history

        thisPlayerName = playerNames[currentTurn % 3];
        thisPlayer = players[thisPlayerName];

        // but first: we check the status

        status = game.status(thisPlayer);
        expect(status.lastPlays[1].draw).toEqual(0);
        expect(status.lastPlays[1].play).toEqual(cardToPlay.asValue());
        expect(status.lastPlays[1].suit).toEqual(suitToCall.asValue());
    });
});

// player playing when game is over
// player drawing when game is over
// player playing out of turn
// player playing card that doesn't follow
// player playing card not in hand


