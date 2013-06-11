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

var async = require('async');
var enLib = require('echonest');

var echoNest = new enLib.Echonest({
    api_key: 'X5LEA48CWM6QSHRJH'
});

var trackInfo = {};

async.series([
    function(cb){
        // read in the playlist

        var lineNum = 1;

        fs.readFile(inFilename, { encoding: 'utf-8' }, function (err, data) {
            if (err) {
                cb(err);
            } else {
                data.split(/\r?\n/).forEach(function (thisLine) {
                    trackInfo[lineNum] = {
                        rawLine: thisLine.trim();
                });
            }

            cb();
        })

    },
    function(cb){
        // okay, we're in node, and we've invoked async
        // we might as well make things interesting







    },
    function(cb){

    }
], function(err, results){});

