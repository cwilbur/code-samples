/**********************************************************************
 *
 * order-most-shocking.spec.js
 *
 * Jasmine unit test suite
 *
 * Copyright 2013 Charlton Wilbur, warts, bugs, and all.
 *
 **********************************************************************/

var util = require('util');
var Track = require('./order-most-shocking.js');

function dump(arg) {
    console.log(util.inspect(arg, { showHidden: true }));
}

describe('Track object', function () {
    it('should accept a line as constructor', function () {
        var inStr = 'http://open.spotify.com/track/6vxvAiZjxMBnq5NVSRyrOV';
        var t = new Track(inStr);
        expect (t.inputLine).toEqual(inStr);
    });

    it('should rectify copypaste weirdness in utf-8', function () {});

    it('should parse spotify track lines correctly', function () {
        var inStr = 'http://open.spotify.com/track/6vxvAiZjxMBnq5NVSRyrOV';
        var t = new Track(inStr);
        t.parseLine();

        expect(t.sourceType).toEqual('spotify');
        expect(t.spotifyTrackId).toBe('6vxvAiZjxMBnq5NVSRyrOV');
    });

    it('should parse local track lines correctly', function () {
        var inStr = 'http://open.spotify.com/local/The+National/High+Violet+%28Expanded+Version%29/Vanderlyle+Crybaby+Geeks/252';
        var t = new Track(inStr);
        t.parseLine();

        expect(t.sourceType).toEqual('local');
        expect(t.trackInfo).toEqual({ artist: 'The National', album: 'High Violet (Expanded Version)', track: 'Vanderlyle Crybaby Geeks'});
    });

    it('should raise an error on unrecognized track types', function () {
        var inStr = 'http://open.spotify.com/fnord/6vxvAiZjxMBnq5NVSRyrOV';
        var t = new Track(inStr);

        expect(function () { t.parseLine(); }).toThrow();
    });

    it('should properly handle local tracks not found', function() {});
});