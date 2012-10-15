//
//  ArithmeticExpression.m
//  Blackthorn
//
//  Created by Charlton Wilbur on 12/15/04.
//  Copyright 2004 Chromatico Software. All rights reserved.
//

#import "ArithmeticExpression.h"

// This is a recursive descent parser.  Terminals are in all caps.
// The start state is 'expression'.
//
// ADDOP : “+” | “-”
// MULOP: “*” | “/”
// NUMBER : /[+-]?\d*\.?\d+/
// KEYWORD : /\w+/
// QUOTESTRING : /[^”]+/
// 
// expression : term ADDOP expression
// expression : term
// 
// term : factor MULOP term
// term : factor
// 
// factor : NUMBER
// factor : function
// factor : variable
// factor : "(" expression ")"
// 
// spacedkeywords : KEYWORD /\s+/ spacedkeywords
// spacedkeywords : KEYWORD
// 
// arglist : expression "," arglist
// arglist : expression
// 
// function : KEYWORD "(" arglist ")"
// 
//
// variable: "\"" QUOTESTRING "\""
// variable: spacedkeywords

@implementation ArithmeticExpression

+ (ArithmeticExpression *) emptyArithmeticExpression
{
    // NSLog (@"+emptyArithmeticExpression calling setExpression");
    ArithmeticExpression *ae = [[[ArithmeticExpression alloc] init] autorelease];
    [ae setExpression: @"0"];
    
    return ae;
}

+ (ArithmeticExpression *) expressionWithString: (NSString *) theString
{
    ArithmeticExpression *ae = [[[ArithmeticExpression alloc] init] autorelease];
    if ([ae setExpression: theString])
        return ae;
    else
        return nil;
}


#pragma mark Terminal symbols
// these use NSScanner, and return NSStrings or NSNumbers as appropriate

- (NSString *) parseLiteralString: (NSString *) theString
{
    if ([scanner scanString: theString intoString: nil])
        return theString;
    else
        return nil;
}

- (NSString *) parseADDOP
{
    if ([self parseLiteralString: @"+"])
        return @"+";
    else
        return [self parseLiteralString: @"-"];
}

- (NSString *) parseMULOP
{
    if ([self parseLiteralString: @"*"])
        return @"*";
    else 
        return [self parseLiteralString: @"/"];
}

- (NSNumber *) parseNUMBER
{
    NSDecimal theDecimal;
    if ([scanner scanDecimal: &theDecimal])
        return [NSDecimalNumber decimalNumberWithDecimal: theDecimal];
    else
        return nil;
}

- (NSString *) parseKEYWORD
{
    // we need to match a regular expression: /\w+/
    
    NSString *theKeyword;
    
    if ([scanner scanCharactersFromSet: [NSCharacterSet alphanumericCharacterSet] intoString: &theKeyword])
        return theKeyword;
    else
        return nil;
}

- (NSString *) parseQUOTEDSTRING
{
    NSString *theQuotedString;
    if ([scanner scanUpToString: @"\"" intoString: &theQuotedString])
        return theQuotedString;
    else
        return nil;
}


#pragma mark Non-terminal symbols 
// these call the terminal symbol methods, and return NSArrays containing 
// trees as necessary, except for parseSpacedKeywords

- (NSArray *) parseExpression
{
    // we don't have to do this in a brain-dead way; we know that there must
    // be at least one term, possibly followed by an addition operator and 
    // another expression.
    
    unsigned int startLocation = [scanner scanLocation];
    
    id firstTerm = [self parseTerm];
    if (firstTerm == nil)
        return nil;
    id operator = [self parseADDOP];
    if (operator == nil) // there's no addition operator
        return firstTerm;
    id secondExpression = [self parseExpression];
    if (secondExpression == nil) // uhoh - an addition operator with no term to add
    {
        [scanner setScanLocation: startLocation];
        return nil;
    }
    else 
        return [NSArray arrayWithObjects: operator, firstTerm, secondExpression, nil];
}

- (NSArray *) parseTerm
{
    // again, we don't have to do this in a brain-dead way.
 
    unsigned int startLocation = [scanner scanLocation];
    
    id firstFactor = [self parseFactor];
    if (firstFactor == nil)
        return nil;
    id operator = [self parseMULOP]; 
    if (operator == nil) // there's no multiplication operator
        return firstFactor;
    id secondTerm = [self parseTerm]; 
    if (secondTerm == nil) // uhoh - a multiplication operator with no term to add
    {
        [scanner setScanLocation: startLocation];
        return nil;
    }
    else
        return [NSArray arrayWithObjects: operator, firstFactor, secondTerm, nil];
}

