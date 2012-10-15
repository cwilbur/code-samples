#include <stdio.h>
#include <string.h>

#include <sys/types.h>
#include <sys/time.h>
#include <sys/socket.h>

#include <netinet/in_systm.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <netinet/ip_icmp.h>
#include <netdb.h>
#include <arpa/inet.h>

#include "ipc-msgs.h"
#include "ping-code.h"

unsigned short in_cksum (unsigned short *addr, int len);

unsigned int init_ping()
{
  int psock;

  psock = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
  if (psock < 0)
    {
      perror ("Getting ping socket");
      exit(1);
    }

  return psock;
}

int send_ping (unsigned int sock, char *hostname, int id, int seq, int size)
{
  unsigned char packet[MAX_PACKET];
  struct icmp *icp = (struct icmp *) packet;
  struct timeval *tp = (struct timeval *) &packet[8];
  struct timezone tz;
  struct hostent *hostinfo;
  struct sockaddr_in target;
  int cc;

  hostinfo = gethostbyname (hostname);
  if (!hostinfo)
    {
      herror ("Lookup for ping");
      return HOST_LOOKUP_ERROR;
    }
  
  target.sin_family = AF_INET;
  target.sin_addr = *((struct in_addr *)hostinfo->h_addr);
 
  gettimeofday (tp, &tz);

  icp->icmp_type = ICMP_ECHO;
  icp->icmp_code = 0;
  icp->icmp_cksum = 0;
  icp->icmp_seq = seq;
  icp->icmp_id = id;

  cc = size + 8;
  icp->icmp_cksum = in_cksum((unsigned short *)icp, cc);

  sendto (sock, packet, cc, 0, (struct sockaddr *) &target, 
	  sizeof (struct sockaddr_in));

  return PING_OK;
}

unsigned short in_cksum (unsigned short *addr, int len)
{
  int nleft, sum;
  unsigned short *w;
  unsigned short answer;

  nleft = len;
  sum = 0;
  w = addr;

  /* using a 32 bit accumulator, we add 16 bit words to it.  
     (this is why we use unsigned short * rather than char *) */

  while (nleft > 1)
    {
      sum += *w++;
      nleft -= 2;
    }

  /* do we have an odd byte? */

  if (nleft == 1)
    {
      union 
      {
	unsigned short us;
	unsigned char uc[2];
      } last;
      
      last.uc[0] = *(u_char *)w;
      last.uc[1] = 0;
      sum += last.us;
    }

  /* now, we fold our carry bits back over (twice, just in case!) 
     and truncate the whole thing to 16 bits */

  sum = (sum >> 16) + (sum & 0xffff);
  sum += (sum >> 16);
  answer = ~sum;
  return answer;
}

void parse_ping (struct sockaddr_in *from, char *buf, 
		 int size, struct ping_ack *ack)
{
  struct ip *ip;
  struct icmp *icp;
  struct timeval ping_recd;
  struct timeval *ping_sent;
  struct timezone tz;
  int hlen;

  /* work out the time ASAP */

  gettimeofday (&ping_recd, &tz);

  /* figure out what's header and what's not */

  ip = (struct ip *) buf;
  
  hlen = ip->ip_hl << 2;
  if (size < hlen + ICMP_MINLEN)
    {
      /* packet too short -- should we handle this ? */
    }
  icp = (struct icmp *)(buf + hlen);

  /* ID and sequence number and size, oh my */

  ack->id = icp->icmp_id;
  ack->seq_no = icp->icmp_seq;
  ack->size = size;

  /* time, time, time, to see what's become of me */

  ping_sent = (struct timeval *) &icp->icmp_data[0];
  ack->d_sec = ping_recd.tv_sec - ping_sent->tv_sec;
  ack->d_usec = ping_recd.tv_usec - ping_sent->tv_usec;
  
  /* host info */
  
  strlcpy (ack->host, inet_ntoa(from->sin_addr), MAX_HOST);
}







