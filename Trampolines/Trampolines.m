#import <Foundation/Foundation.h>
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

int main (int argc, const char * argv[]) {
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];

    // ***********************************
    
    
    
    // ***********************************
    
    [pool release];
    return 0;
}
