# Changelog

## v0.2.1

### Fixes
* Replace all instances of `new Buffer()` with `new require('buffer').Buffer()` to make up for not having a global `Buffer` constructor.

## v0.2.0

### Features
* Make it possible to specify patterns to exclude transforms for different files. Useful if you only want to apply transforms on your files and not files in `node_modules`.

## v0.1.3

### Fixes
* Do not replace the variable name in a require statement. With `var module = require('module');` the variable name `module` was replaced since it had the same name as the required module.

## v0.1.2

### Fixes
* No longer try to rewrite `require` calls inside comments (this made it break with React)
* Add a line break in the last line of the wrapped module (this broke if the last line of a module was a comment)
* Add `process.env` as an empty object
