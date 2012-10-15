/* ipc-msgs.h */
/* information shared by clients and servers */


/* configuration.  where is the socket file? */

#define SOCKET_FILE "/tmp/icmpd_sock"

/* the structure of actual messages can vary. until we get the IPC
   roughed out, and probably longer, we're using a combination of an
   integer and a string, with the actual structure of the string
   dependent on the integer. */

#define CLIENT_REGISTER 1
#define REGISTER_OK 2
#define TOO_MANY_CLIENTS 3
#define CLIENT_SIGNOFF 4
#define SIGNOFF_OK 5

#define SEND_PING 10
#define PING_SENT 11
#define PING_RECD 12

#define UNSUPPORTED_MESSAGE 999

#define MAX_MSGLEN 80
#define MAX_HOST 60

void parse_msg (char *raw, int *msg, char *msg_text);
void make_msg (char *raw, int msg, char *msg_text);

/* to issue a ping, we need to know the address, the id, the sequence
   number,  and the size to ping. */

struct ping_req
{ 
  unsigned int id;
  unsigned int seq_no;
  unsigned int size;
  char host[MAX_HOST];
};

void parse_ping_req (char *raw, struct ping_req *req);
void make_ping_req (char *raw, struct ping_req *req);

/* when we receive a ping, we want to know the address, the id, the
   sequence number, and the time. */

struct ping_ack
{
  unsigned int id;
  unsigned int seq_no;
  unsigned int size;
  unsigned int d_sec;
  unsigned int d_usec;
  char host[MAX_HOST];
};

void parse_ping_ack (char *raw, struct ping_ack *ack);
void make_ping_ack (char *raw, struct ping_ack *ack);





