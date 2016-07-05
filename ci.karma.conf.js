/*jshint node:true */
// This config is used for ci system
var defaultConfig = require('./default.karma.conf.js');
var _ = require('lodash');
module.exports = function(config) {
    config.set(_.merge(defaultConfig, {

        singleRun: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        preprocessors: {
              'build/*.js': ['coverage'],
        },

        reporters: ['dots', 'junit', 'coverage'],

        coverageReporter: {
              type : 'cobertura',
              dir : 'test-reports/coverage/'
        },

        browsers: ['PhantomJS'],

        junitReporter: {
              outputFile: 'test-reports/test-results.xml'
        },
    }));
};
