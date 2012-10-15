#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>

#define PING_OK 1
#define HOST_LOOKUP_ERROR 2

#define MAX_PACKET (65536 - 60 - 8) /* max packet size */

unsigned int init_ping();
int send_ping (unsigned int sock, char *hostname, int id, 
	       int seq, int size);
void parse_ping (struct sockaddr_in *from, char *buf, 
		 int size, struct ping_ack *ack);


