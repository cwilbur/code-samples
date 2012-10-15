Much of the code here depends on support files (such as
configuration files) or particular infrastructure that's not
included in the samples.  In addition, I've redacted some of
the identifying server names and domain names.

Some of the included sample code --

  * ArithmeticExpression (Cocoa/Objective-C)

    A Cocoa/Objective-C model class to parse and evaluate
    simple arithmetic expressions, such as 3 + 2 * foo. 
    It implements a recursive descent parser and simple
    algebraic problem solver -- for instance, if you know
    that 3 + 2 * foo = 7, it can work out that foo is 2.

  * crazy-eights (Javascript, node.js)

    Because a company I was interested in uses Javascript
    and node.js to build its platform, I began exploring
    them.  I set myself the task of writing code to allow
    the computer to referee games of Crazy Eights, and that
    required writing a client with enough artificial
    stupidity to follow the rules of Crazy Eights.

    I produced this code in about a week, and that involved
    a fair bit of learning about Javascript and node.js. 
    Before I started this project, I knew enough Javascript
    to do a bit of hacking.  Now, I think it's fair to say I
    know and understand a good deal more.

    As a solution to the problem of computers playing Crazy
    Eights against themselves, this solution is seriously
    overengineered.  But there were two goals to the
    project: one was to solve the problem of having a web
    service play crazy eights, and the other was to solidify
    my understanding of Javascript objects and user-created
    node.js modules.

    The overengineering should be apparent to the reviewer,
    but likewise my understanding of Javascript objects and
    user-created node.js modules should be apparent to the
    user, and if it were not overengineered that would not
    be the case.

  * icmpd (C)

    A colleague had an idea for a business: instead of
    asking users to indicate their bandwidth before playing
    streaming video, develop a network appliance that
    generates a local database of subnets and a bandwidth
    estimate for each. One of the heuristics he wanted to
    use was ping response time.

    The problem with ICMP ping is that there's no way to
    specify which process should receive the response, and
    so when you run it in parallel each client process needs
    to parse each ping response.  Because of this, the naive
    implementation, running ping(1) in parallel, does not
    offer any notable performance benefit.

    This solves that problem, by having one process that
    sends and receives all the pings, leaving the client
    processes to handle the data.  This is the program at
    the state I turned it over to my client with the
    client/server part complete.

  * misc-perl/export-order-to-fulfillment.pl (Perl)

    In Perl, a script to export the contents of an
    e-commerce shopping cart to CSV files in the format that
    the warehouse/fulfillment company expects.

  * misc-perl/find-itunes-duplicates.pl (Perl)

    In Perl, a utility script to find likely duplicates in
    the iTunes library and archive them.

  * misc-perl/import-songs-to-itunes.pl (Perl)

    In Perl, a utility to automatically add any music files
    found in a set of locations to the iTunes library.

  * misc-perl/one-off-email.pl (Perl)

    In Perl, a script designed to send mail-merged form
    emails.

  * Trampolines (Cocoa/Objective-C)

    This was an experiment from a few years ago. At that
    point, the orthodox approach to iteration in Cocoa is -
    
        NSEnumerator *e = [collection objectEnumerator]; 
        id obj; 
        
        while (obj = [e nextObject]) 
        {
        ... 
        }
    
    That seemed to me to be awfully wordy, especially when
    the goal of the code stanza was to send a single message
    to each element in the collection class.  I was looking
    for something akin to Perl's foreach, map, and grep
    keywords, and so I dug into the Objective-C runtime and
    implemented it myself.

    As a result, with this code you can now say things like
    
        [[collection each] doSomething];
        NSArray *result = [[collection collect] hasLength: 3];
        if ([[collection detect] hasLength: 5]) { ... }
    
    The best documentation is in the TestTrampoline.m class,
    which shows several invocations of the code and
    documents the expected return value.

    Practically speaking, this approach to iteration is
    syntactically very nice, but there are too many gotchas
    (mostly involving weird edge cases in the Objective-C
    typing system) for it to be broadly useful.  Some
    portions of the functionality were also implemented as
    syntactic sugar in Objective-C 2.0.  You can get an idea
    of how I write experimental code from it, however.
    
    For the record, the new orthodoxy looks like this:
    
        for (id obj in collection)
        {
        ...
        }

