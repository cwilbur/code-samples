//
// cards-test.js 
// 
// A node.js script containing a rudimentary manual test suite for the card.js
// and deck.js modules (representing playing cards and decks of playing cards, 
// respectively).
//
// Copyright 2012 Charlton Wilbur, warts, bugs, and all.  
//

var Util = require('util');
var Card = require('./card.js');
var Deck = require('./deck.js');

Util.log('Starting test for cards');

// the card needs to remember what it is and display itself correctly

var c1 = Card.create('A', 'S'); // ace of spades
var c2 = Card.create('J', 'D'); // jack of diamonds
var c3 = Card.create('2', '♣'); // two of clubs

Util.log('Ace of spades: ' + c1.displayString()
      + '(' + c1.longString() + ')');
Util.log('Jack of diamonds: ' + c2.displayString()
      + '(' + c2.longString() + ')');
Util.log('Two of clubs: ' + c3.displayString()
      + '(' + c3.longString() + ')');

c1.setRank('Q');
Util.log('Change to queen of spades: ' + c1.displayString()
      + '(' + c1.longString() + ')');
c2.setSuit('H');
Util.log('Change to jack of hearts: ' + c2.displayString()
      + '(' + c2.longString() + ')');

// now we do things that shouldn't be allowed

try {
    c3.setRank('10');
} catch (e) {
    Util.log('Error when setting bad rank: ' + e.name + ': ' + e.message);
}

try {
    c3.setSuit('Wands');
} catch (e) {
    Util.log('Error when setting bad suit: ' + e.name + ': ' + e.message);
}

// comparisons
// at the start of this, c2 contains the jack of hearts

c3.setRank('J').setSuit('H');
Util.log('Comparing ' + c2.toString() + ' to ' + c3.toString());
Util.log('toString results: ' + (c2.toString() === c3.toString()).toString());
Util.log('toValue results: ' + (c2.toValue() === c3.toValue()).toString());

Util.log('Comparing ' + c1.toString() + ' to ' + c2.toString());
Util.log('toString results: ' + (c1.toString() === c2.toString()).toString());
Util.log('toValue results: ' + (c1.toValue() === c2.toValue()).toString());

// And now we test decks

var d = Deck.create();
Util.log('Deck created: ' + d.toString());
d.initialize();
Util.log('Deck initialized: ' + d.toString());
d.shuffle();
Util.log('Deck shuffled: ' + d.toString());

// now we make sure that the shuffle doesn't drop any cards on the
// floor accidentally - we do this by making a list of the cards in an
// unshuffled deck, then shuffling the deck and seeing that the cards
// are all there.

Util.log('Testing shuffling.');
Util.log('Silence(no missing/duplicate card messages) = success.');

var cards = {};
var cs;

d.initialize();
while (d.count() > 0) { cards[d.deal().toString()] = 1; }
d.initialize().shuffle();
while (d.count() > 0) {
    var cs = d.deal().toString();
    if (cards[cs] !== 1) {
        Util.log('Duplicate card from shuffled deck: ' + cs);
    }
    delete cards[cs];
}

cards.forEach(function (e, i, a) {
    Util.log('Missing card from shuffled deck: ' + e);
});
