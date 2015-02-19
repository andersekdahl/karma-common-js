# Changelog

## v0.1.2

### Fixes
* No longer try to rewrite `require` calls inside comments (this made it break with React)
* Add a line break in the last line of the wrapped module (this broke if the last line of a module was a comment)
* Add `process.env` as an empty object
