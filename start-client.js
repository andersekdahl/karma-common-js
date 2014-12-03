(function () {
'use strict';

var cachedModuleInstances = window.cachedModuleInstances = {};

function startModuleIfNeeded(moduleFilePath) {
  if (!(moduleFilePath in cachedModuleInstances)) {
    startModule(moduleFilePath);
  }
}

function normalizePath(path, relativePath) {
  if (relativePath.split('/').pop().indexOf('.') === -1) {
    relativePath += '.js';
  }

  var dirs = path.split('/');
  dirs.pop();
  var parts = relativePath.split('/');
  var names = [];

  parts.forEach(function (part) {
    if (part === '..') {
      dirs.pop();
    } else if (part !== '.') {
      names.push(part);
    }
  });
  dirs = dirs.concat(names);
  return dirs.join('/');
}

var mockedDependencies = {};
function createRequire(moduleFilePath) {
  var require = function (requiredFilePath, mockDependencies) {
    if (typeof mockDependencies === 'object') {
      Object.keys(mockDependencies).forEach(function (name) {
        var realPath;
        if (window.__cjsModuleAliases && name in window.__cjsModuleAliases) {
          realPath = window.__cjsModuleAliases[name];
        } else {
          realPath = normalizePath(moduleFilePath, name);
        }
        mockedDependencies[realPath] = mockDependencies[name];

        startModuleIfNeeded(realPath);
        Object.keys(cachedModuleInstances[realPath]).forEach(function (property) {
          if (typeof mockedDependencies[realPath] === 'object' && !(property in mockedDependencies[realPath])) {
            if (typeof cachedModuleInstances[realPath] === 'function') {
              mockedDependencies[realPath][property] = cachedModuleInstances[realPath].bind(cachedModuleInstances[realPath]);
            } else {
              mockedDependencies[realPath][property] = cachedModuleInstances[realPath];
            }
          }
        });
      });

      delete cachedModuleInstances[requiredFilePath];
    }

    startModuleIfNeeded(requiredFilePath);

    if (requiredFilePath in mockedDependencies) {
      return mockedDependencies[requiredFilePath];
    }

    var cached = cachedModuleInstances[requiredFilePath];
    if(!cached) {
      throw new Error('Failed to resolve "' + requiredFilePath + '"');
    }

    if (mockDependencies) {
      // If we've cached it, we need to remove it from the
      // cache to avoid having a siutation where someone
      // else requires the module and gets the mocked out version
      delete cachedModuleInstances[requiredFilePath];
      mockedDependencies = {};
    }
    return cached.exports;
  };
  require.cache = cachedModuleInstances;
  return require;
}

function startModule(moduleFilePath) {
  var module = {
    exports: {}
  };

  if (!(moduleFilePath in window.__cjsModules)) {
    return;
  }

  cachedModuleInstances[moduleFilePath] = module;

  var filename = moduleFilePath;
  var dirname = moduleFilePath.split('/');
  dirname.pop();
  dirname = dirname.join('/');

  var process = {
    nextTick: function (fn) {
      setTimeout(fn, 0);
    }
  };

  window.__cjsModules[moduleFilePath].call({},
    createRequire(moduleFilePath),
    module,
    module.exports,
    window,
    filename,
    dirname,
    process
  );
}

Object.keys(window.__cjsModules).forEach(function (filepath) {
  if (window.__cjsModules[filepath].autostart) {
    startModuleIfNeeded(filepath);
  }
});

}());
