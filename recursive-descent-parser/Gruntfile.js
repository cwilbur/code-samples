'use strict';

// http://ericnish.io/blog/how-to-neatly-separate-grunt-files
// http://www.html5rocks.com/en/tutorials/tooling/supercharging-your-gruntfile/
// discuss how to break up gruntfiles

var path = require('path');
var fs = require('fs');
var util = require('util');

module.exports = function(grunt, options) {

  if (grunt.option('t') || grunt.option('time')) {
    require('time-grunt')(grunt);
  }
  require('load-grunt-config')(grunt);

  // if the user has a .jshintrc file in a recognized place,
  // we'd be boors to ignore it -- plus we get to do
  // unspeakably asynchronous hackish things with grunt.

  if (grunt.task.exists('jshint')) {

    // dynamically update our jshint configuration

    grunt.renameTask('jshint', 'jshint-actual');
    grunt.registerTask('jshint',
      'Update the jshint config based on package.json and .jshintrc files',
      function() {

        var done = this.async();

        if (grunt.config('package.jshintConfig')) {

          grunt.config('jshint.options', grunt.config('package.jshintConfig'));
          return done();

        } else {

          retrieveFileFromClosestDirInPath(path.resolve(), '.jshintrc',
            function(error, fileContents) {
              if (error) {
                return done(error);
              }
              if (fileContents) {
                grunt.config('jshint.options', fileContents);
              }

              grunt.renameTask('jshint', 'jshint-configure');
              grunt.renameTask('jshint-actual', 'jshint');
              grunt.task.run('jshint');

              return done();
            });
        }

      });
  }

};

var retrieveFileFromClosestDirInPath = function(pathName, filename, callback) {
  var pathComponents = pathName.split(path.sep);
  if (pathComponents.length && pathComponents[0] === '') {
    pathComponents[0] = '/';
  }

  (function findRecurseOrFail(pathComponents, filename, callback) {
    if (!(pathComponents && pathComponents.length)) {
      return callback(null, undefined);
    }
    var pathString = path.join.apply(path, pathComponents.concat(filename));
    fs.readFile(pathString, {
      encoding: 'utf-8'
    }, function(error, data) {

      if (error && error.code === 'ENOENT') {
        pathComponents.pop();
        return findRecurseOrFail(pathComponents, filename, callback);
      } else if (error) {
        return callback(error);
      } else {
        try {
          return callback(null, JSON.parse(data));
        } catch (thrownError) {
          return callback(thrownError);
        }
      }
    });
  })(pathComponents, filename, callback);

};
