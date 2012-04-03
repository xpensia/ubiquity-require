// ubiquity-require/client/core.js
var util = require('util');

var window = {};
(function(win) {
  win = win || {};
  //var pathReg = /^[a-z0-9\/. _-]+$/i;
  var nativeModules = {};
  
  function Module() {
    this.defined = false; // the module is defined
    this.isReady = false;
    this.isCalled = false;
    this.parents = [];
    this.deps = [];
  }
  
  win.__filename = '';
  win.__dirname = '';
  var define = win.define = function(deps, cb) {
    if(typeof deps == 'function') {
      cb = deps;
      deps = [];
    }
    if(typeof cb != 'function') {
      throw new TypeError('You should pass a callback to define');
    }
    if(typeof deps == 'string') {
      deps = [deps];
    }
    if(!(deps instanceof Array)) {
      throw new TypeError('Dependencies must be specified in an Array');
    }
  };
  
  define.addNative = function(name, cb) {
    nativeModules[name] = cb();
  };
  
})(window);

