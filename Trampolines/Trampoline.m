//
//  Trampoline.m
//  Trampolines
//
//  Created by Charlton Wilbur on 8/3/05.
//  Copyright 2005 Charlton Wilbur. All rights reserved.
//

#import "Trampoline.h"

#pragma mark undocumented stuff!

@interface NSInvocation (Undocumented)
- (id) initWithMethodSignature: (NSMethodSignature *) ms;
@end

@interface NSMethodSignature (Undocumented)
+ (NSMethodSignature *) signatureWithObjCTypes: (const char *) str;
@end

#pragma mark NSObject category

@implementation NSObject (Trampoline)

- (id) do
{
    return [Trampoline trampolineWithType: kDo andTarget: self];
}

- (id) each
{
    return [Trampoline trampolineWithType: kEach andTarget: self];
}

- (id) collect
{
    return [Trampoline trampolineWithType: kCollect andTarget: self];
}

- (id) select
{
    return [Trampoline trampolineWithType: kSelect andTarget: self];
}

- (id) selectAll
{
    id tr = [self select];
    [tr setShouldMatchAll: YES];
    return tr;
}

- (id) reject
{
    return [Trampoline trampolineWithType: kReject andTarget: self];
}

- (id) rejectAll
{
    id tr = [self reject];
    [tr setShouldMatchAll: YES];
    return tr;
}

- (id) detect
{
    return [Trampoline trampolineWithType: kDetect andTarget: self];
}

- (id) detectAll
{
    id tr = [self detect];
    [tr setShouldMatchAll: YES];
    return tr;
}

- (id) target
{
    return [Trampoline trampolineWithType: kTarget andTarget: self];
}

@end

#pragma mark NSInvocation category

@interface NSInvocation (Copying)

- copyWithZone: (NSZone *) zone;

@end

@implementation NSInvocation (Copying)

- copyWithZone: (NSZone *) zone
{
    NSInvocation *copyInvocation = [[NSInvocation invocationWithMethodSignature: [self methodSignature]] retain];
    int i;
    
    int argCount = [[self methodSignature] numberOfArguments];
    
    for (i = 2; i < argCount; i++)
    {
        id thisArg;
        [self getArgument: &thisArg atIndex:i];
        [copyInvocation setArgument: &thisArg atIndex: i];
    }
    
    [copyInvocation setTarget: [self target]];
    [copyInvocation setSelector: [self selector]];
    
    return copyInvocation;
}

@end

#pragma mark Trampoline

@implementation Trampoline

#pragma mark good behavior

- (id) init
{
    return [self initWithType: kNone andTarget: nil];
}

- (void) dealloc
{
    [self setTarget: nil];
    [super dealloc];
}

#pragma mark convenience

- (Trampoline *) initWithType: (TrampolineType) newType andTarget: (id) newTarget
{
    if (self = [super init])
    {
        [self setTarget: newTarget];
        [self setType: newType];
        [self setShouldMatchAll: NO];
    }
    
    return self;
}

+ (Trampoline *) trampolineWithType: (TrampolineType) newType andTarget: (id) newTarget
{
    return [[[Trampoline alloc] initWithType: newType andTarget: newTarget] autorelease];
}

#pragma mark accessors

- (TrampolineType) type
{    
    return type;
}

- (void) setType: (TrampolineType) newType
{    
    type = newType;
}

- (id) target
{    
    return [[target retain] autorelease]; 
}

- (void) setTarget: (id) newTarget
{    
    [target autorelease];
    target = [newTarget retain];
}

- (BOOL) shouldMatchAll
{    
    return shouldMatchAll;
}

- (void) setShouldMatchAll: (BOOL) flag
{    
    shouldMatchAll = flag;
}

#pragma mark an important message from the programmer

// this relies on the good intentions and competence of the programmer.

// -respondsToSelector: and -methodSignatureForSelector: will select
// a random element from collections.  it's not entirely random, but 
// it might as well be.  that element is used as a model element for 
// proxying those methods.  if that element does not respond to the 
// selector, then the error will be signaled in one of those two 
// messages; if not all elements respond to the selector, but the model 
// element does, the error will be signaled in -forwardInvocation.

// ideally, we'd check every element.  alas, that would be *really*
// expensive.

