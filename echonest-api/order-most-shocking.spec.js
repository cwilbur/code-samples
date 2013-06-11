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
var Track = require('./order-most-shocking.js').Track;

var makeEchoNestAPIRequest = require('./order-most-shocking.js').makeEchoNestAPIRequest;

function dump(arg) {
    console.log(util.inspect(arg, { showHidden: true }));
}

describe('EchoNest API call function', function(){
    it('should look up a spotify track', function(done){
        makeEchoNestAPIRequest( 'song/profile',
            { id: 'spotify-WW:track:5MyNjrNnDnHmivN6dYPV91' },
            function (err, result) { dump(result); }
        );
    });

    it('should look up a track by artist/name', function(done){
        makeEchoNestAPIRequest( 'song/search',
            { artist: 'The National', title: 'Vanderlyle Crybaby Geeks' },
            function (err, result) { dump(result); }
        );
    });
});


