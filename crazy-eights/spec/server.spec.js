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

function dump(arg) {
    console.log(util.inspect(arg, { showHidden: true }));
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

describe('Player class objects', function (){

    var testPlayerNames = [
        'adam', 'bob', 'chet', 'dan', 'ed', 'frank', 'gabe', 'hank',
        'ian', 'joe', 'ken', 'lou', 'mike', 'ned', 'owen', 'phil',
        'quentin', 'rich', 'sam', 'todd', 'uri', 'victor', 'will',
        'xavier', 'yves', 'zach'
    ];

    it('should create players successfully without duplicating IDs', function(){
        var allPlayersById = {};
        var allPlayersByKey = {};

        testPlayerNames.forEach(function(playerName){
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
        function(){
            var gameCounts = { 2: 4, 3: 9, 4: 8, 5: 5 };
            var playersByName = {};

            testPlayerNames.forEach(function (pName){
                var open = Object.keys(gameCounts)
                    .filter(function (count) { return gameCounts[count] !== 0 });
                var thisCount = open[Math.floor(Math.random() * open.length)];
                gameCounts[thisCount]--;
                var preferredSize = parseInt(thisCount.toString());

                var p = new testMe.Player(pName, 'test', preferredSize);
                playersByName[pName] = p;
            });

            Object.keys(playersByName).forEach(function (pName){
                playersByName[pName].assignToGame();
            });

            Object.keys(playersByName).forEach(function(pName){
                var p = playersByName[pName];
                var g = testMe.Game.byPlayerId[p.playerId];
                expect(p.desiredGameSize).toEqual(g.desiredPlayers);
                expect(g.isFull()).toBeTruthy();
            });
        });

    it('should assign players with no preference to the largest game if one exists,' +
        ' or to a game of size 2 if nobody else is waiting',
        function(){
            var gameCounts = { 0: 11, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
            var playersByName = {};

            testPlayerNames.forEach(function (pName){
                var open = Object.keys(gameCounts)
                    .filter(function (count) { return gameCounts[count] !== 0 });
                var thisCount = open[Math.floor(Math.random() * open.length)];
                gameCounts[thisCount]--;
                var preferredSize = parseInt(thisCount.toString());

                var p = new testMe.Player(pName, 'test', preferredSize);
                playersByName[pName] = p;
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