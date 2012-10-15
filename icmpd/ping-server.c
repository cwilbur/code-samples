#include <unistd.h>
#include <stdio.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>
#include <sys/time.h>
#include <sys/socket.h>
#include <sys/un.h>

#include "ipc-msgs.h"
#include "ping-code.h"

#define MAX_QUEUED 5
#define MAX_CLIENTS 16
#define SELECT_TIMEOUT 5

void add_to_fdset (fd_set *fds, long fd, unsigned int *max);
unsigned int init_server (char *sockfile, int clients);
unsigned int set_from_array (fd_set *fds, long array[]);

int main (int argc, char *argv[])
{
  unsigned int comm_sock, ping_sock;
  long client_sock[MAX_CLIENTS];
  int done = 0;
  int i;

  for (i = 0; i < MAX_CLIENTS; i++)
    client_sock[i] = -1;

  /* WRITEME: check arguments */
  /* WRITEME: see if one of us is running already */

  comm_sock = init_server (SOCKET_FILE, MAX_QUEUED);
  ping_sock = init_ping ();
  
  while (!done)
    {
      fd_set read_fds;
      unsigned int maxfd;
      struct timeval timeout;

      /* prepare fd_sets for select */

      maxfd = set_from_array (&read_fds, client_sock);
      add_to_fdset (&read_fds, comm_sock, &maxfd);
      add_to_fdset (&read_fds, ping_sock, &maxfd);
      maxfd += 1; 

      /* prepare timeout for select */

      timeout.tv_sec = SELECT_TIMEOUT;
      timeout.tv_usec = 0;
      
      select (maxfd, &read_fds, NULL, NULL, &timeout);

      if (FD_ISSET(comm_sock, &read_fds))
	{
	  /* we have a new connection here. */

	  unsigned int client;
	  struct sockaddr_un comm_remote;
	  int i = 0;
	  unsigned int size = sizeof comm_remote;
	
	  client = accept (comm_sock, (struct sockaddr *)&comm_remote,
			   &size);
	  
	  while ((client_sock[i] > 0)
		 && (i < MAX_CLIENTS))
	    i++;
	  
	  if (i < MAX_CLIENTS)
	    {
	      /* we have space for a new client */
	      client_sock[i] = client;
	    }
	  else
	    {
	      /* we don't have space for a new client */
	      char buf[MAX_MSGLEN];
	      make_msg (buf, TOO_MANY_CLIENTS, "");
	      send (client, buf, MAX_MSGLEN, 0);
	      /* we don't care what the result of the send call is,
		 because all we'd do is close the connection anyway */
	      close (client);
	    }
	  
	}
      
      else if (FD_ISSET(ping_sock, &read_fds))
	 {
	   /* this is where the ping reply handling code goes */
	   char packet[MAX_PACKET];

	   struct sockaddr_in from;
	   unsigned int fromlen;
	   struct ping_ack ack;

	   int cc = recvfrom (ping_sock, packet, MAX_PACKET, 0,
			      (struct sockaddr *)&from, &fromlen);
	   parse_ping (&from, packet, cc, &ack);
	   
	   /* now we figure out who this ping belongs to, and route it
	      that way - first, if it's not one we care about, then we
	      simply forget about it */
	   
	   if (ack.id < MAX_CLIENTS && client_sock[ack.id] != -1)
	     {
	       char info[MAX_MSGLEN];
	       char buf[MAX_MSGLEN];
	       int result;

	       make_ping_ack (info, &ack);
	       make_msg (buf, PING_RECD, info);

	       result = send (client_sock[ack.id], buf, MAX_MSGLEN, 0);
	       if (result < 0)
		 {
		   perror ("Sending to client");
		   close(client_sock[i]);
		   client_sock[i] = -1;
		 }
	       else if (result == 0)
		 {
		   printf ("Client closed socket.\n");
		   close(client_sock[i]);
		   client_sock[i] = -1;
		 }
	     }
	 }
      else
	{
	  /* this is a message from one of the clients */
	  
	  int i;
	  for (i = 0; i < MAX_CLIENTS; i++)
	    if ((client_sock[i] >= 0) 
		&& (FD_ISSET (client_sock[i], &read_fds)))
	      {
		char buf[MAX_MSGLEN];
		int result;
		
		result = recv(client_sock[i], buf, MAX_MSGLEN, 0);
		if (result < 0)
		  perror ("server comm read");
		else if (result == 0)
		  {
		    printf ("Client %d closed socket\n", i);
		    client_sock[i] = -1;
		  }
		else
		  {
		    char info[MAX_MSGLEN];
		    char reply[MAX_MSGLEN];
		    struct ping_req req;
		    int msg;

		    printf ("Received from client %d, fd %ld, length %d: %s\n",
			    i, client_sock[i], result, buf);

		    parse_msg (buf, &msg, info);
		    switch (msg)
		      {
		      case CLIENT_REGISTER:
			snprintf (reply, MAX_MSGLEN,
				  "Register ok, you are client %d", i);
			make_msg (buf, REGISTER_OK, reply);
			break;

		      case SEND_PING:
			parse_ping_req (info, &req);
			send_ping (ping_sock, req.host, i, 
				   req.seq_no, req.size);
			make_ping_req (info, &req);
			make_msg (buf, PING_SENT, info);

			break;

		      case CLIENT_SIGNOFF:
			make_msg (buf, SIGNOFF_OK, 
				  "Goodnight and have a pleasant tomorrow");
			break;
			
		      default:
			make_msg (buf, UNSUPPORTED_MESSAGE, "Huh?");
			break;
		      }
		    
		    result = send (client_sock[i], buf, MAX_MSGLEN, 0);
		    if (result < 0)
		      {
			perror ("Sending to client");
			close(client_sock[i]);
			client_sock[i] = -1;
		      }
		    else if (result == 0)
		      {
			printf ("Client closed socket.\n");
			close(client_sock[i]);
			client_sock[i] = -1;
		      }
		    
		  }
	      }
	}
      
    }
  
  return 0;
}

