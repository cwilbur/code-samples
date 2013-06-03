/**********************************************************************
 *
 * order-most-shocking.js
 *
 * A utility to use the Echo Nest API to order songs in a
 * given playlist in a way that maximizes the difference
 * between adjacent songs.
 *
 * To prepare:  select all the songs in a Spotify playlist
 * and drag them to a text editor window.  This will create a
 * list that looks like the 'spotify-in.txt' file in this
 * repository: spotify track links, one per line. 
 * 
 * To invoke: node order-most-shocking.js input-filename output-filename
 * 
 * To see results: select all the lines in the output file and
 * drag them to a new Spotify playlist. 
 *
 * Copyright 2013 Charlton Wilbur, warts, bugs, and all.
 * 
 * Licensed under a Creative Commons Attribution 3.0
 * Unported License and the BSD 3-clause license; see
 * LICENSE.md in the root directory of this repository for
 * more information.
 * 
 **********************************************************************/

'use strict';
var util = require('util');
var fs = require('fs');
var events = require('events');
var qs = require('querystring');

var request = require('request');

// configuration

var echoNestUrl = 'http://developer.echonest.com/api/v4/';
var echoNestApiKey = '';

function makeEchoNestAPIRequest (call, params, cb) {
    var url = echoNestUrl + call;
    var callParams = Object.create(params);
    callParams.api_key = echoNestApiKey;
    callParams.format = 'json';

    url += qs.serialize(callParams);

    request(url, function (error, response, body){
        if (error) {
            throw new Error('request error! ' + util.inspect(error));
        } else if (response.statusCode !== 200) {
            throw new Error('the API is unhappy with us (' + response.statusCode + ') - ' + body);
        }
        else {
            var result = JSON.parse(body);
            cb(null, result);
        }
    });
}


// this whole thing is event-driven (duh, it's node)
// each line in the input stream is a Track
// Track is an EventEmitter because that's how we coordinate execution
// also, we divide execution up into small logical chunks 

function Track(line) {
    var self = this;
   
    this.inputLine = line;
    
    if (Track.tracksIn === undefined) {
        Track.tracksIn = 0;
        Track.tracksOut = 0;
        Track.foundTracks = {};
        Track.startingTrack = undefined;
        Track.distances = {};
    }
    
    this.serial = Track.tracksIn++;

    if (require.main === module) {
        // only set up the event chain if we're the primary file,
        // i.e., we're not being unit-tested

        this.on('lineAccepted', function() { self.parseLine(); });
        this.on('lineParsed', function() { self.lookUp(); });
        this.on('trackFound', function() { self.analyze(); });
        this.on('trackAnalyzed', function() { self.finish(); });

        this.on('trackNotFound', function () { self.alertTrackNotFound(); });
        this.on('notFoundAlerted', function() { self.finish(); });

        this.emit('lineAccepted');
    }

    return this;
}

util.inherits(Track, events.EventEmitter);


Track.prototype.parseLine = function() {
    var decodedLine = qs.unescape(this.inputLine.replace(/\+/g, '%20'));
    var fields = decodedLine.split(/\/+/);

    if (fields[2] === 'track') {
        this.sourceType = 'spotify';
        this.spotifyTrackId = fields[3];
    } else if (fields[2] === 'local') {
        this.sourceType = 'local';
        this.trackInfo = { artist: fields[3],
            album: fields[4],
            track: fields[5]
        };
    }  else {
        throw new Error('Dunno what kind of track this is, boss.');
    }

    this.emit('lineParsed');
    return this;
};

Track.prototype.lookUp = function () {
    // when this is over, we should have an EchoNest song ID

    var self = this;

    if (this.sourceType === 'spotify') {
        makeEchoNestAPIRequest( 'song/profile',
            { id: 'spotify-WW:track:' + this.spotifyTrackId },
            function (err, result) {
                if (result.response.status.code === 0) {
                    self.echoNestSongId = result.songs.id;
                    self.emit('trackFound');
                }
                else {
                    self.emit('trackNotFound');
                }
            }
        );
    } else if (this.sourceType === 'local') {
        makeEchoNestAPIRequest( 'song/search',
            { artist: this.artist, title: this.track },
            function (err, result) {
            }
        );

    } else {
        // we don't know how to look this up
        self.emit('trackNotFound');
    }
};

Track.prototype.analyze = function() {
    this.emit('trackAnalyzed');
};

Track.prototype.finish = function() {
};

Track.prototype.alertTrackNotFound = function() {
    this.emit('notFoundAlerted');
};

module.exports = Track;






