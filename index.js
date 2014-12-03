'use strict';

var path = require('path');
var fs = require('fs');
var resolve = require('resolve');
var minimatch = require('minimatch');
var browserBuiltins = require('browser-builtins');

var startClientFile = path.normalize(__dirname + '/start-client.js');

function framework(files) {
  files.push({
    pattern: startClientFile,
    included: true,
    served: true,
    watched: false
  });
}

function createPreprocessor(config, basePath, logger) {
  var log = logger.create('preprocessor.common_js');
  var seenNpmFiles = [];
  var npmFilesPerModule = {};
  var transforms = config.transforms || {};
  var autostartPatterns = config.autoRequire || ['**/*.js'];

  function shouldAutoStart(filepath) {
    for (var i = 0; i < autostartPatterns.length; i++) {
        if (minimatch(filepath, autostartPatterns[i])) {
            return true;
        }
    }
    return false;
  }

  function process(content, file, done) {
    log.debug('Processing "%s"', file.originalPath);
    // operations contains the number of files to process that
    // this scope is currently waiting for. If it's 0 at the end
    // of the scope it means we don't have to wait, and we can call
    // `done()`
    var operations = 0;

    var filePath = path.dirname(file.originalPath);
    var wrappedContent = '';

    var aliases = '';

    var wrapperHead =
      'window.__cjsModules = window.__cjsModules || {};' +
      'window.__cjsModules["' + file.originalPath + '"] = ' +
        'function (require, module, exports, global, __filename, __dirname, process) {';
    var wrapperFoot = '};window.__cjsModules["' + file.originalPath + '"].autostart = ' + shouldAutoStart(file.originalPath);

    // If the file is something other than a .js file, we have
    // to add .js to make Karma serve it as a js file.
    // This is for things like transforming an .html file
    // to a CommonJS module.
    if (file.path.indexOf('.js') !== file.path.length - 3) {
      file.path = file.path + '.js';
    }

    // If a file was reloaded that contained one or more
    // modules from node_modules, we have to make sure
    // that we reload them as well by removing them from
    // seenNpmFiles
    if (npmFilesPerModule[file.originalPath]) {
      npmFilesPerModule[file.originalPath].forEach(function (npmModulePath) {
        seenNpmFiles.splice(seenNpmFiles.indexOf(npmModulePath), 1);
      });
    }

    function replaceModuleName(match, moduleName) {
      var modulePath;
      try {
        if (moduleName.charAt(0) === '.') {
          modulePath = require.resolve(path.resolve(filePath, moduleName));
        } else {
          if (moduleName in browserBuiltins) {
            modulePath = browserBuiltins[moduleName];
          } else {
            var opts = {
              basedir: filePath,
              packageFilter: function (info) {
                if (typeof info.browserify === 'string' && !info.browser) {
                  info.browser = info.browserify;
                }

                if (!info.browser) {
                  return info;
                }
                // replace main
                if (typeof info.browser === 'string') {
                  info.main = info.browser;
                  return info;
                }
                var replace_main = info.browser[info.main || './index.js'] || info.browser['./' + info.main || './index.js'];
                info.main = replace_main || info.main;
                return info;
              }
            };
            modulePath = resolve.sync(moduleName, opts);

            // In the client we need to be able to map the npm name to
            // the absolute path, since we allow stubbing out modules.
            // So when you say you want to stub out 'jquery' in the client
            // we need to know the physical path to the jquery file.
            aliases +=
              'window.__cjsModuleAliases = window.__cjsModuleAliases || {};' +
              'window.__cjsModuleAliases["' + moduleName + '"] = "' + modulePath + '";';
          }
        }
        log.debug('Replacing require "%s" with "%s"', moduleName, modulePath);
      } catch (e) {
        log.error('Failed to resolve "%s" in %s', moduleName, file.originalPath);
        throw e;
      }

      // Since you don't want to specify your npm modules in karma.conf.js, we check
      // for a node_modules folder in it's path. If we see it, it means that
      // we have to call `process()` on in because Karma won't call `process()` for
      // us with that file.
      // This means that if `my-module.js` requires `jquery` from node_modules,
      // we'll append the contents of `jquery` in `my-module.js` when karma serves it.
      // This has the unfortunate behaviour that any error in jquery.js will be seen
      // as the error occured in `my-module.js`, but there's not a lot to be about that.
      // At least you get the correct line numbers for errors in `my-module.js`.
      if (modulePath.indexOf('/node_modules/') !== -1 && seenNpmFiles.indexOf(modulePath) === -1) {
        operations++;

        seenNpmFiles.push(modulePath);
        if (!npmFilesPerModule[file.originalPath]) {
          npmFilesPerModule[file.originalPath] = [];
        }
        npmFilesPerModule[file.originalPath].push(modulePath);

        fs.readFile(modulePath, function (err, npmFileContent) {
          if (err) {
            log.error('Cannot read "%s"', modulePath);
            return;
          }

          process(npmFileContent.toString(), {originalPath: modulePath, path: modulePath}, function (npmContent) {
            operations--;
            wrappedContent += '\n' + npmContent;
            if (!operations) {
              log.debug('Done processing "%s"', file.originalPath);
              done(wrappedContent);
            }
          });
        });
      }
      return match.replace(moduleName, modulePath);
    }

    var processedContent = content;

    // Allow Browserify streams to process the file first
    Object.keys(transforms).forEach(function (transformName) {
      var transformer = require(transformName);
      var stream = transformer(file.originalPath);

      stream.on('data', function (d) {
        processedContent = d;
      });
      stream.write(processedContent);
      stream.end();
    });

    processedContent = processedContent.replace(/require\(["']([^\)]+)["'][,\)]/mg, replaceModuleName);

    wrappedContent = aliases + wrapperHead + processedContent + wrapperFoot;

    if (!operations) {
      log.debug('Done processing "%s"', file.originalPath);
      done(wrappedContent);
    }
  }

  return process;
}

framework.$inject = ['config.files'];
createPreprocessor.$inject = ['config.common_js', 'config.basePath', 'logger'];

module.exports = {
  'framework:common_js': ['factory', framework],
  'preprocessor:common_js': ['factory', createPreprocessor]
};
