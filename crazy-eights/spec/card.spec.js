//
// card.spec.js
//
// Jasmine unit test suite for the Suit, Rank, Card, and Deck classes
//

var cardLib = require('../card.js');
var ucfirst = cardLib.ucfirst;
var Suit = cardLib.Suit;
var Rank = cardLib.Rank;

describe('utility function ucfirst', function (){
    it('should capitalize the first character of its argument', function (){
        expect(ucfirst('tiger')).toBe('Tiger');
        expect(ucfirst('elephant')).toBe('Elephant');
    });
    it('should not alter an already capitalized argument', function (){
        expect(ucfirst('Tiger')).toBe('Tiger');
        expect(ucfirst('Elephant')).toBe('Elephant');
    });
    it('should not alter an uncapitalizable argument', function (){
        expect(ucfirst('99 Luftballoons')).toBe('99 Luftballoons');
        expect(ucfirst('1, 2, 3, death')).toBe('1, 2, 3, death');
        expect(ucfirst('♠ > ♣')).toBe('♠ > ♣');
    });
});

describe('Suit class objects', function(){

    var ref = {
        club: { letter: 'C', symbol: '♣', name: 'Clubs',
            alternates: ['Club'], obj: new Suit('Clubs') },
        diamond: { letter: 'D', symbol: '♦', name: 'Diamonds',
            alternates: ['Diamond'], obj: new Suit('Diamonds') },
        heart: { letter: 'H', symbol: '♥', name: 'Hearts',
            alternates: ['Heart'], obj: new Suit('Hearts') },
        spade: { letter: 'S', symbol: '♠', name: 'Spades',
            alternates: ['Spade'], obj: new Suit('Spades') }
    };

    var suitKeys = Object.keys(ref);

    suitKeys.forEach(function (suit){
        var validArgs = [];
        Object.keys(ref[suit]).forEach(function (field){
            if (field !== 'obj') {
                validArgs = validArgs.concat(ref[suit][field]);
            }
        });
        validArgs.forEach(function (arg){
            if (typeof arg !== 'string') {
                validArgs.push(arg.toString());
            }
        });
        ref[suit].validArgs = validArgs;
    });

    it('should accept valid arguments to the constructor', function (){
        [0, 1, 2, 3, '0', '1', '2', '3',             // integer indices
            'C', 'D', 'H', 'S', 'c', 'd', 'h', 's',  // suit letters
            '♣', '♦', '♥', '♠',                    // suit symbols
            'Clubs', 'Diamonds', 'Hearts', 'Spades', // valid suit names
            'clubs', 'diamonds', 'hearts', 'spades', // valid suit names
            'Club', 'Diamond', 'Heart', 'Spade',     // valid alternates
            'club', 'diamond', 'heart', 'spade'      // valid alternates
        ].forEach(function (argument){
            expect(new Suit(argument)).toBeDefined();
        });
    });
    it('should throw on invalid arguments to the constructor', function (){
        [7, 12, 97, 121, '7', '12', '97', '121',    // invalid integer indices
            'J', 'Q', 'F', 'U', 'j', 'q', 'f', 'u', // invalid suit letters
            '♘', '☃', '♉', '☮',                   // invalid suit symbols
            'Wands', 'Coins', 'Cups', 'Swords',     // invalid suit names
            'wands', 'coins', 'cups', 'swords',     // invalid suit names
            'Tiger', 'Elephant', 'Cat', 'Zombie',   // invalid alternates
            'tiger', 'elephant', 'cat', 'zombie'    // invalid alternates
        ].forEach(function (argument){
            expect(function (){ new Suit(argument); }).toThrow();
        });
    });

    it('should test correctly for equality', function (){
        suitKeys.forEach(function (suit){
            ref[suit].validArgs.forEach(function (arg){
                suitKeys.forEach(function (otherSuit){
                    if (suit === otherSuit) {
                        expect(new Suit(arg)).toEqual(ref[otherSuit].obj);
                    } else {
                        expect(new Suit(arg)).not.toEqual(ref[otherSuit].obj);
                    }
                });
            });
        });
    });

    it('should produce appropriate strings for display', function (){
        suitKeys.forEach(function (suit){
           var thisSuit = ref[suit].obj;
           ['letter', 'symbol', 'name'].forEach(function (key){
               var method = 'as' + ucfirst(key);
               expect(thisSuit[method]()).toEqual(ref[suit][key]);
           });
        });
    });
});

