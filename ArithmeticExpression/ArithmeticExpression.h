//
//  ArithmeticExpression.h
//  Blackthorn
//
//  Created by Charlton Wilbur on 12/15/04.
//  Copyright 2004 Chromatico Software. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@interface ArithmeticExpression : NSObject <NSCoding, NSCopying>
{
    NSString *expression;
    NSArray *parseTree;
    NSArray *variables;
    
    NSScanner *scanner; 
}

// convenience method

+ (ArithmeticExpression *) emptyArithmeticExpression;
+ (ArithmeticExpression *) expressionWithString: (NSString *) theString;

- (NSString *) expression;
- (BOOL) setExpression: (NSString *) theExpression;
- (NSArray *) variables;
- (NSArray *) parseTree;

- (id) evaluateWithVariables: (NSDictionary *) vars;
- (NSNumber *) solveForVariable: (NSString *) theVariable withOtherVariables: (NSDictionary *) vars equalTo: (NSNumber *) theNumber;

// private methods declared - clients should NOT USE THESE.

- (NSString *) parseLiteralString: (NSString *) theString;

- (NSString *) parseADDOP;
- (NSString *) parseMULOP;
- (NSNumber *) parseNUMBER;
- (NSString *) parseKEYWORD;
- (NSString *) parseQUOTEDSTRING;

- (NSArray *) parse;
- (NSArray *) parseExpression;
- (NSArray *) parseTerm;
- (NSArray *) parseFactor;
- (NSString *) parseSpacedKeywords;
- (NSArray *) parseArglist;
- (NSArray *) parseFunction;
- (NSArray *) parseVariable;

- (NSSet *) findVariablesIn: (NSArray *) theTree;
- (id) evaluateSubTree: (id) tree withVariables: (NSDictionary *) vars;
- (NSNumber *) solveSubTree: (id) tree forVariable: (NSString *) theVariable withOtherVariables: (NSDictionary *) vars equalTo: (NSNumber *) theNumber;

@end
