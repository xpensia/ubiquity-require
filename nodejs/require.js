var path = require('path'),
    vm = require('vm'),
    fs = require('fs');

// don't be afraid of this undocumented module module
var Module = require('module');

var arequire = function(deps, cb) {
  // fallback
  if(typeof arguments[0] == 'string' && arguments.length == 0) {
    return Module._load(arguments[0], this);
  }
  if(!cb && typeof deps == 'function') {
    cb = deps;
    deps = [];
  }
  if(typeof deps == 'string')
    deps = [deps];
  if(!cb)
    throw Error('You MUST pass a callback to define.');
  var mods = [];
  for(var i=0,l=deps.length;i<l;i++) {
    mods.push(Module._load(deps[i], this));
  }
  return cb.apply(module, mods);
};


require.extensions['.js'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  // strip utf8 BOM, SEE https://github.com/joyent/node/blob/master/lib/module.js#L450
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  content = content.replace(/^\#\!.*/, '');
  
  function _require() {
    return arequire.apply(module, arguments);
  }
  _require.resolve = function(request) {
    return Module._resolveFilename(request, module);
  };
  _require.main = process.mainModule;
  _require.extensions = Module._extensions;
  _require.cache = Module._cache;
  
  var p = path.dirname(require.main.filename),
    file = (filename.indexOf(p) == 1)?filename.substr(p.length):filename,
    ctx = {};
  for (var k in global) {
    ctx[k] = global[k];
  }
  ctx.define = function(deps, cb) {
      module.exports = _require(deps, cb);
    };
  ctx.asyncRequire = true;
  ctx.require = _require;
  ctx.__filename = file;
  ctx.__dirname = path.dirname(file);
  ctx.module = module;
  ctx.exports = module.exports;
  
  vm.runInNewContext(content, ctx, file);
};
