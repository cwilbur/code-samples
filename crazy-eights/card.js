//
// card.js 
// 
// A node.js module containing objects to represent playing cards.
//
// Copyright 2012 Charlton Wilbur, warts, bugs, and all.  
//

'use strict';

// utility functions

function ucfirst (str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
}

// first: building blocks

function Suit (newSuit) {
    this.value =  Suit.index[newSuit.toString()];
    if (this.value === undefined) {
        throw new Error ('Suit constructor called with invalid value: [' + newSuit + ']');
    }
};

Suit.definition = [
    { letter: 'C', symbol: '♣', name: 'Clubs', alternates: ['Club'] },
    { letter: 'D', symbol: '♦', name: 'Diamonds', alternates: ['Diamond'] },
    { letter: 'H', symbol: '♥', name: 'Hearts', alternates: ['Heart'] },
    { letter: 'S', symbol: '♠', name: 'Spades', alternates: ['Spade'] }
];

Suit.index = {};
Suit.definition.forEach(function (e, i) {
    ['letter', 'symbol', 'name'].forEach (function (key) {
        Suit.index[e[key]] = i;
        Suit.index[e[key].toLowerCase()] = i;
        Suit.prototype['as' + ucfirst(key)] = function () {
            return Suit.definition[this.value][key];
        };
    });
    e.alternates.forEach(function (alt) {
        Suit.index[alt] = i;
        Suit.index[alt.toLowerCase()] = 1;
    });
    Suit.index[i.toString()] = i;
});

module.exports = {
    ucfirst: ucfirst,
    Suit: Suit
}

/*

Card.ranks = ['A', '2', '3', '4', '5', '6', '7',
    '8', '9', 'T', 'J', 'Q', 'K'];

Card.rankNames = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];

Card.suitsIndex = {};

Card.ranksIndex = {};

Card.suits.concat(Card.suitChars, Card.suitNames).forEach(function (e, i, a) {
    suitsIndex[e.toLowerCase()] = i;
});

Card.ranks.concat(Card.rankNames).forEach(function (e, i, a) {
    ranksIndex[e.toLowerCase()] = i;
});

// Card objects

// this representation is a little bit obscure, but it lets us
// translate between the letter suits(CDHS) and the unicode suit
// symbols trivially

function Card(newRank, newSuit) {
    this.suitval = suitsIndex[newSuit.toLowerCase()] || 0;
    this.rankval = ranksIndex[newRank.toLowerCase()] || 0;
}

Card.createFromSerial = function (serial) {
    return new Card(ranks[serial % 15], suits[Math.floor(serial / 15)]);
};

Card.revivifyJSON = function (e) {
    return (typeof e === 'object' && e.cardSerial !== undefined) ?
            Card.createFromSerial(e.cardSerial) : e;
};

Card.compare = function (a, b) {
    return a.cardSerial() - b.cardSerial();
};

Card.prettifyArray = function (a) {
    return a.sort(Card.compare).map(function (e, i, a) { return e.displayString(); }).join(' ');
};

Card.normalizeArrayForDB = function (a) {
    return a.sort(Card.compare).map(function(e) { return e.toDB(); });
};

Card.prototype = {

    constants: {
        suits: suits,
        suitChars: suitChars,
        suitNames: suitNames,
        ranks: ranks,
        rankNames: rankNames,
        suitsIndex: suitsIndex,
        ranksIndex: ranksIndex,
    },

    suit: function () { return suits[this.suitval]; },

    suitChar: function () { return suitChars[this.suitval]; },

    setSuit: function (s) {
        if (suitsIndex[s.toLowerCase()] === undefined) {
            throw { name: 'BadData', message: 'Unrecognized suit' };
        }
        this.suitval = suitsIndex[s.toLowerCase()];
        return this;
    },

    rank: function () { return ranks[this.rankval]; },

    setRank: function (r) {
        if (ranksIndex[r.toLowerCase()] === undefined) {
            throw { name: 'BadData', message: 'Unrecognized rank' };
        }
        this.rankval = ranksIndex[r.toLowerCase()];
        return this;
    },

    cardSerial: function () { return this.toValue(); },

    toValue: function () { return this.suitval * 15 + this.rankval; },

    toString: function () { return this.rank() + this.suit(); },

    toJSON: function () {
        this.display = this.displayString();
        this.cardSerial = this.toValue();
        return this;
    },

    toDB: function () {
        var o = {};
        o.suit = this.suit();
        o.rank = this.rank();
        o.serial = this.cardSerial();
        return o;
    },

    displayString: function () { return this.rank() + this.suitChar(); },

    longString: function () {
        // this breaks encapsulation 
        return rankNames[this.rankval] + ' of ' + suitNames[this.suitval];
    },
};

module.exports = {
    create: function (rank, suit) { return new Card(rank, suit); },

    createFromSerial: Card.createFromSerial,

    revivifyJSON: Card.revivifyJSON,

    prettifyArray: Card.prettifyArray,
    
    toDB: Card.toDB,
    
    normalizeArrayForDB: Card.normalizeArrayForDB
};

*/