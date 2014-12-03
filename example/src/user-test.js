describe('user', function () {
  it('should return a name', function () {
    var user = require('./user');
    expect(user().name).to.equal('Anders');
  });

  it('should have a template', function () {
    var user = require('./user.html');
    expect(user).to.equal('<p>This is HTML!</p>');
  });

  it('should be possible to override a require', function () {
    var user = require('./user', {
      './backend': {
        getName: function () {
          return 'Sredna';
        }
      }
    });
    expect(user().name).to.equal('Sredna');
  });
});