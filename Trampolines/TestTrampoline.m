//
//  TestTrampoline.m
//  Trampolines
//
//  Created by Charlton Wilbur on 8/6/05.
//  Copyright 2005 Charlton Wilbur. All rights reserved.
//

#import "TestTrampoline.h"
#import "Trampoline.h"

@implementation NSMutableString (Testing)

- (void) appendString: (NSString *) stringOne andString: (NSString *) stringTwo
{
    [self appendString: stringOne];
    [self appendString: stringTwo];
}

@end

@implementation NSString (Testing)

- (BOOL) hasLength: (unsigned) length
{
    return ([self length] == length);
}

@end

@implementation TestTrampoline

- (void) testCreation
{
    NSMutableArray *foo = [NSMutableArray arrayWithCapacity: 5];
    
    STAssertNotNil ([foo do], @"Could not create -do trampoline on array.");
    STAssertNotNil ([foo collect], @"Could not create -collect trampoline on array.");
    STAssertNotNil ([foo select], @"Could not create -select trampoline on array.");
    STAssertNotNil ([foo detect], @"Could not create -detect trampoline on array.");
    STAssertNotNil ([foo reject], @"Could not create -reject trampoline on array.");
    STAssertNotNil ([foo each], @"Could not create -each trampoline on array.");                    
    NSString *bar = @"bar";
    
    STAssertNotNil ([bar do], @"Could not create -do trampoline on non-collection.");
    STAssertNotNil ([bar collect], @"Could not create -collect trampoline on non-collection.");
    STAssertNotNil ([bar select], @"Could not create -select trampoline on non-collection.");
    STAssertNotNil ([bar detect], @"Could not create -detect trampoline on non-collection.");
    STAssertNotNil ([bar reject], @"Could not create -reject trampoline on non-collection.");
    STAssertNotNil ([bar each], @"Could not create -each trampoline on non-collection.");
}

- (void) testSimpleDo
{
    NSArray *input = [NSArray arrayWithObjects:
        [NSMutableString stringWithString: @"one "],
        [NSMutableString stringWithString: @"two "],
        [NSMutableString stringWithString: @"red "],
        [NSMutableString stringWithString: @"blue "],
        nil];
    
    NSArray *output = [NSArray arrayWithObjects: @"one fish", @"two fish", @"red fish", @"blue fish", nil];
    
    [[input do] appendString: @"fish"];
    
    STAssertEqualObjects (input, output, @"Simple -do");
}

- (void) testSimpleDoFailing
{
    NSArray *input = [NSArray arrayWithObjects: [NSNumber numberWithInt: 1], [NSNumber numberWithInt: 2], [NSNumber numberWithInt: 3], nil];
    
    STAssertThrows ([[input do] appendString: @"fish"], @"-do doesn't fail when none of the collection's contents respond to the chosen selector");
        
    NSArray *input2 = [NSArray arrayWithObjects: [NSMutableString stringWithString: @"foo"], [NSNumber numberWithInt: 2], [NSMutableString stringWithString: @"three"],  nil];
     
    STAssertThrows ([[input2 do] appendString: @"fish"], @"-do doesn't fail when not all of the collection's contents respond to the chosen selector");
}

- (void) testDoEach
{
    NSArray *input = [NSArray arrayWithObjects:
        [NSMutableString stringWithString: @"one"],
        [NSMutableString stringWithString: @"two"],
        [NSMutableString stringWithString: @"red"],
        [NSMutableString stringWithString: @"blue"],
        nil];
    
    NSArray *args = [NSArray arrayWithObjects: @" ", @"-", @" ", @"fish", nil];
    
    [[input do] appendString: [args each]];
    
    NSArray *output = [NSArray arrayWithObjects: @"one - fish", @"two - fish", @"red - fish", @"blue - fish", nil];
    
    STAssertEqualObjects (input, output, @"Simple -do/-each");
}