// it's possible that we don't save much by selecting a model element, 
// but it's the only way for us to figure out what the method signature
// should be. 

// some constraints on how all this works:
// 
// * all the objects in the collector must respond to the selector.
//
// * you can't pass a trampoline other than -do or -each as an argument to a 
//   message to be bounced.
//
// * anything returned from the message bounced by -do is discarded.
//
// * messages bounced by -collect must return an object.
//
// * when -collect is used to bounce messages to a dictionary, -each and -do 
//   trampolines can't be used as arguments to those messages.
//
// * messages bounced by -select, -reject, and -detect must return BOOLs.

#pragma mark playing nice with the runtime

#define TrMaxStr 256

- (NSMethodSignature *) methodSignatureForSelector: (SEL) aSelector
{
    char methodString[TrMaxStr];
    methodString[0] = 0;
    
    switch (type)
    {
        case kNone:
        case kDo:
        case kEach:
        case kTarget:
            strlcat (methodString, @encode(void), TrMaxStr);
            break;
            
        case kCollect:
        case kSelect:
        case kReject:
        case kDetect:
            strlcat (methodString, @encode(id), TrMaxStr);
            break;
            
        default:
            [[NSException exceptionWithName: TrampolineUnsupportedType
                                     reason: TrampolineUnsupportedTypeExplanation
                                   userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector(aSelector), @"selector", nil]] 
                raise];
            break;
    }
    
    if (![[self representativeElement] respondsToSelector: aSelector])
        [[NSException exceptionWithName: TrampolineTargetDoesntRespondToSelector 
                                 reason: TrampolineTargetDoesntRespondToSelectorExplanation
                               userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector(aSelector), @"selector", nil]] 
            raise];
    
    NSMethodSignature *proxySig = [[self representativeElement] methodSignatureForSelector: aSelector];
    
    int argCount = [proxySig numberOfArguments];
    int i;
    
    for (i = 0; i < argCount; i++)
        strlcat (methodString, [proxySig getArgumentTypeAtIndex: i], TrMaxStr);
        
    return [NSMethodSignature signatureWithObjCTypes: methodString];
}

- (BOOL) respondsToSelector: (SEL) aSelector
{
    id element = [self representativeElement];
    
    if (element == nil)
        return NO;
    else
        return [element respondsToSelector: aSelector];
}


#pragma mark the magic message interception

- (id) representativeElement
{
    if (target == nil)
        return nil;
    else if (type == kTarget)
        return target;
    else if ([target isKindOfClass: [NSSet class]])
        return [target anyObject];
    else if ([target isKindOfClass: [NSArray class]])
        return [target lastObject];
    else if ([target isKindOfClass: [NSDictionary class]])
        return [[target allValues] lastObject];
    else
        return target;
}

- (NSArray *) expandInvocation: (NSInvocation *) anInvocation
{
    NSMethodSignature *methodSig = [anInvocation methodSignature];
    int argCount = [methodSig numberOfArguments];
    int trampolineArgIndex = -1;
    int i;

    for (i = 2; i < argCount; i++)
    {
        // if the ith argument is of type id, check to see if it's a 
        // trampoline of type kDo or kEach
        if (strcmp ([methodSig getArgumentTypeAtIndex: i], @encode(id)) == 0) 
        {
            id thisArg;
            [anInvocation getArgument: &thisArg atIndex: i];
            if ([thisArg isKindOfClass: [Trampoline class]])
            {
                TrampolineType thisType = [(Trampoline *) thisArg type];
                if (thisType == kEach || thisType == kDo)
                {
                    trampolineArgIndex = i;
                    break;
                }
                else 
                    [[NSException exceptionWithName: TrampolineOutOfPlace
                                             reason: TrampolineOutOfPlaceExplanation
                                           userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([anInvocation selector]), @"selector", [NSNumber numberWithInt: [(Trampoline *) thisArg type]], @"incorrectTrampolineType", nil]] 
                        raise];
            }
        }
    }
    
    // at this point, either trampolineArgIndex == -1, meaning there are 
    // no trampolines to expand, or it's an integer, meaning there is a 
    // trampoline to expand at that index.

    if (trampolineArgIndex == -1)
        return [NSArray arrayWithObject: anInvocation];
    else
    {
        NSMutableArray *output = [NSMutableArray arrayWithCapacity: 5];
        Trampoline *trampoline;
        [anInvocation getArgument: &trampoline atIndex: trampolineArgIndex];
        id trampolineTarget = [trampoline target];
        
        NSEnumerator *e;
        
        if ([trampolineTarget isKindOfClass: [NSArray class]]
            || [trampolineTarget isKindOfClass: [NSSet class]]
            || [trampolineTarget isKindOfClass: [NSDictionary class]])
            e = [trampolineTarget objectEnumerator];
        else
            e = [[NSArray arrayWithObject: trampolineTarget] objectEnumerator];
        
        id obj;
        
        while (obj = [e nextObject])
        {
            NSInvocation *newInvocation = [[anInvocation copy] autorelease];
            [newInvocation setArgument: &obj atIndex: trampolineArgIndex];
            [output addObjectsFromArray: [self expandInvocation: newInvocation]];
        }
                
        return [[output copy] autorelease];
    }
}

