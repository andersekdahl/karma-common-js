'use strict';

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'common_js'],
    files: [
      'src/**/!(*-test).js',
      'src/**/*-test.js',
      'src/**/*.html'
    ],
    preprocessors: {
      'src/**/!(*-test).js': ['common_js'],
      'src/**/*-test.js': ['common_js'],
      'src/**/*.html': ['common_js']
    },
    common_js: {
      transforms: {
        'html-browserify': true
      },
      autoRequire: [
        '**/src/**/*-test.js'
      ]
    },
    reporters: ['dots'],
    port: 9876,
    colors: true,
    autoWatch: true,
    browsers: ['Firefox'],
    singleRun: false,
    browserDisconnectTimeout: 20000,
    browserNoActivityTimeout: 20000
  });
};