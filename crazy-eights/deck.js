//
// deck.js 
// 
// A node.js module containing objects to represent decks of playing cards, 
// themselves represented by objects in the file card.js.
//
// Copyright 2012 Charlton Wilbur, warts, bugs, and all.  
//


'use strict';

var Card = require('./card.js');

function Deck() {
    this.deck = [];
}

Deck.prototype = {

    initialize: function () {
        var that = this;

        Card.constants.suits.forEach(function (se, si, sa) {
            Card.constants.ranks.forEach(function (re, ri, ra) {
                that.deck.push(Card.create(re, se));
            });
        });

        return this;
    },

    shuffle: function () {
        // fisher-yates shuffle: given array with elements 0..n, 
        // for each index i from n down to 1, pick a random index j 
        // and swap elements at i and j.

        var i, j, tmp;
        for (i = this.deck.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            tmp = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = tmp;
        }
        return this;
    },

    deal: function () { return this.deck.pop(); },

    count: function () { return this.deck.length; },

    toString: function () {
        return 'Deck of ' + this.count() + ' cards: ['
            + this.deck.map(function (e, i, a) {
                return e.displayString();
            }).join(', ') + ']';
    },

};

module.exports.create = function () { return new Deck(); };




