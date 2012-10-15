/* ipc-msgs.c */
/* implementation of important client-server message stuff */

#include <ctype.h>
#include <string.h>
#include <stdio.h>
#include "ipc-msgs.h"

void parse_msg (char *raw, int *msg, char *msg_text) 
{
  char *p_raw;
  
  p_raw = raw;
  while (isspace(*p_raw)) 
    p_raw++;
  for (*msg = 0; *p_raw && !isspace(*p_raw); p_raw++)
    *msg = *msg * 10 + *p_raw - '0';
  while (isspace(*p_raw))
    p_raw++;
  strlcpy (msg_text, raw, MAX_MSGLEN);
}

void make_msg (char *raw, int msg, char *msg_text)
{
  snprintf (raw, MAX_MSGLEN, "%d %s", msg, msg_text);
}

/* the order for a ping_rec is hostname/IP, id, sequence number, and size */

void parse_ping_req (char *raw, struct ping_req *req)
{
  char *p_raw;
  char *p_host;

  while (isspace(*p_raw)) p_raw++;
  
  /* hostname or IP */

  for (p_host = req->host; !isspace (*p_raw); p_raw++, p_host++)
    *p_host = *p_raw;
  *p_host = '\0';
  while (isspace(*p_raw)) p_raw++;

  /* id */

  for (req->id = 0; *p_raw && !isspace(*p_raw); p_raw++)
    req->id = req->id * 10 + *p_raw - '0';
  while (isspace(*p_raw)) p_raw++;

  /* sequence number */

  for (req->seq_no = 0; *p_raw && !isspace(*p_raw); p_raw++)
    req->seq_no = req->seq_no * 10 + *p_raw - '0';
  while (isspace(*p_raw)) p_raw++;

  /* size */

  for (req->size = 0; *p_raw && !isspace(*p_raw); p_raw++)
    req->size = req->size * 10 + *p_raw - '0';
}

void make_ping_req (char *raw, struct ping_req *req)
{
  snprintf (raw, MAX_MSGLEN, "%s %d %d %d", 
	    req->host, req->id, req->seq_no, req->size);
}

/* the order for a ping_ack is host, id, sequence number, size, 
   seconds, microseconds */

void parse_ping_ack (char *raw, struct ping_ack *ack)
{
  char *p_raw;
  char *p_host;

  while (isspace(*p_raw)) p_raw++;
  
  /* hostname or IP */

  for (p_host = ack->host; !isspace (*p_raw); p_raw++, p_host++)
    *p_host = *p_raw;
  *p_host = '\0';
  while (isspace(*p_raw)) p_raw++;

  /* id */

  for (ack->id = 0; *p_raw && !isspace(*p_raw); p_raw++)
    ack->id = ack->id * 10 + *p_raw - '0';
  while (isspace(*p_raw)) p_raw++;

  /* sequence number */

  for (ack->seq_no = 0; *p_raw && !isspace(*p_raw); p_raw++)
    ack->seq_no = ack->seq_no * 10 + *p_raw - '0';
  while (isspace(*p_raw)) p_raw++;

  /* size */

  for (ack->size = 0; *p_raw && !isspace(*p_raw); p_raw++)
    ack->size = ack->size * 10 + *p_raw - '0';
  while (isspace(*p_raw)) p_raw++;

  /* seconds */

  for (ack->d_sec = 0; *p_raw && !isspace(*p_raw); p_raw++)
    ack->d_sec = ack->d_sec * 10 + *p_raw - '0';
  while (isspace(*p_raw)) p_raw++;

  /* microseconds */

  for (ack->d_usec = 0; *p_raw && !isspace(*p_raw); p_raw++)
    ack->d_usec = ack->d_usec * 10 + *p_raw - '0';
}

void make_ping_ack (char *raw, struct ping_ack *ack)
{
  snprintf (raw, MAX_MSGLEN, "%s %d %d %d %u %u", 
	    ack->host, ack->id, ack->seq_no, ack->size, 
	    ack->d_sec, ack->d_usec); 
}






