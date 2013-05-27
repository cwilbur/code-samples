/**********************************************************************
 *
 * card.js
 *
 * A node.js module containing objects to represent playing
 * cards and decks.
 *
 * Copyright 2013 Charlton Wilbur, warts, bugs, and all.
 *
 **********************************************************************/

'use strict';
var util = require('util');

// utility functions

function ucfirst (str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
}

function qw(str) {
    if (typeof str === 'number') {
        return [str.toString()];
    } else if (typeof str === 'string') {
        return str.split(/\s+/);
    } else {
        return [];
    }
}


// Suits

function Suit(newSuit) {
    this.value =  Suit.index[newSuit.toString()];
    if (this.value === undefined) {
        throw new Error('Invalid arg to Suit constructor: [' + newSuit + ']');
    }
}

Suit.definition = [
    { letter: 'C', symbol: '♣', name: 'Clubs', alternates: ['Club'] },
    { letter: 'D', symbol: '♦', name: 'Diamonds', alternates: ['Diamond'] },
    { letter: 'H', symbol: '♥', name: 'Hearts', alternates: ['Heart'] },
    { letter: 'S', symbol: '♠', name: 'Spades', alternates: ['Spade'] }
];

Suit.index = {};

[ 'letter', 'symbol', 'name', 'alternates', 'index' ].forEach(function (key) {
    Suit.definition.forEach(function (suit, index) {
        if (key === 'alternates') {
            suit.alternates.forEach(function (alt){
                Suit.index[alt] = index;
                Suit.index[alt.toLowerCase()] = index;
            });
        } else if (key === 'index') {
            Suit.index[index.toString()] = index;
        } else {
            Suit.index[suit[key]] = index;
            Suit.index[suit[key].toLowerCase()] = index;
        }
    });
});

Suit.definition.forEach(function (suit, index) {
    [ 'letter', 'symbol', 'name' ].forEach (function (key){
        Suit.index[suit[key]] = index;
        Suit.index[suit[key].toLowerCase()] = index;
    });
    suit.alternates.forEach(function (alt) {
        Suit.index[alt] = index;
        Suit.index[alt.toLowerCase()] = index;
    });
    Suit.index[index.toString()] = index;
});

Suit.prototype.asLetter = function (){
    return Suit.definition[this.value].letter;
};

Suit.prototype.asSymbol = function (){
    return Suit.definition[this.value].symbol;
};

Suit.prototype.asName = function (){
    return Suit.definition[this.value].name;
};

Suit.prototype.asValue = function (){
    return this.value;
};

// Ranks

function Rank(newRank) {
    this.value =  Rank.index[newRank.toString()];
    if (this.value === undefined || this.value === 0) {
        throw new Error('Invalid arg to Suit constructor: [' + newRank + ']');
    }
}

Rank.definition = [
    { value: 0 },
    { letter: 'A', value: 1,  name: 'Ace' },
    { letter: '2', value: 2,  name: 'Two', alternates: ['Deuce'] },
    { letter: '3', value: 3,  name: 'Three', alternates: ['Trey'] },
    { letter: '4', value: 4,  name: 'Four' },
    { letter: '5', value: 5,  name: 'Five' },
    { letter: '6', value: 6,  name: 'Six' },
    { letter: '7', value: 7,  name: 'Seven' },
    { letter: '8', value: 8,  name: 'Eight' },
    { letter: '9', value: 9,  name: 'Nine' },
    { letter: 'T', value: 10, name: 'Ten' },
    { letter: 'J', value: 11, name: 'Jack' },
    { letter: 'Q', value: 12, name: 'Queen' },
    { letter: 'K', value: 13, name: 'King' }
];

