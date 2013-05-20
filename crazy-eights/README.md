How to Play Crazy Eights 
========================

Use a standard deck of cards; shuffle and deal 8 cards to
each player, then set the deck in the center as a draw pile
and turn over the top card so all can see it.  The player to
the left of the dealer begins.

On your turn, you may play a card that matches the rank or
suit of the last played card, or you may play an 8, which is
wild.  If you play an 8, you declare the suit that the next
player must play.  If you cannot match the rank or suit of
the last card played or play an 8, you must draw cards one
at a time until you can.  You may always draw a card.  Once
you have played a card, play passes to the left.

The goal is to be the first player to have no cards in your
hand.


Background & Road Map 
=====================

Early on when I wanted to demonstrate how quickly I could
learn node.js, I picked a simple problem that would let me
demonstrate basic OO in Javascript and write a web service,
both server and client.  So I chose the game of Crazy Eights
-- a card game with very little strategy.  And I planned to
build out some components:

  * Reusable card and deck libraries, to demonstrate
  	Javascript OO best practices;

  * Automated tests, to demonstrate good software
  	engineering practices;

  * A web services server that moderates games of Crazy
  	Eights, to demonstrate node.js and web services;

  * A web services client that uses rudimentary AI
  	(artificial stupidity?) to play Crazy Eights, to
  	demonstrate node.js and web clients;

  * A web services client written entirely in client-side
  	Javascript that allows a human to play Crazy
  	Eights, to demonstrate client-side JS and one of
  	the browser MVC frameworks (most likely
  	Backbone.js); and
  	
  * An iOS client that allows a human to play Crazy Eights
	using the web service, to demonstrate basic iOS
	programming and web services under iOS.
	
My mission was accomplished earlier than I expected; when I
published the first four components to github, I got an
offer shortly thereafter, and since then I've been working
on other projects.

However, I've returned to this project, with an eye to
improving it based on what I've learned since and what I
want to try next.  So the next phase of the project has
begun.  Here are the things I'm working on next:

  * Tests in a more standard framework, like Mocha.  I
  	was flying by the seat of my pants when I started
  	the code, and so I rolled my own tests.  
  
  * Analytics and reporting: Crazy Eights is a really
  	simple game, and there's not a lot of strategy, so
  	I'm not sure I can come up with *meaningful*
  	analytics.  However, if I can stick data in Mongo,
  	crunch it, slice and dice it, and turn it into
  	graphs, this mission will be accomplished.
  
  * A graphical web services client in Backbone.js.  I
  	want people to be able to play this game a lot so
  	that I have data to crunch.  Also, demonstrating
  	ability with a client-side Javascript MVC framework
  	was one of the original goals.
  	
  * An iOS client, because integrating web services and
   	mobile software was part of my original goal. 

  * Getting the whole thing running in the cloud
   	somewhere, probably Amazon Web Services.  If
   	nothing else, I have a few pie-in-the-sky ideas
   	that this might help to crystallize.
   	
Watch this space for more developments.  