- (NSArray *) parseFactor
{
    // we have a couple options here; see the rules.
    // this is the most complicated set of rules
    
    unsigned int startLocation = [scanner scanLocation];
    
    id result = [self parseNUMBER];
    if (result == nil)        
        result = [self parseFunction];
    if (result == nil)
        result = [self parseVariable];
    if (result == nil)
    {
        id leftparens = [self parseLiteralString: @"("];
        if (leftparens != nil)
            result = [self parseExpression];
        id rightparens = [self parseLiteralString: @")"];
        if (rightparens == nil)
            result = nil;
    }
    
    if (result == nil)
        [scanner setScanLocation: startLocation];
    return result;
}

- (NSString *) parseSpacedKeywords
{
    NSMutableArray *keywordList = [NSMutableArray arrayWithCapacity: 5];
    NSString *thisKeyword = nil;
    while (thisKeyword = [self parseKEYWORD])
        [keywordList addObject: thisKeyword];
    if ([keywordList count] > 0)
        return [keywordList componentsJoinedByString: @" "];
    else
        return nil;
}

- (NSArray *) parseArglist
{
    unsigned int startLocation = [scanner scanLocation];
    NSMutableArray *argumentList = [NSMutableArray arrayWithCapacity: 5];
    id result;
    BOOL done = NO;
    BOOL badParse = NO;
    
    while (!(done || badParse))
    {
        id thisArgument = [self parseExpression];
        if (thisArgument == nil)
        {
            if ([argumentList count] == 0)
                done = YES;
            else
                badParse = YES;
        }
        else
        {
            [argumentList addObject: thisArgument];
            if ([self parseLiteralString: @","] == nil)
                done = YES;
        }
    }
    
    if (badParse)
    {
        [scanner setScanLocation: startLocation];
        result = nil;
    }
    
    if (done)
    {
        result = [NSArray arrayWithArray: argumentList];
    }
    return result;
}

- (NSArray *) parseFunction
{
    unsigned int startLocation = [scanner scanLocation];
    
    id functionName = [self parseKEYWORD];
    if (functionName == nil)
        goto parseFunctionFailed;
    if ([self parseLiteralString: @"("] == nil)
        goto parseFunctionFailed;
    id argList = [self parseArglist];
    if (argList == nil)
        goto parseFunctionFailed;
    if ([self parseLiteralString: @")"] == nil)
        goto parseFunctionFailed;
    
    return [[NSArray arrayWithObjects: functionName, nil]
        arrayByAddingObjectsFromArray: argList];

parseFunctionFailed: 
        [scanner setScanLocation: startLocation];
    return nil;

}

- (NSArray *) parseVariable
{
    unsigned int startLocation = [scanner scanLocation];
    id result = [self parseSpacedKeywords];
    if (result == nil)
    {
        id leftQuote = [self parseLiteralString: @"\""];
        if (leftQuote != nil)
            result = [self parseQUOTEDSTRING];
        id rightQuote = [self parseLiteralString: @"\""];
        if (rightQuote == nil)
            result = nil;
    }
    
    if (result == nil)
    {
        [scanner setScanLocation: startLocation];
        return result;
    }
    else
        return [NSArray arrayWithObjects: @"lookup", result, nil];
}

- (NSArray *) parse
{
    // this is the start state for the parser
    
    NSArray *result = [self parseExpression];
    if ([scanner isAtEnd])
        return result;
    else
        return nil;
}

#pragma mark Other stuff

- (NSSet *) findVariablesIn: (NSArray *) theTree
{
    // NSLog  (@"fVI called with %@ (%@)", [theTree description], [theTree className]);
    
    if (![theTree isKindOfClass: [NSArray class]])
        return nil;
     
    NSEnumerator *e = [theTree objectEnumerator];
    NSMutableSet *theVariables = [NSMutableSet setWithCapacity: 5];
    id element;
    
    // the first element of any list will be an operator or a function name
    [e nextObject];
    // *any* other string we find is a lookup request.
    
    while (element = [e nextObject])
    {
        if ([element isKindOfClass: [NSArray class]])
            [theVariables unionSet: [self findVariablesIn: element]];
        else if ([element isKindOfClass: [NSString class]])
            [theVariables addObject: element];
    }
    return theVariables;
}