- (void) forwardInvocation: (NSInvocation *) anInvocation
{
    // the invocation we've been handed is for the *trampoline*.
    // we need to alter it so that it works for the *target*.
    
    // first, we monkey with the method invocation.
    
    char newSig[TrMaxStr];
    newSig[0] = 0;
    
    switch ([self type])
    {
        case kDo:
        case kEach:
        case kTarget:
            strlcat (newSig, @encode (void), TrMaxStr);
            break;
    
        case kCollect:
            strlcat (newSig, @encode (id), TrMaxStr);
            break;
            
        case kSelect:
        case kReject:
        case kDetect:
            strlcat (newSig, @encode (BOOL), TrMaxStr);
            break;
            
        default:
            [[NSException exceptionWithName: TrampolineUnsupportedType
                                     reason: TrampolineUnsupportedTypeExplanation
                                   userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([anInvocation selector]), @"selector", nil]] 
                raise];
            break;            
    }
    
    int i;
    int argCount = [[anInvocation methodSignature] numberOfArguments];
    
    for (i = 0; i < argCount; i++)
        strlcat (newSig, [[anInvocation methodSignature] getArgumentTypeAtIndex: i], TrMaxStr);
 
    NSInvocation *newInvoc = [NSInvocation invocationWithMethodSignature: [NSMethodSignature signatureWithObjCTypes: newSig]];
    [newInvoc setSelector: [anInvocation selector]];
    
    char holdingSpace[TrMaxStr];
 
    for (i=0; i < argCount; i++)
    {
        [anInvocation getArgument: holdingSpace atIndex: i];
        [newInvoc setArgument: holdingSpace atIndex: i];
    }
     
    // now, we expand the invocation
    
    NSArray *invocArray = [self expandInvocation: newInvoc];
    id result;
    
    switch (type) 
    {
        case kDo:
        case kEach:
            [self invokeDo: invocArray];
            break;
            
        case kTarget:
            [self invokeTarget: invocArray];
            break;

        case kCollect:
            result = [self invokeCollect: invocArray];
            [anInvocation setReturnValue: &result];
            break;
            
        case kSelect:
        case kReject:
        case kDetect:
            result = [self invokeSelectRejectDetect: invocArray];
            [anInvocation setReturnValue: &result];
            break;
            
            break; 
            
        case kNone:
            [[NSException exceptionWithName: TrampolineUnimplementedType
                                     reason: TrampolineUnimplementedTypeExplanation
                                   userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([anInvocation selector]), @"selector", nil]] 
                raise];
            break;

        default:
            [[NSException exceptionWithName: TrampolineUnsupportedType
                                     reason: TrampolineUnsupportedTypeExplanation
                                   userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([anInvocation selector]), @"selector", nil]] 
                raise];
    }
    
    
}

#pragma mark the wonderful dispatch table

- (void) invokeTarget: (NSArray *) invocArray
{
    if (target == nil)
        return; 

    NSEnumerator *invocE = [invocArray objectEnumerator];
    NSInvocation *invoc;
        
    while (invoc = [invocE nextObject])
        if ([target respondsToSelector: [invoc selector]])
                [invoc invokeWithTarget: target];
        else
            [[NSException exceptionWithName: TrampolineTargetDoesntRespondToSelector 
                                     reason: TrampolineTargetDoesntRespondToSelectorExplanation
                                   userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([invoc selector]), @"selector", nil]] 
                raise];
}

