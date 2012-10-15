#!/usr/bin/perl

use warnings;
use strict;

use File::Copy;

my $base = '/Users/Shared/Music';
my $relocate = '/Users/Shared/Music-Disabled';

my @directories = ($base);
my %results;

while (@directories)
{
    my $thisDir = shift @directories;
    next if $thisDir =~ /^[.]+$/;

    unless (opendir DH, "$thisDir")
    {
	warn ("Can't open directory $thisDir - $!");
	next;
    }

    my @dirEntries = readdir DH;
    
    closedir DH;

    foreach (@dirEntries)
    {
	next if /^[.]/;
	push @directories, "$thisDir/$_"
	    if -d "$thisDir/$_";
	
	if ((/^(.*) \d\.(mp3|m4[abp])$/)
	    && -e "$thisDir/$1.$2")
	{
	    print "$thisDir / $_ - $1 - $2\n";
	    push @{$results{"$thisDir/$1.$2"}}, 
	    "$thisDir/$_", "$thisDir/$1.$2";
	}
    }
}

print "duplicates found: " . scalar keys %results;

foreach my $dest (keys %results)
{
    my $bestpick;;
    my $bestts = 0;

    foreach my $candidate (@{$results{$dest}})
    {
	my $backup = $candidate;
	$backup =~ s/Music/Music-Disabled/;
	print "copy $candidate -> $backup\n";
	copy $candidate, $backup;

	my $thists = (stat $candidate)[9];

	if (($bestts == 0) || ($thists > $bestts))
	{
		$bestts = $thists;
		$bestpick = $candidate;
	}
    }

    print "$dest:\n";
    foreach my $candidate (@{$results{$dest}})
    {
	print " -> "
	    if ($candidate eq $bestpick);
	print "    "
	    if ($candidate ne $bestpick);
	print "$candidate\n";

	unlink $candidate
	    if $candidate ne $bestpick;
    }

    move $bestpick, $dest;
}
