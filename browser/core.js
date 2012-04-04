// ubiquity-require/browser/core.js

if ( !Array.prototype.forEach ) {
  Array.prototype.forEach = function( callback, thisArg ) {
    var T, k;
    if ( this == null ) {
      throw new TypeError( " this is null or not defined" );
    }
    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);
    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0; // Hack to convert O.length to a UInt32
    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if ( {}.toString.call(callback) != "[object Function]" ) {
      throw new TypeError( callback + " is not a function" );
    }
    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if ( thisArg ) {
      T = thisArg;
    }
    // 6. Let k be 0
    k = 0;
    // 7. Repeat, while k < len
    while( k < len ) {
      var kValue;
      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if ( k in O ) {
        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[ k ];
        // ii. Call the Call internal method of callback with T as the this value and
        // argument list containing kValue, k, and O.
        callback.call( T, kValue, k, O );
      }
      // d. Increase k by 1.
      k++;
    }
    // 8. return undefined
  };
}

(function(win) {
  //var pathReg = /^[a-z0-9\/. _-]+$/i;
  var natives = {
    'window':win
    };
  
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
    var Module = define.getNative('module');
    var mod = new Module();
    mod.filename = win.__filename;
    mod.callback = cb;
    mod.setDependencies(deps);
    mod.load();
  };
  
  define.cache = {};
  define.model = 'ubiquity-require';
  define.addNative = function(name, cb) {
    natives[name] = cb();
  };
  define.getNative = function(name) {
    if(!natives[name])
      throw Error('Native module '+name+' not found');
    return natives[name];
  };
  define.isNative = function(name) {
    return !!natives[name];
  };
  define.exec = function(module) {
    win.__filename = module.filename;
    win.__dirname = define.getNative('path').dirname(module.filename);
    module.exec();
    win.__filename = '';
    win.__dirname = '';
  };
  
})(window);

