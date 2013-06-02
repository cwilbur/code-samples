/**********************************************************************
 *
 * card.spec.js
 *
 * Jasmine unit test suite for the Suit, Rank, Card, and Deck classes
 *
 * Copyright 2013 Charlton Wilbur, warts, bugs, and all.
 *
 **********************************************************************/


var util = require('util');

var cardLib = require('../card.js');
var ucfirst = cardLib.ucfirst;
var qw = cardLib.qw;
var Suit = cardLib.Suit;
var Rank = cardLib.Rank;
var Card = cardLib.Card;
var Deck = cardLib.Deck;

function dump(arg) {
    console.log(util.inspect(arg, { showHidden: true }));
}

describe('utility function ucfirst', function () {

    it('should capitalize the first character of its argument', function () {
        expect(ucfirst('tiger')).toBe('Tiger');
        expect(ucfirst('elephant')).toBe('Elephant');
    });

    it('should not alter an already capitalized argument', function () {
        expect(ucfirst('Tiger')).toBe('Tiger');
        expect(ucfirst('Elephant')).toBe('Elephant');
    });

    it('should not alter an uncapitalizable argument', function () {
        expect(ucfirst('99 Luftballoons')).toBe('99 Luftballoons');
        expect(ucfirst('1, 2, 3, death')).toBe('1, 2, 3, death');
        expect(ucfirst('♠ > ♣')).toBe('♠ > ♣');
    });

});

describe('utility function qw', function () {

    it('should split a string on whitespace', function () {
        expect(qw('one two three')).toEqual([ 'one', 'two', 'three' ]);
        expect(qw('four\tfive\tsix')).toEqual([ 'four', 'five', 'six' ]);
        expect(qw('seven   eight  nine')).toEqual([ 'seven', 'eight', 'nine' ]);
    });

    it('should turn a number into an array of one string', function () {
        expect(qw(-7)).toEqual([ '-7' ]);
        expect(qw(2)).toEqual([ '2' ]);
        expect(qw(3.14)).toEqual([ '3.14' ]);
        expect(qw(-0.25)).toEqual([ '-0.25' ]);
    });

    it('should return the empty array for any other input', function () {
        expect(qw([ 4, 5, 6 ])).toEqual([]);
        expect(qw({ a: 1, b: 2 })).toEqual([]);
        expect(qw(function (a) { return a * a; })).toEqual([]);
    });
});

describe('Suit class objects', function () {

    var ref = {
        club:    { letter: 'C', symbol: '♣', name: 'Clubs',
            alternates:    ['Club'], obj: new Suit('Clubs') },
        diamond: { letter: 'D', symbol: '♦', name: 'Diamonds',
            alternates:    ['Diamond'], obj: new Suit('Diamonds') },
        heart:   { letter: 'H', symbol: '♥', name: 'Hearts',
            alternates:    ['Heart'], obj: new Suit('Hearts') },
        spade:   { letter: 'S', symbol: '♠', name: 'Spades',
            alternates:    ['Spade'], obj: new Suit('Spades') }
    };

    var suitKeys = Object.keys(ref);

    suitKeys.forEach(function (suit) {
        var validArgs = [];
        Object.keys(ref[suit]).forEach(function (field) {
            if (field !== 'obj') {
                validArgs = validArgs.concat(ref[suit][field]);
            }
        });
        validArgs.forEach(function (arg) {
            if (typeof arg !== 'string') {
                validArgs.push(arg.toString());
            }
        });
        ref[suit].validArgs = validArgs;
    });

    it('should accept valid arguments to the constructor', function () {
        [0, 1, 2, 3, '0', '1', '2', '3',             // integer indices
            'C', 'D', 'H', 'S', 'c', 'd', 'h', 's',  // suit letters
            '♣', '♦', '♥', '♠',                    // suit symbols
            'Clubs', 'Diamonds', 'Hearts', 'Spades', // valid suit names
            'clubs', 'diamonds', 'hearts', 'spades', // valid suit names
            'Club', 'Diamond', 'Heart', 'Spade',     // valid alternates
            'club', 'diamond', 'heart', 'spade'      // valid alternates
        ].forEach(function (argument) {
                expect(new Suit(argument)).toBeDefined();
            });
    });

    it('should throw on invalid arguments to the constructor', function () {
        [7, 12, 97, 121, '7', '12', '97', '121',    // invalid integer indices
            'J', 'Q', 'F', 'U', 'j', 'q', 'f', 'u', // invalid suit letters
            '♘', '☃', '♉', '☮',                   // invalid suit symbols
            'Wands', 'Coins', 'Cups', 'Swords',     // invalid suit names
            'wands', 'coins', 'cups', 'swords',     // invalid suit names
            'Tiger', 'Elephant', 'Cat', 'Zombie',   // invalid alternates
            'tiger', 'elephant', 'cat', 'zombie'    // invalid alternates
        ].forEach(function (argument) {
                expect(function () { new Suit(argument); }).toThrow();
            });
    });

    it('should test correctly for equality', function () {
        suitKeys.forEach(function (suit) {
            ref[suit].validArgs.forEach(function (arg) {
                suitKeys.forEach(function (otherSuit) {
                    if (suit === otherSuit) {
                        expect(new Suit(arg)).toEqual(ref[otherSuit].obj);
                    }
                    else {
                        expect(new Suit(arg)).not.toEqual(ref[otherSuit].obj);
                    }
                });
            });
        });
    });

    it('should produce appropriate strings for display', function () {
        suitKeys.forEach(function (suit) {
            var thisSuit = ref[suit].obj;
            ['letter', 'symbol', 'name'].forEach(function (key) {
                var method = 'as' + ucfirst(key);
                expect(thisSuit[method]()).toEqual(ref[suit][key]);
            });
        });
    });

    it('should produce integers for values', function () {
        suitKeys.forEach(function (suit) {
            expect(typeof ref[suit].obj.asValue()).toBe('number');
        });
    });
});

