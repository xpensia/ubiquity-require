
var path = require('path'),
    vm = require('vm'),
    fs = require('fs');

// don't be afraid of this undocumented module module
var Module = require('module');

var EventEmitter = require('events').EventEmitter;

var _data = {};
var evBus = new EventEmitter();
module.exports = evBus;

function DefineBlock(module, dependencies, callback) {
    this.params = new Array(dependencies.length);
    this.remain = dependencies.length;
    this.module = module;
    this.callback = callback;

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
                evBus.once(dep, this.receiveData.bind(this, i));
            }
        }
        else {
            evBus.emit('requestModule', dep);
            this.params[i] = module.require(dep);
            this.remain--;
        }
    }

    if(this.remain <= 0) {
        this.call();
    }
}
DefineBlock.prototype = {
    receiveData: function(i, data) {
        this.params[i] = data;
        if(--this.remain <= 0) {
            this.call();
        }
    },
    call: function() {
        var res = this.callback.apply(this.module, this.params);
        if(res) {
            this.module.exports = res;
            if(this.defined) {
                console.warn('Multiple define block with return value in', this.module.filename);
            }
            else {
                this.defined = true;
            }
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

require.extensions['.js'] = function(module, filename) {
    module.defined = false;
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
    _require.main = process.mainModule;
    _require.extensions = Module._extensions;
    _require.cache = Module._cache;

    var p = path.dirname(require.main.filename),
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
