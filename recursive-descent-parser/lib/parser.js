'use strict';

var Parser = function() {
  this.junkRE = new RegExp(/^\s*/);
  this.symbols = {};
  this.rules = {};
  return this;
};

var nullTransform = function(x) {
  return x;
};

Parser.prototype.addSymbol = function(name, regex, transform) {
  this.symbols[name] = {
    regex: regex,
    transform: transform || nullTransform
  };
};

Parser.prototype.addRule = function(name, components, transform) {
  if (!this.rules[name]) {
    this.rules[name] = [];
  }

  this.rules[name].push({
    components: components,
    transform: transform || nullTransform
  });
};

Parser.prototype.subparseSymbol = function(state, string) {

  var anchoredRegex = new RegExp('^' + this.symbols[state].regex.source);
  var trimmedString = string.replace(this.junkRE, '');
  var result = trimmedString.match(anchoredRegex);
  if (result) {
    return [{
      value: this.symbols[state].transform(result[0]),
      remnant: trimmedString.substr(result[0].length)
    }];
  } else {
    return null;
  }
};

Parser.prototype.subparseRule = function(state, string) {
  var workingTable = this.rules[state].map(function(rule) {
    return {
      matched: [],
      componentsRemaining: Array.from(rule.components),
      remnant: string,
      transform: rule.transform
    };
  });
  var resultsTable = [];

  var expandResults = function(theRule, theResults) {
    return theResults.map(function(thisResult) {
      return {
        matched: thisRule.matched.concat(thisResult.value),
        componentsRemaining: Array.from(thisRule.componentsRemaining),
        remnant: thisResult.remnant,
        transform: thisRule.transform
      };
    });
  };

  while (workingTable.length > 0) {

    var thisRule = workingTable.shift();
    if (thisRule.componentsRemaining.length === 0) {
      resultsTable.push({
        value: thisRule.transform(thisRule.matched),
        remnant: thisRule.remnant
      });
    } else {
      var thisComponent = thisRule.componentsRemaining.shift();
      var result = this.subparse(thisComponent, thisRule.remnant);

      if (result) {
        Array.prototype.push.apply(workingTable, expandResults(thisRule, result));
      }
    }
  }

  return resultsTable;
};

Parser.prototype.subparse = function(state, string) {
  if (this.symbols[state]) {
    return this.subparseSymbol(state, string);
  } else if (this.rules[state]) {
    return this.subparseRule(state, string);
  } else {
    return null;
  }
};

Parser.prototype.setStartState = function(newState) {
  this.startState = newState;
};

Parser.prototype.parse = function(string) {
  var parse = this.subparse(this.startState, string)
    .filter(function(p) {
      p.remnant.replace(this.junkRE, '');
      return p.remnant.length === 0;
    }, this)[0];

  return parse && parse.value;
};

module.exports = Parser;