describe('Rank class objects', function () {

    var ref = {
        A: { letter: 'A', value: 1, name: 'Ace',
            obj:     new Rank('A') },
        2: { letter: '2', value: 2, name: 'Two', alternates: ['Deuce'],
            obj:     new Rank('2') },
        3: { letter: '3', value: 3, name: 'Three', alternates: ['Trey'],
            obj:     new Rank('3') },
        4: { letter: '4', value: 4, name: 'Four',
            obj:     new Rank('4') },
        5: { letter: '5', value: 5, name: 'Five',
            obj:     new Rank('5') },
        6: { letter: '6', value: 6, name: 'Six',
            obj:     new Rank('6') },
        7: { letter: '7', value: 7, name: 'Seven',
            obj:     new Rank('7') },
        8: { letter: '8', value: 8, name: 'Eight',
            obj:     new Rank('8') },
        9: { letter: '9', value: 9, name: 'Nine',
            obj:     new Rank('9') },
        T: { letter: 'T', value: 10, name: 'Ten',
            obj:     new Rank('T') },
        J: { letter: 'J', value: 11, name: 'Jack',
            obj:     new Rank('J') },
        Q: { letter: 'Q', value: 12, name: 'Queen',
            obj:     new Rank('Q') },
        K: { letter: 'K', value: 13, name: 'King',
            obj:     new Rank('K') }
    };

    var rankKeys = Object.keys(ref);

    rankKeys.forEach(function (rank) {
        var validArgs = [];
        Object.keys(ref[rank]).forEach(function (field) {
            if (field !== 'obj') {
                validArgs = validArgs.concat(ref[rank][field]);
            }
        });
        ref[rank].validArgs = validArgs;
    });

    it('should accept valid arguments to the constructor', function () {
        [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,      // integer indices
            'A', '2', '3', '4', '5', '6', '7', '8', '9',  // rank letters
            'T', 'J', 'Q', 'K', 'a', 't', 'j', 'q', 'k',  // rank letters
            'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', // valid rank names
            'Seven', 'Eight', 'Nine', 'Ten', 'Jack',      // valid rank names
            'Queen', 'King', 'ace', 'two', 'three',       // valid rank names
            'four', 'five', 'six', 'seven', 'eight',      // valid rank names
            'nine', 'ten', 'jack', 'queen', 'king',       // valid rank names
            'Deuce', 'Trey', 'deuce', 'trey'              // valid alternates
        ].forEach(function (argument) {
                expect(new Rank(argument)).toBeDefined();
            });
    });

    it('should throw on invalid arguments to the constructor', function () {
        [ 0, 19, 81, 356, 3962,                     // invalid integer indices
            'C', 'F', 'N', 'E', 'c', 'f', 'n', 'e', // invalid rank letters
            'Twelve', 'Fifteen', 'Page', 'Knight',  // invalid rank names
            'twelve', 'fifteen', 'page', 'knight',  // invalid rank names
            'Tiger', 'Elephant', 'Cat', 'Zombie',   // invalid alternates
            'tiger', 'elephant', 'cat', 'zombie'    // invalid alternates
        ].forEach(function (argument) {
                expect(function () { new Rank(argument); }).toThrow();
            });
    });

    it('should test correctly for equality', function () {
        rankKeys.forEach(function (rank) {
            ref[rank].validArgs.forEach(function (arg) {
                rankKeys.forEach(function (otherRank) {
                    if (rank === otherRank) {
                        expect(new Rank(arg)).toEqual(ref[otherRank].obj);
                    }
                    else {
                        expect(new Rank(arg)).not.toEqual(ref[otherRank].obj);
                    }
                });
            });
        });
    });

    it('should produce appropriate strings for display', function () {
        rankKeys.forEach(function (rank) {
            var thisRank = ref[rank].obj;
            ['letter', 'name'].forEach(function (key) {
                var method = 'as' + ucfirst(key);
                expect(thisRank[method]()).toEqual(ref[rank][key]);
            });
        });
    });

    it('should produce integers for values', function () {
        rankKeys.forEach(function (rank) {
            expect(typeof ref[rank].obj.asValue()).toBe('number');
        });
    })
});