void add_to_fdset (fd_set *fds, long fd, unsigned int *max)
     /* add an element to the fd_set
	fds: the fd_set
	fd: the file descriptor -- long so that it can also contain -1
	max: the current max file descriptor
	returns: nothing
     */
{
  FD_SET (fd, fds);
  if (*max < fd)
    *max = fd;
}

unsigned int set_from_array (fd_set *fds, long array[])
     /* produce a fd_set suitable for select()'s consumption
      * fds: the fd_set
      * array: array of file descriptors, -1 indicates no socket
      * returns: maximum of the fd_set
      */
{
  int i, maxfs;
  FD_ZERO (fds);
  maxfs = 0;
  
  for (i = 0; i < MAX_CLIENTS; i++)
    if (array[i] != -1)
      {
	FD_SET (array[i], fds);
	if (array[i] > maxfs)
	  maxfs = array[i];
      }
  return maxfs;
}

unsigned int init_server (char *sockfile, int clients)
     /* initialize the client-server communications 
      * sockfile: path to the unix domain socket file
      * clients: number of clients to queue waiting for accept()
      * returns: socket file descriptor
      */
{
  unsigned int comm_sock;
  struct sockaddr_un comm_local;
  int len, result;

  /* create the socket */

  comm_sock = socket (AF_UNIX, SOCK_STREAM, 0);
  if (comm_sock == -1) 
    {
      perror ("server comm socket");
      exit (1);
    }

  /* bind the socket */

  /* NB: the OpenBSD sockaddr_un struct has 104 characters of room for
     the path.  This may be different on other platforms. */

  comm_local.sun_family = AF_UNIX;
  strlcpy (comm_local.sun_path, sockfile, 104);
  result = unlink (sockfile);
  len = strlen (comm_local.sun_path) + sizeof(comm_local.sun_family) + 1;
  result = bind (comm_sock, (struct sockaddr *)&comm_local, len);

  if (result == -1)
    {
      perror ("server comm bind");
      exit (1);
    }


  /* listen on the socket */

  result = listen (comm_sock, clients);

  if (result == -1)
    {
      perror ("server comm listen");
      exit (1);
    }

  return comm_sock;
}