- (void) invokeDo: (NSArray *) invocArray
{
    NSEnumerator *e;
    
    if (target == nil)
         return; 
    else if ([target isKindOfClass: [NSSet class]] 
             || [target isKindOfClass: [NSArray class]]
             || [target isKindOfClass: [NSDictionary class]])
        e = [target objectEnumerator];
    else
        e = [[NSArray arrayWithObject: target] objectEnumerator];
    
    id obj;
    
    while (obj = [e nextObject])
    {
        NSEnumerator *invocE = [invocArray objectEnumerator];
        NSInvocation *invoc;

        while (invoc = [invocE nextObject])
            if ([obj respondsToSelector: [invoc selector]])
                [invoc invokeWithTarget: obj];
            else
                [[NSException exceptionWithName: TrampolineTargetDoesntRespondToSelector 
                                         reason: TrampolineTargetDoesntRespondToSelectorExplanation
                                       userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([invoc selector]), @"selector", nil]] 
                    raise];
    }
}

- (id) invokeCollect: (NSArray *) invocArray
{
    id output;
    NSEnumerator *elemE;
    BOOL isDictionary = NO;
    
    if ([target isKindOfClass: [NSSet class]])
    {
        output = [NSMutableSet setWithCapacity: 5];
        elemE = [target objectEnumerator];
    }
    else if ([target isKindOfClass: [NSDictionary class]])
    {
        output = [NSMutableDictionary dictionaryWithCapacity: 5];
        elemE = [target keyEnumerator];
        isDictionary = YES;
    }
    else if ([target isKindOfClass: [NSArray class]])
    {
        output = [NSMutableArray arrayWithCapacity: 5];
        elemE = [target objectEnumerator];
    }
    else
    {
        output = [NSMutableArray arrayWithCapacity: 5];
        elemE = [[NSArray arrayWithObject: target] objectEnumerator];
    }
    
    // it's a semantic confusion for -collect to have an -each on the right
    // side when dealing with dictionaries.  there's a good solution to this, 
    // which is to have -each produce a dictionary, and treat that dictionary 
    // as a result -- but with multiple -each calls possible, that gets hairy
    // FAST.  so we raise an exception and punt.
    
    // more concretely:  
    //   newDict = [[oldDict collect] thisMethod: [otherDict each]]; 
    // should create newDict, which has the same keys as oldDict; each value 
    // in newDict is a dictionary with the keys of otherDict.  alas, with the
    // approach we're taking, by the time we get to this point in the code 
    // we've lost track of what otherDict is.  it's also unclear what 
    //   outDict = [[inDict collect] doThis: [dictA each] with: [dictB each]]; 
    // should produce.  punting looks like a better and better idea.
    
    if (isDictionary && ([invocArray count] > 1))
        [[NSException exceptionWithName: TrampolineDictCollectDoesntGrokEach 
                                 reason: TrampolineDictCollectDoesntGrokEachExplanation
                               userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", nil]] 
            raise];
    
    id elem;
    id key;
    
    while (key = [elemE nextObject])
    {
        if (isDictionary)
            elem = [target objectForKey: key];
        else 
            elem = key;
        
        NSEnumerator *invocE = [invocArray objectEnumerator];
        NSInvocation *invoc;
    
        while (invoc = [invocE nextObject])
        {
            if (![elem respondsToSelector: [invoc selector]])
                [[NSException exceptionWithName: TrampolineTargetDoesntRespondToSelector 
                                         reason: TrampolineTargetDoesntRespondToSelectorExplanation
                                       userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([invoc selector]), @"selector", nil]] 
                    raise];

            else if (strcmp ([[elem methodSignatureForSelector: [invoc selector]] methodReturnType], @encode (id)) != 0)
                [[NSException exceptionWithName: TrampolineCantCollectNonObjects 
                                         reason: TrampolineCantCollectNonObjectsExplanation
                                       userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([invoc selector]), @"selector", [NSString stringWithCString: [[elem methodSignatureForSelector: [invoc selector]] methodReturnType]], @"actualReturnValue", nil]] 
                    raise];
            
            else
            {
                id eCopy;
                
                @try 
                {
                    eCopy = [[elem copy] autorelease];  
                    // -copy will raise an exception if the target doesn't
                    // conform to the NSCopying protocol.  
                }
                
                @catch (NSException *e)
                {
                    [[NSException exceptionWithName: TrampolineCollectNeedsCopy 
                                             reason: TrampolineCollectNeedsCopyExplanation
                                           userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([invoc selector]), @"selector", [NSString stringWithCString: [[elem methodSignatureForSelector: [invoc selector]] methodReturnType]], @"actualReturnValue", nil]] 
                        raise];
                }
                    
                id result;
                
                [invoc invokeWithTarget: eCopy];
                [invoc getReturnValue: &result];
                
                if (isDictionary)
                    [output setObject: result forKey: key];
                else
                    [output addObject: result];
            }
        }
    }
    
    return output;
}