describe('Card class objects', function () {

    var ranks = qw('A 2 3 4 5 6 7 8 9 T J Q K');
    var suits = qw('C D H S');

    var allCards = [];
    ranks.forEach(function (rank) {
        suits.forEach(function (suit) {
            allCards.push(new Card(rank, suit));
        });
    });

    var validCardValues = allCards.map(function (card) {
        return card.asValue();
    });

    var possibleVal = 3;
    var invalidCardValues = [];
    while (invalidCardValues.length < 100) {
        if (validCardValues.indexOf(possibleVal) === -1) {
            invalidCardValues.push(possibleVal);
        }
        possibleVal += 3;
    }

    it('should accept good arguments to the 1-arg constructor', function () {
        allCards.forEach(function (card) {

            // one-argument constructor: card or card as value

            expect(new Card(card.asValue())).toBeDefined();
            expect(new Card(card)).toBeDefined();

        });
    });

    it('should accept good arguments to the 2-arg constructor', function () {
        allCards.forEach(function (card) {

            // ranks - object, value, letter, name
            // suits - object, value, symbol, letter, name

            var rankArgs = [ card.rank.asValue(), card.rank.asLetter(),
                card.rank.asName() ];
            var suitArgs = [ card.suit.asValue(), card.suit.asLetter(),
                card.suit.asSymbol(), card.suit.asName()];

            rankArgs.forEach(function (rankArg) {
                suitArgs.forEach(function (suitArg) {
                    expect(new Card(rankArg, suitArg)).toBeDefined();
                });
            });
        });
    });

    it('should throw on invalid arguments to the constructor', function () {

        // invalid numbers of arguments

        expect(function () { new Card()}).toThrow();
        expect(function () { new Card(1, 2, 3)}).toThrow();
        expect(function () { new Card(qw('a b c'))}).toThrow();

        // invalid one-argument forms

        invalidCardValues.forEach(function (cardValue) {
            expect(function () { new Card(cardValue); }).toThrow();
        });

        ranks.forEach(function (rank) {
            expect(function () { new Card(new Rank(rank))}).toThrow();
        });

        suits.forEach(function (suit) {
            expect(function () { new Card(new Suit(suit))}).toThrow();
        });

        // invalid two-argument forms

        ranks.forEach(function (rank) {
            suits.forEach(function (suit) {
                expect(function () {
                    new Card(new Rank(rank), new Suit(suit))
                }).toThrow();
            });
        });
    });

    it('should compare correctly', function () {
        allCards.forEach(function (cardOne) {
            allCards.forEach(function (cardTwo) {
                if (cardOne.asValue() < cardTwo.asValue()) {
                    expect(cardOne.compare(cardTwo)).toBeLessThan(0);
                    expect(cardOne).not.toEqual(cardTwo);
                }
                else if (cardOne.asValue() === cardTwo.asValue()) {
                    expect(cardOne.compare(cardTwo)).toEqual(0);
                    expect(cardOne).toEqual(cardTwo);
                }
                else if (cardOne.asValue() > cardTwo.asValue()) {
                    expect(cardOne.compare(cardTwo)).toBeGreaterThan(0);
                    expect(cardOne).not.toEqual(cardTwo);
                }
            })
        });
    });

    it('should produce correctly formatted display strings', function () {
        allCards.forEach(function (thisCard) {
            expect(thisCard.asShortASCIIString()).toEqual(thisCard.rank.asLetter()
                + thisCard.suit.asLetter());
            expect(thisCard.asShortString()).toEqual(thisCard.rank.asLetter()
                + thisCard.suit.asSymbol());
            expect(thisCard.asLongString()).toEqual(thisCard.rank.asName()
                + ' of ' + thisCard.suit.asName());
        });
    });

});

