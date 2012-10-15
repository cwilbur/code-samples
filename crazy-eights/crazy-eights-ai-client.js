//
// crazy-eights-ai-client.js 
// 
// A node.js script implementing a fairly stupid AI client to play games of 
// crazy eights.
//
// invoke as node.js crazy-eights-ai-client.js name_1 name_2 ... name_n
//
// Copyright 2012 Charlton Wilbur, warts, bugs, and all.  
//

var Util = require('util');
var HTTP = require('http');
var QS = require('querystring');

var Card = require('./card.js');
var Deck = require('./deck.js');

var logLevel = 1;
function logIt(level, message, precision) {
    if ((precision && level === logLevel) || level <= logLevel) {
        Util.log(message);
    }
}

// here is where we encapsulate the web request
// shamelessly stolen from the node.js docs ;)

var httpOptions = {
    host: 'virtual-ubuntu.local',
    port: 8080,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
},
    requestSerial = 1;

function post(path, args) {
    var postInfo = { path: path, args: args, serial: requestSerial },
        postResponse = {},
        postData = QS.stringify(args),
        req;

    requestSerial++;

    httpOptions.path = '/' + path;
    httpOptions.headers['Content-Length'] = postData.length;

    logIt(2, 'Request for ' + path + ' with args ' + JSON.stringify(args), true);
    logIt(3, 'Request(' + postInfo.serial + '): ' + path + ': ' + JSON.stringify(args), true);

    req = HTTP.request(httpOptions, function (res) {
        postResponse.status = res.statusCode;
        postResponse.headers = res.headers;
        postResponse.body = '';

        res.setEncoding('utf8');
        res.on('data', function (chunk) { postResponse.body += chunk; });
        res.on('end', function () {
            logIt(3, 'Response(' + postInfo.serial + '): 200 ' +  postResponse.body);
            postResponse.args = JSON.parse(postResponse.body);
            playOn(postInfo, postResponse);
        });
    });

    req.on('error', function (e) { logIt(3, 'Post error: ' + e.message); });

    req.write(postData);
    req.end();
}

var names = process.argv.splice(2);
var gameOver = 0;
var playerInfo = {};
var delayLength = function () { return Math.floor(Math.random() * 1000); };

// we kick this off by registering
// after that, woo hoo, a glorious cascade of events!

names.forEach(function (e, i, a) { post('register', { name: e }); });

function chooseCard(hand, topCard, currentSuit) {
    // this is like playing against one of those annoying players
    // who chitchats and kibitzes and snacks when it's other players' turns
    // and then suddenly realizes he's playing a game
    // and looks at his cards like he's never seen them before

    var legal = [],
        eights = [],
        chosenCard;

    hand.forEach(function (e, i, a) {
        var acceptableSuit = topCard.rank() === '8' ? currentSuit : topCard.suit(),
            acceptableRank = topCard.rank() === '8' ? undefined : topCard.rank();

        if (e.rank === '8') {
            eights.push(e);
        } else if (e.suit() === acceptableSuit || e.rank() === acceptableRank) {
            legal.push(e);
        }
    });

    logIt(2, ['Choosing a card: ',
        'hand = [' + Card.prettifyArray(hand) + ']',
        'top card = ' + topCard.displayString(),
        'declared suit(after 8) = ' + currentSuit,
        'legal cards in hand = [' + Card.prettifyArray(legal) + ']',
        'eight cards in hand = [' + Card.prettifyArray(eights) + ']'
        ].join('\n     '), true);

    if (legal.length > 0) {
        chosenCard = legal.shift();
    } else if (eights.length > 0) {
        chosenCard = eights.shift();
    } else {
        chosenCard = undefined;
    }

    logIt(2, 'Chosen card = ' + (chosenCard === undefined ? 'none' : chosenCard.displayString()));

    return chosenCard;
}

function chooseSuit(hand) {
    var suitCount = { C: 0, D: 0, H: 0, S: 0 },
        suitMax = -1,
        chosenSuit = 'C';

    hand.forEach(function (e, i, a) {
        if (e.rank() !== '8') {
            suitCount[e.suit()]++;
        }
    });

    ['C', 'D', 'H', 'S'].forEach(function (e, i, a) {
        if (suitCount[e] > suitMax) {
            suitMax = suitCount[e];
            chosenSuit = e;
        }
    });

    return chosenSuit;
}

function playOn(postInfo, postResponse) {
    var status = postResponse.args,
        playerId,
        playerKey;

    if (postInfo.path === 'register') {
        playerInfo[status.id] = {
            id: status.id,
            key: status.key,
            name: postInfo.args.name
        };
        playerId = status.id;
        playerKey = status.key;
        post('status', { id: playerId, key: playerKey });
    } else {
        playerId = postInfo.args.id;
        playerKey = postInfo.args.key;
    }

    if (postInfo.path === 'draw') {
        // we drew; it's still our turn, so we request status immediately
        post('status', { id: playerId, key: playerKey });
    }

    if (postInfo.path === 'play') {
        if (status.status === 'NOT OK') {
            // we played; but something was wrong, so we request status immediately
            post('status', { id: playerId, key: playerKey });
        } else {
            // we played, so we pause to think before requesting status
            setTimeout(function () {
                post('status', { id: playerId, key: playerKey });
            }, delayLength());
        }
    }

    if (postInfo.path === 'status') {
        if (status.winner === playerInfo[playerId].name) {
            logIt(1, "I win!");
        } else if (status.winner !== undefined) {
            logIt(1, status.winner + ' has won the game.  I suck.');
        } else if (status.currentPlayer === playerInfo[playerId].name) {
            // it's our turn!

            var revivifiedHand = status.playerHand.map(function (e, i, a) {
                return Card.revivifyJSON(e);
            }),
                revivifiedTopCard = Card.revivifyJSON(status.topCard),
                handAsString = Card.prettifyArray(revivifiedHand),
                chosenCard = chooseCard(revivifiedHand, revivifiedTopCard, status.currentSuit),
                chosenSuit = chooseSuit(revivifiedHand);

            if (chosenCard === undefined) {
                logIt(1, 'With hand [' + handAsString + '] and top card '
                    +  revivifiedTopCard.displayString()
                    + (revivifiedTopCard.rank() === '8' ? ' and current suit ' + status.currentSuit : '')
                    + ', I draw.');
                post('draw', { id: playerId, key: playerKey });
            } else {
                logIt(1, 'With hand [' + handAsString + '] and top card '
                    +  revivifiedTopCard.displayString()
                    + (revivifiedTopCard.rank() === '8' ? ' and current suit ' + status.currentSuit : '')
                    + ', I play ' + chosenCard.displayString()
                    + (chosenCard.rank() === '8' ? ' and declare the suit of ' + chosenSuit : ''));
                post('play', { id: playerId, key: playerKey, card: chosenCard.cardSerial(), declaredSuit: chosenSuit });
            }
        } else {
            // it's someone else's turn, so we pause to think
            setTimeout(function () {
                post('status', { id: playerId, key: playerKey });
            }, delayLength());
        }
    }
}


