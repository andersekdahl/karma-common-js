# Changelog

## v0.1.3

### Fixes
* Do not replace the variable name in a require statement. With `var module = require('module');` the variable name `module` was replaced since it had the same name as the required module.

## v0.1.2

### Fixes
* No longer try to rewrite `require` calls inside comments (this made it break with React)
* Add a line break in the last line of the wrapped module (this broke if the last line of a module was a comment)
* Add `process.env` as an empty object