Rank.index = {};
Rank.definition.forEach(function (rank, index){
    ['letter', 'value', 'name'].forEach(function (key){
        Rank.index[rank[key]] = index;
        if (typeof rank[key] === 'string') {
            Rank.index[rank[key].toLowerCase()] = index;
        } else if (typeof rank[key] === 'number') {
            Rank.index[rank[key].toString] = index;
        }

        if (rank.alternates !== undefined) {
            rank.alternates.forEach(function (alt){
                Rank.index[alt] = index;
                Rank.index[alt.toLowerCase()] = index;
            });
        }
    });
});

Rank.prototype.asLetter = function (){
    return Rank.definition[this.value].letter;
};

Rank.prototype.asName = function (){
    return Rank.definition[this.value].name;
};

Rank.prototype.asValue = function (){
    return this.value;
};

// Cards

function Card(){
    if (arguments.length === 0) {
        throw new Error('Card constructor called with no arguments');
    } else if (arguments.length === 1) {
        try {
            if (typeof arguments[0] === 'number') {
                this.suit = new Suit(Math.floor(arguments[0] / 100));
                this.rank = new Rank(Math.floor(arguments[0] % 100));
            }
            else if (typeof arguments[0] == 'object') {
                this.suit = new Suit(arguments[0].suit.asValue());
                this.rank = new Rank(arguments[0].rank.asValue());
            }
        } catch (err) {
            throw new Error('Bad argument to Card constructor: ['
                + util.inspect(arguments[0]) + ']');
        }
    } else if (arguments.length === 2) {
        try {
            this.rank = new Rank(arguments[0]);
        } catch (err) {
            throw new Error('Bad rank argument to Card constructor: ['
                + util.inspect(arguments[0]) + ']');
        }
        try {
            this.suit = new Suit(arguments[1]);
        } catch (err) {
            throw new Error('Bad suit argument to Card constructor: ['
                + util.inspect(arguments[1]) + ']');
        }
    } else {
        throw new Error('Card constructor called with too many arguments');
    }

    this.value = 100 * this.suit.asValue() + this.rank.asValue();
}

Card.prototype.asValue = function () {
    return this.value;
};

Card.prototype.compare = function (otherCard){
    var x = this.value - otherCard.asValue();
    return x ? x / Math.abs(x) : x;
};

Card.prototype.asShortASCIIString = function (){
    return this.rank.asLetter() + this.suit.asLetter();
};

Card.prototype.asShortString = function (){
    return this.rank.asLetter() + this.suit.asSymbol();
};

Card.prototype.asLongString = function (){
    return this.rank.asName() + ' of ' + this.suit.asName();
};

// Decks & Hands

function Deck() {
    this.cards = [];
    return this;
}

Deck.prototype.newDeck = function (){
    var self = this;
    qw('C D H S').forEach(function (suitChar){
        qw('A 2 3 4 5 6 7 8 9 T J Q K').forEach(function (rankChar){
            self.cards.push(new Card(rankChar, suitChar));
        });
    });

    return this;
};

Deck.prototype.shuffle = function (){
    // fisher-yates shuffle: given array with elements 0..n,
    // for each index i from n down to 1, pick a random index j
    // and swap elements at i and j.

    var i, j, tmp;
    for (i = this.cards.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        tmp = this.cards[i];
        this.cards[i] = this.cards[j];
        this.cards[j] = tmp;
    }
    return this;
};

Deck.prototype.pullTopCard = function (){
    return this.cards.shift();
};

Deck.prototype.topCard = function (){
    return this.cards[0];
};

Deck.prototype.bottomCard = function (){
    return this.cards[this.cards.length - 1];
};

Deck.prototype.sort = function (){
    this.cards.sort(function (a, b){ return a.compare(b)});
};

Deck.prototype.addCard = function (card){
    this.cards.push(card);
    return this;
};

Deck.prototype.count = function (){
    return this.cards.length;
};

// Exports

module.exports = {
    qw: qw,
    ucfirst: ucfirst,
    Suit: Suit,
    Rank: Rank,
    Card: Card,
    Deck: Deck,
    Hand: Deck
};