- invokeSelectRejectDetect: (NSArray *) invocArray
{
    id output;
    NSEnumerator *elemE;
    BOOL isDictionary = NO;
    
    if ([target isKindOfClass: [NSSet class]])
    {
        output = [NSMutableSet setWithCapacity: 5];
        elemE = [target objectEnumerator];
    }
    else if ([target isKindOfClass: [NSDictionary class]])
    {
        output = [NSMutableDictionary dictionaryWithCapacity: 5];
        elemE = [target keyEnumerator];
        isDictionary = YES;
    }
    else if ([target isKindOfClass: [NSArray class]])
    {
        output = [NSMutableArray arrayWithCapacity: 5];
        elemE = [target objectEnumerator];
    }
    else
    {
        output = [NSMutableArray arrayWithCapacity: 5];
        elemE = [[NSArray arrayWithObject: target] objectEnumerator];
    }

    // the default behavior is to consider the match successful in a multiple-
    // trampoline situation if *any* of the trampolines returns YES (for
    // -select) or NO (for -reject).  the *All versions (which have 
    // shouldMatchAll = YES) consider the match successful in a multiple-
    // trampoline situation only if *all* of the trampolines return YES 
    // (-select) or NO (-reject).
    
    id elem;
    id key;
    
    while (key = [elemE nextObject])
    {
        if (isDictionary)
            elem = [target objectForKey: key];
        else
            elem = key;
        
        NSEnumerator *invocE = [invocArray objectEnumerator];
        NSInvocation *invoc;
        
        BOOL shouldAdd = [self shouldMatchAll]; 
        
        while (invoc = [invocE nextObject])
        {
            if (![elem respondsToSelector: [invoc selector]])
                [[NSException exceptionWithName: TrampolineTargetDoesntRespondToSelector 
                                         reason: TrampolineTargetDoesntRespondToSelectorExplanation
                                       userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([invoc selector]), @"selector", nil]] 
                    raise];
            
            else if (strcmp ([[elem methodSignatureForSelector: [invoc selector]] methodReturnType], @encode (BOOL)) != 0)
                [[NSException exceptionWithName: TrampolineCantSelectOrRejectNonBools
                                         reason: TrampolineCantSelectOrRejectNonBoolsExplanation
                                       userInfo: [NSDictionary dictionaryWithObjectsAndKeys: [self target], @"target", [NSNumber numberWithInt: [self type]], @"type", NSStringFromSelector([invoc selector]), @"selector", [NSString stringWithCString: [[elem methodSignatureForSelector: [invoc selector]] methodReturnType]], @"actualReturnValue", nil]] 
                    raise];
            
            else
            {
                BOOL result;
                [invoc invokeWithTarget: elem];
                [invoc getReturnValue: &result];
                
                if ([self type] == kReject)
                    result = !result;
                
                if ([self shouldMatchAll])
                    shouldAdd = shouldAdd && result;
                else
                    shouldAdd = shouldAdd || result;
            }        

            if ([self shouldMatchAll] && !shouldAdd)
                break;
            if (![self shouldMatchAll] && shouldAdd)
                break;
        }
        
        if (shouldAdd && ([self type] == kDetect))
            return elem;
        
        if (shouldAdd)
        {
            if (isDictionary)
                [output setObject: elem forKey: key];
            else
                [output addObject: elem];
        }
    }
        
    return output;
}

@end
