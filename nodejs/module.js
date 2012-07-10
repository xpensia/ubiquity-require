
var path = require('path'),
    vm = require('vm'),
    fs = require('fs');

// don't be afraid of this undocumented module module
var Module = require('module');

var EventEmitter = require('events').EventEmitter;

var _data = {};
var evBus = new EventEmitter();
module.exports = evBus;

var loading = {};

function DefineBlock(module, dependencies, callback) {
    this.params = new Array(dependencies.length);
    this.remain = dependencies.length;
    this.module = module;
    this.callback = callback;

    this.ev = new EventEmitter();

    for(var i=0; i<dependencies.length; i++) {
        var dep = dependencies[i];
        var pos, match;
        if(dep[0] == '@') {
            evBus.emit('requestVar', dep);
            if(typeof _data[dep] != 'undefined') {
                this.params[i] = _data[dep];
                this.remain--;
            }
            else {
                evBus.once(dep, this.receiveData.bind(this, i, dep));
            }
        }
        else {
            var file = Module._resolveFilename(dep, module);
            evBus.emit('requestModule', file);
            this.params[i] = module.require(file);
            if(this.params[i]) {
                this.remain--;
            }
            else {
                var mod = Module._cache[file];
                mod.ev.once('loaded', this.receiveData.bind(this, i, file));
            }
        }
    }

    if(this.remain <= 0) {
        process.nextTick(this.call.bind(this));
    }
}
DefineBlock.prototype = {
    receiveData: function(i, name, data) {
        this.params[i] = data;
        if(--this.remain <= 0) {
            this.call();
        }
    },
    call: function() {
        this.module.exports = this.callback.apply(this.module, this.params) || {};
        this.module.ev.emit('loaded', this.module.exports);
        if(this.module.defined) {
            console.warn('WARNING : Multiple define blocks in', this.module.filename);
        }
        else {
            this.module.defined = true;
        }
    }
};

Module.prototype.define = function(dependencies, callback) {
    if(typeof dependencies == 'function') {
        callback = dependencies;
        dependencies = [];
    }
    if(typeof dependencies == 'string') {
        dependencies = [dependencies];
    }
    if(typeof callback != 'function') {
        throw new TypeError("You must pass a callback to define");
    }
    this.exports = undefined;
    new DefineBlock(this, dependencies, callback);
};

Module.prototype.provide = function(name, data) {
    if(name[0] != '@') {
        name = '@'+name;
    }
    if(typeof data == 'undefined') {
        throw new TypeError("Can't provide `undefined` data.");
    }
    _data[name] = data;
    evBus.emit(name, data);
};

// REPL support ! :D
function rootModule(module) {
    while(module.parent) {
        module = module.parent;
    }
    return module;
}

require.extensions['.js'] = function(module, filename) {
    module.defined = false;
    module.ev = new EventEmitter();

    var content = fs.readFileSync(filename, 'utf8');
    // strip utf8 BOM, SEE https://github.com/joyent/node/blob/master/lib/module.js#L450
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    content = content.replace(/^\#\!.*/, '');

    var _require = module.require.bind(module);

    _require.resolve = function(request) {
        return Module._resolveFilename(request, module);
    };
    _require.main = process.mainModule?process.mainModule:rootModule(module);
    _require.extensions = Module._extensions;
    _require.cache = Module._cache;

    var p = path.dirname(_require.main.filename),
        file = path.relative(p, filename),
        ctx = {};
    for (var k in global) {
        ctx[k] = global[k];
    }
    ctx.define = module.define.bind(module);
    ctx.require = _require;
    ctx.__filename = filename;
    ctx.__dirname = path.dirname(filename);
    ctx.module = module;
    ctx.exports = module.exports;

    vm.runInNewContext(content, ctx, file);
};
