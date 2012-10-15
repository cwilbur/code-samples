//
//  Trampoline.h
//  Trampolines
//
//  Created by Charlton Wilbur on 8/3/05.
//  Copyright 2005 Charlton Wilbur. All rights reserved.
//

#import <Cocoa/Cocoa.h>

@class Trampoline;

@interface NSObject (Trampolines)

- (id) do;
- (id) each;
- (id) collect;
- (id) select;
- (id) selectAll;
- (id) reject;
- (id) rejectAll;
- (id) detect;
- (id) detectAll;
- (id) target;

@end

typedef enum
{
    kNone = 0,
    kDo,
    kEach,
    kCollect,
    kSelect,
    kReject,
    kDetect,
    kTarget,
} TrampolineType;

@interface Trampoline : NSObject 
{
    TrampolineType type;
    id target;
    BOOL shouldMatchAll;
}

- (TrampolineType) type;
- (void) setType: (TrampolineType) newType;
- (id) target;
- (void) setTarget: (id) newTarget;
- (BOOL) shouldMatchAll;
- (void) setShouldMatchAll: (BOOL) flag;

- (Trampoline *) initWithType: (TrampolineType) newType andTarget: (id) newTarget;
+ (Trampoline *) trampolineWithType: (TrampolineType) newType andTarget: (id) newTarget;

// helper functions

- (id) representativeElement;
- (NSArray *) expandInvocation: (NSInvocation *) anInvocation;
- (void) invokeTarget: (NSArray *) invocArray;
- (void) invokeDo: (NSArray *) invocArray;
- (id) invokeCollect: (NSArray *) invocArray;
- invokeSelectRejectDetect: (NSArray *) invocArray;

@end

// exceptions and error messages

#define TrampolineTargetDoesntRespondToSelector @"TrampolineTargetDoesntRespondToSelector"
#define TrampolineTargetDoesntRespondToSelectorExplanation @"The trampoline can't bounce its message to all the targets because some or all of them don't respond to the selector."

#define TrampolineUnsupportedType @"TrampolineUnsupportedType"
#define TrampolineUnsupportedTypeExplanation @"The trampoline that is trying to bounce the message is of an unsupported type.  This should not happen."

#define TrampolineUnimplementedType @"TrampolineUnimplementedType"
#define TrampolineUnimplementedTypeExplanation @"The trampoline that is trying to bounce the message is of an unimplemented type."

#define TrampolineOutOfPlace @"TrampolineOutOfPlace"
#define TrampolineOutOfPlaceExplanation @"A trampoline not of type kDo or kEach was used as an argument to a message to be bounced."

#define TrampolineCantCollectNonObjects @"TrampolineCantCollectNonObjects"
#define TrampolineCantCollectNonObjectsExplanation @"The -collect trampoline can only bounce messages that have objects as return values, because it's not smart enough to collect other types."

#define TrampolineCollectNeedsCopy @"TrampolineCollectNeedsCopy"
#define TrampolineCollectNeedsCopyExplanation @"Objects in a collection that is the target of a -collect trampoline must support the NSCopying protocol."

#define TrampolineDictCollectDoesntGrokEach @"TrampolineDictCollectDoesntGrokEach"
#define TrampolineDictCollectDoesntGrokEachExplanation @"Dictionaries do not support having -each bounced to them because it is unclear what to do with multiple return values associated with the same key."

#define TrampolineCantSelectOrRejectNonBools @"TrampolineCantSelectOrRejectNonBools"
#define TrampolineCantSelectOrRejectNonBoolsExplanation @"The -select and -reject trampolines can only bounce messages that have BOOLs as return values, because they are not smart enough to figure out how to represent YES in other forms."

