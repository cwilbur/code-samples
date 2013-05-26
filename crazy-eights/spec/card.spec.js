//
// card.spec.js
//
// Jasmine unit test suite for the Card class
//

var cardLib = require('../card.js');
var ucfirst = cardLib.ucfirst;
var Suit = cardLib.Suit;


describe('utility function ucfirst', function (){
    it('should capitalize the first character of a string passed to it', function (){
        expect(ucfirst('tiger')).toBe('Tiger');
        expect(ucfirst('elephant')).toBe('Elephant');
    });
    it('should not alter a string whose first character is already capitalized', function (){
        expect(ucfirst('Tiger')).toBe('Tiger');
        expect(ucfirst('Elephant')).toBe('Elephant');
    });
    it('should not alter a string whose first character cannot be capitalized', function (){
        expect(ucfirst('99 Luftballoons')).toBe('99 Luftballoons');
        expect(ucfirst('1, 2, 3, death')).toBe('1, 2, 3, death');
        expect(ucfirst('♠ > ♣')).toBe('♠ > ♣');
    });
});

describe('the constructor of the Suit class', function(){
    it('should recognize four suit indices as integer and string', function (){
        [0, 1, 2, 3].forEach(function (index){
            expect(new Suit(index)).toBeDefined();
            expect(new Suit(index.toString())).toBeDefined();
        });
    });
    it('should throw an error on an invalid index', function (){
        [7, 12, 97, 121].forEach(function (index){
            expect(function (){ new Suit(index); }).toThrow();
            expect(function (){ new Suit(index.toString); }).toThrow();
        });
    });
    it('should recognize four suit letters regardless of case', function (){
        ['C', 'D', 'H', 'S', 'c', 'd', 'h', 's'].forEach(function (letter){
            expect(new Suit(letter)).toBeDefined();
        });
    });
    it('should throw an error on an invalid suit letter', function (){
        ['J', 'Q', 'F', 'U', 'j', 'q', 'f', 'u'].forEach(function (letter){
            expect(function (){ new Suit(letter); }).toThrow();
        });
    });
    it('should recognize four suit symbols', function (){
        ['♣', '♦', '♥', '♠'].forEach(function (symbol){
            expect(new Suit(symbol)).toBeDefined();
        });
    });
    it('should throw an error on an invalid suit symbol', function (){
        ['♘', '☃', '♉', '☮'].forEach(function (symbol){
            expect(function (){ new Suit(symbol); }).toThrow();
        });
    });
    it('should recognize four suit names', function (){
        ['Clubs', 'Diamonds', 'Hearts', 'Spades', 'clubs', 'diamonds', 'hearts', 'spades'].forEach(function (name){
            expect(new Suit(name)).toBeDefined();
        });
    });
    it('should throw an error on an invalid suit name', function (){
        ['Wands', 'Coins', 'Cups', 'Swords', 'wands', 'coins', 'cups', 'swords'].forEach(function (name){
            expect(function (){ new Suit(name); }).toThrow();
        });
    });
    it('should recognize certain alternates', function (){
        ['Club', 'Diamond', 'Heart', 'Spade', 'club', 'diamond', 'heart', 'spade' ].forEach(function (alternate){
            expect(new Suit(alternate)).toBeDefined();
        });
    });
    it('should throw an error on an unrecognized alternate', function (){
        ['Tiger', 'Elephant', 'Cat', 'tiger', 'elephant', 'cat' ].forEach(function (alternate){
            expect(function (){ new Suit(alternate); }).toThrow();
        });
    });
});

/*

describe('objects of the Card class', function(){});


    it('', function (){});

    it('should include letters for all suits', function (){

    });
    it('should include Unicode characters for all suits', function (){

    });
    it('should include suit names for all suits', function (){

    });
    it('should include characters for all ranks', function (){

    });
    it('should include rank names for all ranks', function (){

    });
    it('should correctly identify equal suit letters and Unicode suit characters', function(){

    });
    it ('should correctly identify equal suit letters and suit names', function(){

    });
    it('should correctly identify equal Unicode suit names and Unicode suit letters', function(){

    });
    it ('should correctly identify equal rank characters and rank names', function(){

    });

});

    */