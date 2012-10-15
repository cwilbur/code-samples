#include <unistd.h>
#include <stdio.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/un.h>

#include "ipc-msgs.h"
#include "ping-code.h"

unsigned int init_client (char *sockfile);
int register_client(unsigned int sock);

int main (int argc, char *argv[])
{
  unsigned int comm_server; 

  /* WRITEME: check arguments */

  /* establish the communications with the master */

  comm_server = init_client (SOCKET_FILE);
  if (register_client(comm_server))
    {
      int result;
      struct ping_req req;
      struct ping_ack ack;
      char pinginfo[MAX_MSGLEN];
      char buf[MAX_MSGLEN];
      int done = 0;

      /* here is where the processing goes */

      /* example of requesting a ping */
      
      strlcpy (req.host, "polar.bowdoin.edu", MAX_HOST);
      req.id = 0; /* assigned by server */
      req.seq_no = 1;
      req.size = 64;
      
      make_ping_req (pinginfo, &req);
      make_msg (buf, SEND_PING, pinginfo);
      result = send (comm_server, buf, MAX_MSGLEN, 0);
      if (result == -1)
	{
	  perror ("Sending ping request");
	  exit (1);
	}

      /* put a delay in here so that the server gets the ping reply
	 before it gets/acknowledges the client-done */

      sleep(3); 

      /* example of sending client-done */

      make_msg (buf, CLIENT_SIGNOFF, "Goodnight, Mrs Calabash");
      result = send (comm_server, buf, MAX_MSGLEN, 0);
      if (result == -1)
	{
	  perror ("Sending signoff request");
	  exit (1);
	}

      /* example of handling return messages */

      /* NB: if we send one ping-request, we expect a ping-ack and a
	 ping-reply.  If we send a client signoff request, we expect a
	 signoff-ok reply. In the example, we send a ping-request and
	 a signoff-request; we expect a ping-ack, a ping-reply, and a
	 signoff-ok. */

      while (!done)
	{
	  result = recv (comm_server, buf, MAX_MSGLEN, 0);
	  if (result < 0)
	    {
	      perror ("Reading from server");
	      exit (1);
	    }
	  else if (result == 0)
	    {
	      printf ("The server closed the connection.");
	      exit (1);
	    }
	  else 
	    {
	      char info[MAX_MSGLEN];
	      int msg;
	     
	      printf ("Received from server: %s\n", buf);
	      parse_msg (buf, &msg, info);
	      switch (msg)
		{
		case PING_SENT:
		  /* do nothing; the server is acknowledging the
		     request */
		  break;
		case PING_RECD:
		  parse_ping_ack (info, &ack);
		  printf ("Ping packet %u from %s, size %u, returned "
			  "in %u sec, %u usec\n",
			  ack.seq_no, ack.host, ack.size, 
			  ack.d_sec, ack.d_usec);
		  break;
		  
		case SIGNOFF_OK:
		  done = 1;
		  break;
		}
	    }
	}
    }

  close(comm_server);
  return 0;
}


unsigned int init_client (char *sockfile)
     /* initialize the client-server communications 
      * sockfile: path to the unix domain socket file
      * clients: number of clients to queue waiting for accept()
      * returns: socket file descriptor
      */
{
  unsigned int comm_sock;
  struct sockaddr_un comm_remote;
  int len, result;

  /* create the socket */

  comm_sock = socket (AF_UNIX, SOCK_STREAM, 0);
  if (comm_sock == -1) 
    {
      perror ("client comm socket");
      exit (1);
    }

  /* bind the socket */

  /* NB: the OpenBSD sockaddr_un struct has 104 characters of room for
     the path.  This may be different on other platforms. */

  comm_remote.sun_family = AF_UNIX;
  strncpy (comm_remote.sun_path, sockfile, 104);
  len = strlen (comm_remote.sun_path) + sizeof(comm_remote.sun_family) + 1;
  result = connect (comm_sock, (struct sockaddr *) &comm_remote, len);

  if (result == -1)
    {
      perror ("client comm connect");
      exit (1);
    }
  
  return comm_sock;
}

int register_client (unsigned int sock)
{
  int result;
  char buf[MAX_MSGLEN];
  
  make_msg (buf, CLIENT_REGISTER, "Client registering");
  result = send (sock, buf, MAX_MSGLEN, 0);
  
  if (result == -1)
    {
      perror ("Client registering send");
      return 0;
    }
  
  result = recv (sock, buf, MAX_MSGLEN, 0);

  if (result < 0)
    {
      perror ("Client registering recv");
      return 0;
    }
  else if (result == 0)
    {
      printf ("The server closed the connection on us unexpectedly.");
      return 0;
    }
  else 
    {
      char comment[MAX_MSGLEN];
      int msg;
      
      parse_msg (buf, &msg, comment);
      
      if (msg == REGISTER_OK)
	{
	  return 1;
	}
      else if (msg == TOO_MANY_CLIENTS)
	{
	  printf ("Server reports too many clients, exiting.\n");
	  return 0;
	}
    }
  return 0; /* we should never reach this */
}