describe('Rank class objects', function(){

    var ref = {
        A: { letter: 'A', value: 1, name: 'Ace',
            obj: new Rank('A') },
        2: { letter: '2', value: 2, name: 'Two', alternates: ['Deuce'],
            obj: new Rank('2') },
        3: { letter: '3', value: 3, name: 'Three', alternates: ['Trey'],
            obj: new Rank('3') },
        4: { letter: '4', value: 4, name: 'Four',
            obj: new Rank('4') },
        5: { letter: '5', value: 5, name: 'Five',
            obj: new Rank('5') },
        6: { letter: '6', value: 6, name: 'Six',
            obj: new Rank('6') },
        7: { letter: '7', value: 7, name: 'Seven',
            obj: new Rank('7') },
        8: { letter: '8', value: 8, name: 'Eight',
            obj: new Rank('8') },
        9: { letter: '9', value: 9, name: 'Nine',
            obj: new Rank('9') },
        T: { letter: 'T', value: 10, name: 'Ten',
            obj: new Rank('T') },
        J: { letter: 'J', value: 11, name: 'Jack',
            obj: new Rank('J') },
        Q: { letter: 'Q', value: 12, name: 'Queen',
            obj: new Rank('Q') },
        K: { letter: 'K', value: 13, name: 'King',
            obj: new Rank('K') }
    };

    var rankKeys = Object.keys(ref);

    rankKeys.forEach(function (rank){
        var validArgs = [];
        Object.keys(ref[rank]).forEach(function (field){
            if (field !== 'obj') {
                validArgs = validArgs.concat(ref[rank][field]);
            }
        });
        ref[rank].validArgs = validArgs;
    });

    it('should accept valid arguments to the constructor', function (){
        [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,      // integer indices
            'A', '2', '3', '4', '5', '6', '7', '8', '9',  // rank letters
            'T', 'J', 'Q', 'K', 'a', 't', 'j', 'q', 'k',  // rank letters
            'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', // valid rank names
            'Seven', 'Eight', 'Nine', 'Ten', 'Jack',      // valid rank names
            'Queen', 'King', 'ace', 'two', 'three',       // valid rank names
            'four', 'five', 'six', 'seven', 'eight',      // valid rank names
            'nine', 'ten', 'jack', 'queen', 'king',       // valid rank names
            'Deuce', 'Trey', 'deuce', 'trey'              // valid alternates
        ].forEach(function (argument){
                expect(new Rank(argument)).toBeDefined();
            });
    });
    it('should throw on invalid arguments to the constructor', function (){
        [ 0, 19, 81, 356, 3962,                     // invalid integer indices
            'C', 'F', 'N', 'E', 'c', 'f', 'n', 'e', // invalid rank letters
            'Twelve', 'Fifteen', 'Page', 'Knight',  // invalid rank names
            'twelve', 'fifteen', 'page', 'knight',  // invalid rank names
            'Tiger', 'Elephant', 'Cat', 'Zombie',   // invalid alternates
            'tiger', 'elephant', 'cat', 'zombie'    // invalid alternates
        ].forEach(function (argument){
                expect(function (){ new Rank(argument); }).toThrow();
            });
    });

    it('should test correctly for equality', function (){
        rankKeys.forEach(function (rank){
            ref[rank].validArgs.forEach(function (arg){
                rankKeys.forEach(function (otherRank){
                    if (rank === otherRank) {
                        expect(new Rank(arg)).toEqual(ref[otherRank].obj);
                    } else {
                        expect(new Rank(arg)).not.toEqual(ref[otherRank].obj);
                    }
                });
            });
        });
    });

    it('should produce appropriate strings for display', function (){
        rankKeys.forEach(function (rank){
            var thisRank = ref[rank].obj;
            ['letter', 'name'].forEach(function (key){
                var method = 'as' + ucfirst(key);
                expect(thisRank[method]()).toEqual(ref[rank][key]);
            });
        });
    });
});

describe('Card class objects', function (){

});
