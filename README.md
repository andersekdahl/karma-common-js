karma-common-js
===============

Test CommonJS modules without using Browserify

What's the point of creating yet another karma preprocessor for CommonJS modules? Because it scratched an itch, and because I think there's a need for a preprocessor which doesn't use Browserify, but exposes the feature set of Browserify like requiring Node built-in modules and respecting the `browser` field of `package.json` in modules.

# How does it work?
Instead of using Browserify to build a bundle (which takes way too long) this preprocessor finds all require statements in your code and rewrites them to absolute paths. If you require something from `node_modules`, that path gets rewritten to the correct path as well (and it respects the `browser` field in that packages `package.json`).

It takes all code inside your js files and wrap it in functions which gets the Common JS variables passed in like `module`, `global`, etc. So when the code runs, the require function looks up that created function for the correct path, and invokes it if it hasn't been invoked before.

# Why should I use this instead of the others?
I'm not saying that this preprocessor is better than the others, but has a few features that others are missing. Such as:

* You can pass in a second argument to `require` with mocks. More on that further down.
* Even though it doesn't use Browserify, you can specify Browserify transforms to use like https://www.npmjs.org/package/html-browserify.
* `require.cache` is exposed (http://nodejs.org/api/globals.html#globals_require_cache) which means you can remove a module instance from the cache. Meaning that it will get reloaded the next time you require it which is very useful for testing.
* Node built-ins like `process`, `__filename`, etc are available, and it's possible to require built-in Node modules like `buffer` and `events` which uses the same shims as Browserify.
* If a test throws an error, the line number and file name in the stack trace is correct and not some bogus line from a bundle file. Note that this does not depend on source maps, which means that it works in PhantomJS as well. Unless you use `karma-coverage` as well, which messes with the line numbers.
* It works with `karma-coverage`.

# Mocks
In your tests you often want to override which modules gets passed in to the module you want to test. Let's say I have a module `store` and a module `greeter` like this:

```
// store.js
module.exports = {
  currentUser: function () {
    // Time consuming stuff to get the current user here
  }
};
```

```
// greeter.js
var store = require('./store');

module.exports = function () {
  return 'Hi ' + store.currentUser().name '!';
};
```

To test `greeter.js`, you can mock `store.js` like this:
```
// greeter-test.js
var greeter = require('./greeter', {
  './store': {
    currentUser: function () {
      return {name: 'Anders'}
    }
  }
});

expect(greeter()).to.equal('Hi Anders!');
```

# How to use
In your karma config, add `common_js` to the `frameworks` array, and add this to your preprocessors:

```
preprocessors: {
  '**/!(*-test).js': ['coverage', 'common_js'], // Remove coverage if you don't use karma-coverage
  '**/*-test.js': ['common_js'],
  '**/*.html': ['common_js'], // If you want transforms for HTML files
}
```

This section is for configuring the preprocessor:

```
common_js: {
  transforms: {
    'html-browserify': true // If you want it
    'babelify': {
      exclude: '**/node_modules/**' // Don't apply the babelify transform for files in node_modules
    }
  },
  // Array of globs to auto require when the tests run. You can use
  // this to control the entry point for your tests.
  autoRequire: [
    '**/*-test.js'
  ]
},
```
