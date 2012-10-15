#!/usr/bin/perl 

use warnings;
use strict;
use diagnostics;
 
use Text::CSV_XS;
use DBI;
use Config::YAML;
use File::Slurp;
use Getopt::Long;
use DateTime;

my $is_debug;
my $is_prod;

GetOptions ('d|debug:i' => \$is_debug,
	'p|production:i' => \$is_prod);
	
# at this point we have our options
#
# $is_debug is undefined if unspecified, and true/false depending on whether we should use 
# the debug database
#
# $is_prod is defined if we should use the production database

die "Must specify a database with -d (debug) or -p (production) switches!\n"
	unless defined $is_debug || defined $is_prod;

my $now = DateTime->now (time_zone => 'US/Eastern');

my $headerfile = sprintf ('exampleh%02d%02d%02d.csv', $now->year % 100, $now->month, $now->day);
my $detailfile = sprintf ('exampled%02d%02d%02d.csv', $now->year % 100, $now->month, $now->day);;

my $conf = defined $is_debug ? 'dev-db.yaml' : 'prod-db.yaml';

my $dbconf = new Config::YAML ( config => $conf );
my $dbh = DBI->connect ($dbconf->get_connection, $dbconf->get_username, $dbconf->get_password)
    or die "can't connect to ", $dbconf->get_connection;

print "Connecting to ", $dbconf->get_connection, "\n";

open my $hf, '>', $headerfile
	or die "Can't open headerfile $headerfile - $!";
open my $df, '>', $detailfile
	or die "Can't open detailfile $detailfile - $!";

my $csv = Text::CSV_XS->new ({
	quote_char => undef,
	escape_char => undef,
	sep_char => "\t" });
	
my $serial = $dbh->selectrow_array (q(
	select count(distinct date(sent_to_fulfillment))+1 
	from example_store_order 
	where sent_to_fulfillment is not null
	));

my @orders;

my $h_sth = $dbh->prepare (q(
	select 
		order_number,
		bill_first_name, bill_last_name,
		bill_address_1, bill_address_2, bill_address_3,
		bill_city, bill_state, bill_zip,
		bill_country, bill_phone,

		ship_first_name, ship_last_name,
		ship_address_1, ship_address_2, ship_address_3,
		ship_city, ship_state, ship_zip,
		ship_country, ship_phone,

		email

	from example_store_order eso
	where sent_to_fulfillment is null
		and charge_attempt_successful = 'Y'
		and (select count(sku) from example_store_order_item esoi where wsoi.order_number = wso.order_number and shipped = 'N') > 0
	));

$h_sth->execute;