- (void) testDoEachEach
{
    NSMutableString *input = [NSMutableString stringWithString: @"base "];
    NSArray *numStrs = [NSArray arrayWithObjects: @"1", @"2", @"3", nil];
    
    [[input do] appendString: [numStrs each] andString: [numStrs each]];
    
    STAssertEqualObjects (input, @"base 111213212223313233", @"-do/-each/-each");
}

- (void) testSimpleCollectArray
{
    NSArray *input = [NSArray arrayWithObjects: @"one", @"two", @"red", @"blue", nil];
    NSArray *expected = [NSArray arrayWithObjects: @"one fish", @"two fish", @"red fish", @"blue fish", nil];
    NSArray *output = (NSArray *) [[input collect] stringByAppendingString: @" fish"];
    
    STAssertEqualObjects (output, expected, @"-collect with arrays");
}

- (void) testMultipleCollectObject
{
    NSString *input = @"count - ";
    NSArray *iter = [NSArray arrayWithObjects: @"one", @"two", @"three", nil];
    NSArray *expected = [NSArray arrayWithObjects: @"count - one", @"count - two", @"count - three", nil];
    NSArray *output = (NSArray *) [[input collect] stringByAppendingString: [iter each]];

    STAssertEqualObjects (output, expected, @"-collect on an object/-each");
}

- (void) testCollectDictionary
{
    NSDictionary *input = [NSDictionary dictionaryWithObjectsAndKeys: @"one", @"one", @"two", @"two", @"red", @"red", @"blue", @"blue", nil];
    NSDictionary *expected = [NSDictionary dictionaryWithObjectsAndKeys: @"one fish", @"one", @"two fish", @"two", @"red fish", @"red", @"blue fish", @"blue", nil];
    NSDictionary *output = (NSDictionary *) [[input collect] stringByAppendingString: @" fish"];
    
    STAssertEqualObjects (output, expected, @"-collect with dictionaries");
}

- (void) testCollectDictionaryFail
{
    NSDictionary *input = [NSDictionary dictionaryWithObjectsAndKeys: @"one", @"one", @"two", @"two", @"red", @"red", @"blue", @"blue", nil];
    NSArray *iter = [NSArray arrayWithObjects: @" ", @"-", @" ", @"fish", nil];
    
    STAssertThrows ([[input collect] stringByAppendingString: [iter each]], @"-collect doesn't fail when the target is a dictionary and there's an -each present");
}

- (void) testSelectRejectDetect
{
    NSArray *input = [NSArray arrayWithObjects: @"one", @"two", @"three", @"four", @"five", nil];
    NSArray *matches = (id) (long) [[input select] hasLength: 3];
    NSArray *matchExpect = [NSArray arrayWithObjects: @"one", @"two", nil];
    STAssertEqualObjects (matches, matchExpect, @"simple -select");
    
    NSArray *nomatches = (id) (long) [[input reject] hasLength: 4];
    NSArray *nomatchesExpect = [NSArray arrayWithObjects: @"one", @"two", @"three", nil];
    STAssertEqualObjects (nomatches, nomatchesExpect, @"simple -reject");
    
    NSArray *detect = (id) (long) [[input detect] hasLength: 5];
    NSString *detectExpect = @"three";
    STAssertEqualObjects (detect, detectExpect, @"simple -detect");

    NSArray *toMatch = [NSArray arrayWithObjects: @"one", @"three", nil];
    NSArray *selectTwo = (id)(long) [[input select] isEqualToString: [toMatch each]];
    STAssertEqualObjects (selectTwo, toMatch, @"-select/-each");

    NSArray *toReject = toMatch;
    NSArray *rejectTwo = (id)(long) [[input rejectAll] isEqualToString: [toReject each]];
    NSArray *rejectExpect = [NSArray arrayWithObjects: @"two", @"four", @"five", nil];
    STAssertEqualObjects (rejectTwo, rejectExpect, @"-rejectAll/-each");
}



@end