- (id) evaluateSubTree: (id) tree withVariables: (NSDictionary *) vars
{
    if (![tree isKindOfClass: [NSArray class]])
        return tree;
    
    NSString *operator = [tree objectAtIndex: 0]; 
    if ([operator isEqualToString: @"+"]
        || [operator isEqualToString: @"-"]
        || [operator isEqualToString: @"*"]
        || [operator isEqualToString: @"/"])
    {
        NSNumber *left = [self evaluateSubTree: [tree objectAtIndex: 1] withVariables: vars]; 
        NSNumber *right = [self evaluateSubTree: [tree objectAtIndex: 2] withVariables: vars]; 
        NSNumber *result = nil;
        
        if ((left == nil) || (right == nil))
            return nil;
        
        if ([operator isEqualToString: @"+"])
            result = [NSNumber numberWithFloat: [left floatValue] + [right floatValue]];
        else if([operator isEqualToString: @"-"])
            result = [NSNumber numberWithFloat: [left floatValue] - [right floatValue]];
        else if([operator isEqualToString: @"*"])
            result = [NSNumber numberWithFloat: [left floatValue] * [right floatValue]];
        else if([operator isEqualToString: @"/"])
            result = [NSNumber numberWithFloat: [left floatValue] / [right floatValue]];
        
        // NSLog  (@"evaluating: %@ %@ %@ = %@", [left description], operator, [right description], [result description]);
        
        return result;
    }
    else if ([operator isEqualToString: @"lookup"])
    {
        id result = [vars objectForKey: [tree objectAtIndex: 1]];
        // NSLog  (@"looked up %@, found %@", [tree objectAtIndex: 1], [result description]);
        return result;
    }
    else if ([operator isEqualToString: @"int"])
    {
        NSNumber *input = [self evaluateSubTree: [tree objectAtIndex: 1] withVariables: vars]; 
        NSNumber *result;
        
        if (input == nil)
            result = nil;
        else 
            result = [NSNumber numberWithInt: [input intValue]];

        // NSLog (@"integer value of %@ is %@", [input description], [result description]);
        return result;
    }
    else 
    {        
        // we haven't implemented min, max, sum, avg, table yet.  

        // NSLog  (@"evaluateSubTree called for function %@, subtree %@", operator, tree);
     
        return [NSNumber numberWithInt: 0];
    }
}

// public functions

- (NSString *) expression
{
    // NSLog (@"-expression called");
    return [[expression retain] autorelease]; 
}

- (BOOL) setExpression: (NSString *) theExpression
{
    // NSLog (@"-setExpression: %@ called", theExpression);

    if (expression != theExpression)
    {        
        NSString *oldExpression = expression;
        expression = [theExpression copy];
     
        [scanner release];
        scanner = [[NSScanner alloc] initWithString: expression];
        
        if ([scanner isAtEnd])
        {
            [parseTree autorelease];
            parseTree = nil;
            [variables autorelease];
            variables = nil;
            
            return YES;
        }
        
        else 
        {
            NSArray *theParseTree = [self parse];
        
            if (theParseTree)
            {
                [oldExpression autorelease];
                [expression retain];
                
                [parseTree autorelease];
                parseTree = [theParseTree retain];
                
                [variables autorelease];
                variables = [[[self findVariablesIn: theParseTree] allObjects] retain];
                return YES;
            }
            else
            {
                [expression autorelease];
                expression = oldExpression;
                return NO;
            }
        }
    }
    else
        return YES;
}

-(NSArray *) parseTree
{
    return [[parseTree retain] autorelease];
}

- (NSArray *) variables
{
    return [[variables retain] autorelease]; 
}

- (id) evaluateWithVariables: (NSDictionary *) vars
{
    return [self evaluateSubTree: parseTree withVariables: vars];
}

- (NSNumber *) solveForVariable: (NSString *) theVariable withOtherVariables: (NSDictionary *) vars equalTo: (NSNumber *) theNumber
{
    return [self solveSubTree: parseTree forVariable: theVariable withOtherVariables: vars equalTo: theNumber];
}

