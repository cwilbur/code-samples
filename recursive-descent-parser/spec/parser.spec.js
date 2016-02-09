'use strict';
var Parser = require('../lib/parser.js');

describe('parser', function() {

  describe('symbols', function() {
    var parser;

    beforeEach(function() {
      parser = new Parser();
      parser.addSymbol('word', new RegExp(/\w+/));
    });

    it('should recognize symbols', function() {
      var result = parser.subparse('word', 'test one two');
      expect(result[0].value).toBe('test');
      expect(result[0].remnant).toBe(' one two');
    });

    it('should strip out junk before recognizing symbols', function() {
      var result = parser.subparse('word', '  test one two');
      expect(result[0].value).toBe('test');
      expect(result[0].remnant).toBe(' one two');
    });

    it('should not recognize symbols that are not there', function() {
      var result = parser.subparse('word', '$# test one two');
      expect(result).toBeFalsy();
    });

  });

  describe('rules', function() {
    var parser;

    beforeEach(function() {
      parser = new Parser();
      parser.addSymbol('number', new RegExp(/\d+/));
      parser.addSymbol('add', new RegExp(/\+/));
      parser.addSymbol('subtract', new RegExp(/-/));
      parser.addRule('expression', ['number', 'add', 'number']);
      parser.addRule('expression', ['number', 'subtract', 'number']);
    });

    it('should return a list of posssible parses', function() {
      var result = parser.subparse('expression', '2 + 6');
      expect(result[0].value.join('_')).toBe('2_+_6');
    });

    it('should select among competing expansions', function() {
      var result = parser.subparse('expression', '2 - 1');
      expect(result[0].value.join('_')).toBe('2_-_1');
    });

  });

  describe('transforms', function() {
    var parser;

    var joinBy = function(ch) {
      return function(x) {
        return x.join(ch);
      };
    };

    beforeEach(function() {
      parser = new Parser();
      parser.addSymbol('number', new RegExp(/\d+/));
      parser.addSymbol('addop', new RegExp(/\+|-/));
      parser.addSymbol('mulop', new RegExp(/\*|\//));
      parser.addSymbol('(', new RegExp(/\(/));
      parser.addSymbol(')', new RegExp(/\)/));

      parser.addRule('expression', ['term', 'addop', 'expression'], joinBy(' '));
      parser.addRule('expression', ['term'], joinBy(' '));
      parser.addRule('term', ['factor', 'mulop', 'term'], joinBy(' '));
      parser.addRule('term', ['factor'], joinBy(' '));
      parser.addRule('factor', ['number'], joinBy(' '));
      parser.addRule('factor', ['(', 'expression', ')'], joinBy(''));

      parser.setStartState('expression');
    });

    it('should parse and reformat a simple expression', function() {
      var result = parser.parse('2-1+4');
      expect(result).toBe('2 - 1 + 4');
    });

  });

});
