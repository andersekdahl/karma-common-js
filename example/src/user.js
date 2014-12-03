var backend = require('./backend');

module.exports = function () {
  return {
    name: backend.getName()
  };
};