while (my $href = $h_sth->fetchrow_hashref)	
{
	my %order = %$href;

	push @orders, $order{order_number};
	
	my @line;
	
	# this is not the tersest way to do things, but it makes the field numbers
	# transparent
	
	$line[1] = $order{order_number};
	$line[2] = $order{bill_first_name};
	$line[3] = $order{bill_last_name};
	$line[4] = $order{bill_address_1};
	$line[5] = $order{bill_address_2};
	$line[6] = $order{bill_address_3};
	$line[7] = $order{bill_city};
	$line[8] = uc $order{bill_state}; # must be upper-case
	$line[9] = $order{bill_zip};
	$line[10] = $order{bill_country};
	$line[11] = $order{bill_phone};
	
	$line[12] = 'Q'; # credit card type; Q means they're not charging, just fulfilling
	$line[13] = ''; # credit card number
	$line[14] = ''; # credit card expiration
	$line[15] = ''; # credit card auth code
	$line[16] = ''; # credit card auth date
	$line[17] = ''; # source code 
	$line[18] = 'quux'; # product ID / ad code
	$line[19] = ''; # inbound number
	$line[20] = ''; # transaction time
	$line[21] = ''; # transaction date
	$line[22] = ''; # operator code

	$line[23] = $order{ship_first_name};
	$line[24] = $order{ship_last_name};
	$line[25] = $order{ship_address_1};
	$line[26] = $order{ship_address_2};
	$line[27] = $order{ship_address_3};
	$line[28] = $order{ship_city};
	$line[29] = uc $order{ship_state}; # must be upper-case
	$line[30] = $order{ship_zip};
	$line[31] = $order{ship_country};
	$line[32] = 1; # number of payments
	
	$line[33] = ''; # delivery method
	$line[34] = '0.00'; # order base amount
	$line[35] = '0.00'; # s&h charge
	$line[36] = '0.00'; # tax
	$line[37] = '0.00'; # discount
	$line[38] = '0.00'; # total
	$line[39] = ''; # email address
	$line[40] = ''; # MICR no
	$line[41] = ''; # check no
	$line[42] = ''; # bank name
	$line[43] = ''; # bank city
	$line[44] = $order{ship_phone};
	$line[45] = ''; # bank account type
	$line[46] = ''; # filler
	$line[47] = ''; # filler
	$line[48] = ''; # filler
	$line[49] = ''; # filler
	$line[50] = ''; # filler

	if 	($csv->combine (@line[1..$#line]))
	{	
		print $hf $csv->string(), "\n";
	}
	else
	{
		die "Error generating CSV line for order number ", $order{order_number};
	}
}

$h_sth->finish;

if ($csv->combine ('TRAILER RECORD', $headerfile, 
	$now->ymd(''), $now->hms(''), 
	@orders + 1, sprintf ('%05d', $serial)))
{
	print $hf $csv->string(), "\n";
}
else
{
	die "Error generating trailer record for header file"
}

close $hf;

my $o_sth = $dbh->prepare (q(
	select 
	order_number,
	case when order_sku is null then sku else shipping_sku end as sku,
	sum(quantity) as quantity,
	price_per
	from example_store_order_item wsoi 
		left join example_store_sku_shipping_map skumap on wsoi.sku = skumap.order_sku
	where sku != '1'
		and order_number = ?
		and shipped = 'N'
	group by sku
	));

my $rc = 0;

foreach my $order_num (@orders)
{
	$o_sth->execute ($order_num);
	
	my $line_item = 1;
	
	while (my $itemref = $o_sth->fetchrow_hashref)
	{
		my %item = %$itemref;
		
		my @line;
		
		$line[1] = $item{order_number};
		$line[2] = $line_item++;
		$line[3] = $item{sku};
		$line[4] = $item{quantity};
		$line[5] = '0.00';  # was sprintf '%0.2f', $item{price_per}, but fulfillment
							# will choke if we have item costs but no total charge
		$line[6] = '0.00'; # special shipping cost
		$line[7] = ''; # ship separately
		$line[8] = ''; # apply to first order
		$line[9] = ''; # filler
		$line[10] = ''; # filler
		$line[11] = ''; # filler
		$line[12] = ''; # filler
		$line[13] = ''; # filler
		$line[14] = ''; # filler
		$line[15] = ''; # filler
	
		if ($csv->combine (@line[1..$#line]))
		{
			print $df $csv->string, "\n";
		}
		else
		{
			die "Error generating CSV line for order number ", $order_num, ", sku ", $item{sku};
		}
		
		$rc++;
	}
	
	$o_sth->finish;
}

if ($csv->combine ('TRAILER RECORD', $detailfile, 
	$now->ymd(''), $now->hms(''), 
	$rc + 1, sprintf ('%05d', $serial)))
{
	print $df $csv->string(), "\n";
}
else
{
	die "Error generating trailer record for detail file"
}

close $df;

my $oupd_sth = $dbh->prepare (q(
	update example_store_order 
		set sent_to_fulfillment = now()
		where order_number = ?));
		
foreach my $order_num (@orders)
{
	$oupd_sth->execute($order_num);
}

$oupd_sth->finish;

$dbh->disconnect;