- (NSNumber *) solveSubTree: (id) tree forVariable: (NSString *) theVariable withOtherVariables: (NSDictionary *) vars equalTo: (NSNumber *) theNumber
{
    if (![tree isKindOfClass: [NSArray class]])
        return tree;
    
    NSString *operator = [tree objectAtIndex: 0];

    if ([operator isEqualToString: @"+"]
        || [operator isEqualToString: @"-"]
        || [operator isEqualToString: @"*"]
        || [operator isEqualToString: @"/"])
    {
        NSArray *leftChild = [tree objectAtIndex: 1];
        NSArray *rightChild = [tree objectAtIndex: 2];
        BOOL inLeft = ([[self findVariablesIn: leftChild] member: theVariable] != nil);
        BOOL inRight = ([[self findVariablesIn: rightChild] member: theVariable] != nil);

        NSNumber *result;
        
        if (inLeft && inRight)
        {
            // NSLog (@"We're not smart enough to solve for variables in two subtrees.");
            return nil;
        }
        else if (inLeft)
        {
            NSNumber *rightValue = [self evaluateSubTree: rightChild withVariables: vars];

            // LS + RS = IN; LS = IN - RS
            if ([operator isEqualToString: @"+"])
                result = [self solveSubTree: leftChild forVariable: theVariable withOtherVariables: vars equalTo: [NSNumber numberWithFloat: [theNumber floatValue] - [rightValue floatValue]]];
            // LS - RS = IN; LS = IN + RS
            else if([operator isEqualToString: @"-"])
                result = [self solveSubTree: leftChild forVariable: theVariable withOtherVariables: vars equalTo: [NSNumber numberWithFloat: [theNumber floatValue] + [rightValue floatValue]]];
            // LS * RS = IN; LS = IN / RS
            else if([operator isEqualToString: @"*"])
                result = [self solveSubTree: leftChild forVariable: theVariable withOtherVariables: vars equalTo: [NSNumber numberWithFloat: [theNumber floatValue] / [rightValue floatValue]]];
            // LS / RS = IN; LS = IN * RS
            else if([operator isEqualToString: @"/"])
                result = [self solveSubTree: leftChild forVariable: theVariable withOtherVariables: vars equalTo: [NSNumber numberWithFloat: [theNumber floatValue] * [rightValue floatValue]]];
            
            return result;
        }
        else if (inRight)
        {
            NSNumber *leftValue = [self evaluateSubTree: leftChild withVariables: vars];

            // LS + RS = IN; RS = IN - LS
            if ([operator isEqualToString: @"+"])
                result = [self solveSubTree: leftChild forVariable: theVariable withOtherVariables: vars equalTo: [NSNumber numberWithFloat: [theNumber floatValue] - [leftValue floatValue]]];
            // LS - RS = IN; -RS = IN - LS; RS = LS - IN
            else if([operator isEqualToString: @"-"])
                result = [self solveSubTree: leftChild forVariable: theVariable withOtherVariables: vars equalTo: [NSNumber numberWithFloat: [leftValue floatValue] - [theNumber floatValue]]];
            // LS * RS = IN; RS = IN / LS
            else if([operator isEqualToString: @"*"])
                result = [self solveSubTree: leftChild forVariable: theVariable withOtherVariables: vars equalTo: [NSNumber numberWithFloat: [theNumber floatValue] / [leftValue floatValue]]];
            // LS / RS = IN; IN * RS = LS; RS = LS / IN
            else if([operator isEqualToString: @"/"])
                result = [self solveSubTree: leftChild forVariable: theVariable withOtherVariables: vars equalTo: [NSNumber numberWithFloat: [leftValue floatValue] / [theNumber floatValue]]];
            
            return result;
        }
        else
        {
            // NSLog (@"We should never get here - solving for a variable in neither subtree.");
            return nil;
        }        
    }
    else if ([operator isEqualToString: @"lookup"])
    {
        NSString *varName = [tree objectAtIndex: 1];
        
        if ([varName isEqualToString: theVariable])
            return theNumber;
        else
            return [vars objectForKey: varName];
    }
    else if ([operator isEqualToString: @"int"])
    {
        return [self solveSubTree: [tree objectAtIndex: 1] forVariable: theVariable withOtherVariables: vars equalTo: [NSNumber numberWithInt: [theNumber intValue]]];
    }
    else
    {
        // NSLog (@"Tried to solve with operator %@ - help!", operator);
        return nil;
    }    
    
    return nil;
}


- (id) init
{
    self = [super init];
    expression = nil;
    parseTree = nil;
    variables = nil;
    scanner = nil;
    return self;
}

- (void) dealloc
{
    [expression autorelease];
    [parseTree autorelease];
    [variables autorelease];
    [super dealloc];
}

- (NSString *) description
{
    return [NSString stringWithFormat: @"%@", expression];
    // return [NSString stringWithFormat: @"[%p: %@ (%d)]", self, expression, [self retainCount]];
}

- (void) encodeWithCoder: (NSCoder *)coder 
{
    [coder encodeObject: expression forKey: @"expression"];
}

- (id) initWithCoder: (NSCoder *)coder 
{
    [self setExpression: [coder decodeObjectForKey: @"expression"]];
    return self;
}

- (id) copyWithZone: (NSZone *) theZone
{
    // NSLog (@"-copyWithZone called on %@", [self description]);
    ArithmeticExpression *ae = [[ArithmeticExpression allocWithZone: theZone] init];
    [ae setExpression: [self expression]];
    return ae;
}

@end
