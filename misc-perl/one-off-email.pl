#!/usr/bin/env perl

use strict;
use warnings;
use diagnostics;

use DBI;
use Template;
use Mail::Sender;
use Config::YAML;
use File::Basename;

use FindBin qw/$RealBin/;
chdir $RealBin;

my $config_file = shift @ARGV;
unless ($config_file =~ /\.ya?ml/)
{
    print "You must provide the configuration file for the mailing.\n";
    exit;
}

my $dir = dirname ($config_file);
$dir .= '/' 
    if length ($dir) > 0 && $dir !~ m|/$|;

my $config = Config::YAML->new (config => $config_file)
    or die "Can't read mailing config file provided - $!";
my $dbinfo = Config::YAML->new (config => 'prod-db.yaml')
    or die "Can't read database config file provided.- $!";

my $dbh = DBI->connect ($dbinfo->get_connection,
			$dbinfo->get_username,
			$dbinfo->get_password)
    or die "cannot connect to ", $dbinfo->get_connection, 
    " as ", $dbinfo->get_username, " - ", $DBI::errstr;

my $ms = new Mail::Sender { smtp => 'smtp.example.com' };
my $tt = new Template;

my %status_emails;

foreach my $mailing (sort keys %{$config->get_mailings})
{
    my $statuslog = '';
    my $m = $config->{mailings}->{$mailing};

    my $sth = $dbh->prepare ($m->{query});
    $sth->execute;

    my $count = 0;

    $statuslog .= "Fetching results for " . $m->{name} . "\n";
    while (my $aref = $sth->fetchrow_arrayref)
    {
	$count++;
	print "preparing $count\n" unless $count % 100;

	my %results;
	@results{@{$m->{queryfields}}} = @$aref;
	$results{email} =~ s/^(.*?\cM)//;  # SOMEHOW people get email\cMemail in the form field
	$results{mode} = $config->{mode};

	my $disp = sprintf ($m->{display}, @results{@{$m->{displayfields}}});

	if ($config->{mode} eq 'development')
	{
	    $results{originalto} = $results{email}; 
	    $results{email} = $config->{debug_email};
	}

	my $subject;
	my $textbody; 
	my $htmlbody;

	$tt->process (\$m->{subject}, \%results, \$subject)
	    || die Template->error();

	if (exists $m->{text_template})
	{
	    $tt->process ($dir . $m->{text_template}, \%results, \$textbody)
		|| die Template->error();
	}
	if (exists $m->{html_template})
	{
	    $tt->process ($dir . $m->{html_template}, \%results, \$htmlbody)
		|| die Template->error();
	}

	if (defined $htmlbody && !defined $textbody)
	{
	    $ms->MailMsg ({ from => $m->{from},
			    to => $results{email},
			    subject => $subject,
			    msg => $htmlbody })
		or warn $Mail::Sender::Error;
	}
	elsif (!defined $htmlbody && defined $textbody)
	{
	    $ms->MailMsg ({ from => $m->{from},
			    to => $results{email},
			    subject => $subject,
			    msg => $textbody })
		or warn $Mail::Sender::Error;
	}
	elsif (defined $htmlbody && defined $textbody)
	{
	    # N.B.: parts are listed in order of ascending preference
	    # - so the one we want them to see (if they are able) is
	    # the *last* one.  This way, user-agents that can only
	    # read text see something useful, and user-agents that can
	    # read HTML get HTML.  we also make it through more spam
	    # filters for having a well-constructed multipart email.

	    my $msg = $ms->OpenMultipart ({ from => $m->{from},
					    to => $results{email},
					    subject => $subject,
					    multipart => 'related' });
	    if (!defined $msg or !ref $msg)
	    {
		$statuslog .= "      ERROR: Cannot open multipart, $Mail::Sender::Error\n";
	    }

	    next unless defined $msg && ref $msg;

	    $msg->Part ({ ctype => 'multipart/alternative' });
	    $msg->Part ({ ctype => 'text/plain', disposition => 'NONE', msg => $textbody });
	    $msg->Part ({ ctype => 'text/plain', disposition => 'NONE', msg => $textbody });
	    $msg->Part ({ ctype => 'text/html', disposition => 'NONE', msg => $htmlbody });

	    $msg->EndPart ('multipart/alternative');

	    my $cid = 1;
	    foreach my $fn (@{$m->{attach} || []})
	    {
		my %types = ( swf => 'application/x-shockwave-flash',
			      jpg => 'image/jpg',
			      gif => 'image/gif' );

		my $basefn = $fn;
		$basefn =~ s|^.*/([^/]+)$|$1|;
		
		my $contenttype = $types{substr $basefn, -3, 3};

		# $statuslog .= "      ATTACHING: $basefn\n";

		$msg->Attach ({ ctype => $contenttype,
				encoding => 'base64',
				disposition => "inline; filename=\"$basefn\"\r\nContent-ID: <cid_$cid>",
				file => $dir . $fn });
		$cid++;
		
	    }

	    $msg->Close
		or $statuslog .= "      ERROR: Cannot send, $Mail::Sender::Error\n";
	}
	else # neither is defined
	{
	    $statuslog .= "   ERROR: You must provide a text template, an html template, or both.\n";
	}
	

	$statuslog .= "   $disp\n";
    }

    foreach my $rcpt (@{$m->{notify}})
    {
	$status_emails{$rcpt} .= $statuslog . "\n";
    }
}

$status_emails{$_} .= "\nVirtually yours,\n\nCharlton\n\n"
    foreach keys %status_emails;

foreach my $rcpt (keys %status_emails)
{
    $ms->MailMsg ({ from => 'cwilbur@example.com',
		    to => $rcpt,
		    subject => "Mailing run log " . localtime,
		    msg => $status_emails{$rcpt} })
	or warn $Mail::Sender::Error;

}