describe('Deck class objects', function () {

    var ranks = qw('A 2 3 4 5 6 7 8 9 T J Q K');
    var suits = qw('C D H S');

    var allCards = [];
    ranks.forEach(function (rank) {
        suits.forEach(function (suit) {
            allCards.push(new Card(rank, suit));
        });
    });

    var allCardsBackwards = allCards.concat().reverse();

    it('should accept no arguments to the constructor', function () {
        expect(new Deck()).toBeDefined();
        expect(new Deck().count()).toEqual(0);
    });

    it('should function correctly as a queue top-down', function () {
        var cardCount = 0;
        var d = new Deck();
        allCards.forEach(function (card) {
            d.addTopCard(card);
            cardCount++;
            expect(d.topCard()).toEqual(card);
            expect(d.count()).toEqual(cardCount);
        });

        allCards.forEach(function (card) {
            var c = d.pullBottomCard();
            cardCount--;
            expect(c).toEqual(card);
            expect(d.count()).toEqual(cardCount);
        });
    });

    it('should function correctly as a queue bottom-up', function () {
        var cardCount = 0;
        var d = new Deck();
        allCards.forEach(function (card) {
            d.addBottomCard(card);
            cardCount++;
            expect(d.bottomCard()).toEqual(card);
            expect(d.count()).toEqual(cardCount);
        });

        allCards.forEach(function (card) {
            var c = d.pullTopCard();
            cardCount--;
            expect(c).toEqual(card);
            expect(d.count()).toEqual(cardCount);
        });
    });

    it('should function correctly as a stack top-down', function () {
        var cardCount = 0;
        var d = new Deck();
        allCards.forEach(function (card) {
            d.addTopCard(card);
            cardCount++;
            expect(d.topCard()).toEqual(card);
            expect(d.count()).toEqual(cardCount);
        });

        allCardsBackwards.forEach(function (card) {
            var c = d.pullTopCard();
            cardCount--;
            expect(c).toEqual(card);
            expect(d.count()).toEqual(cardCount);
        });
    });

    it('should function correctly as a stack bottom-up', function () {
        var cardCount = 0;
        var d = new Deck();
        allCards.forEach(function (card) {
            d.addBottomCard(card);
            cardCount++;
            expect(d.bottomCard()).toEqual(card);
            expect(d.count()).toEqual(cardCount);
        });

        allCardsBackwards.forEach(function (card) {
            var c = d.pullBottomCard();
            cardCount--;
            expect(c).toEqual(card);
            expect(d.count()).toEqual(cardCount);
        });
    });

    it('should create a full deck when asked', function () {
        var d = new Deck();
        d.newDeck();
        var cardSet = {};

        allCards.forEach(function (card) {
            cardSet[card.asShortASCIIString()] = 'found';
        });

        var cardCount = d.count();
        expect(cardCount).toEqual(52);
        expect(Object.keys(cardSet).length).toEqual(52);

        while (d.count() > 0) {
            var c = d.pullTopCard();
            delete cardSet[c.asShortASCIIString()];
            cardCount--;
            expect(cardCount).toEqual(d.count());
            expect(Object.keys(cardSet).length).toEqual(cardCount);
        }
    });

    it('should not lose cards when shuffling', function () {
        var d = new Deck();
        d.newDeck().shuffle();
        var cardSet = {};

        allCards.forEach(function (card) {
            cardSet[card.asShortASCIIString()] = 'found';
        });

        var cardCount = d.count();
        expect(cardCount).toEqual(52);
        expect(Object.keys(cardSet).length).toEqual(52);

        while (d.count() > 0) {
            var c = d.pullTopCard();
            delete cardSet[c.asShortASCIIString()];
            cardCount--;
            expect(cardCount).toEqual(d.count());
            expect(Object.keys(cardSet).length).toEqual(cardCount);
        }
    });

    it('should remove cards correctly', function(){
        var d = new Deck().newDeck().shuffle();
        var cardCount = d.count();
        allCards.forEach(function (card) {
            d.removeCard(card);
            cardCount--;
            expect(cardCount).toEqual(d.count());
        });
    });

    it('should sort consistently', function () {
        var a = new Deck();
        a.newDeck();

        var b = new Deck();
        b.newDeck().shuffle();

        expect(a).not.toEqual(b);

        a.sort();
        b.sort();

        expect(a).toEqual(b);
    });
});