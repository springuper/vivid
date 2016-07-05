/*jshint node:true */
// This config is used for development
var defaultConfig = require('./default.karma.conf');
console.log('hello');
var _ = require('lodash');
module.exports = function(config) {
    config.set(_.merge(defaultConfig, {
        browsers: ['Chrome'],
        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO
    }));
};
