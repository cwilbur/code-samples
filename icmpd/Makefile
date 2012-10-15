CC= gcc
CFLAGS= -g -ansi -pedantic -Wall
OBJS= ipc-msgs.o ping-code.o
HEADERS= ipc-msgs.h ping-code.h

all:	ping-server ping-client

clean: 
	rm -f *.o ping-server ping-client

ping-server: ping-server.c $(OBJS) $(HEADERS)
	$(CC) $(CFLAGS) ping-server.c $(OBJS) -o ping-server

ping-client: ping-client.c $(OBJS) $(HEADERS)
	$(CC) $(CFLAGS) ping-client.c $(OBJS) -o ping-client


#.c: 
#	$(CC) $(CFLAGS) $@.c -o $@

.o:
	$(CC) $(CFLAGS) -c $<









