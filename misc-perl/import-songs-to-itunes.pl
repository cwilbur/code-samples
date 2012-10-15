#!/usr/bin/perl

use strict;
use warnings;

use File::Find;

# die "No home directory in \$HOME"
#     unless exists $ENV{HOME} && defined $ENV{HOME};

# my $dir = $ENV{HOME} . '/Music Drop/';
my $filebatch = 100;
my $batchdelay = 60; 

my @files; 

sub wanted
{
    if (/\.mp3$/ || /\.m4[abp]$/)
    {
	push @files, $File::Find::name;
	print $File::Find::name . "\n";
    }

    if (@files == $filebatch)
    {
	system "/usr/bin/open", @files;
	@files = ();
	print "--batch--\n";
	system "osascript", "-e", "tell application \"iTunes\" to pause";
	sleep $batchdelay;
    }
}

find (\&wanted, '/Volumes/example/', '/Users/example/iTunes Music/');

system "/usr/bin/open", @files
    if @files > 0;

system "osascript", "-e", "tell application \"iTunes\" to pause";

