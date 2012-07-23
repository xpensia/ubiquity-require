
var path = require('path'),
    vm = require('vm'),
    fs = require('fs');

// don't be afraid of this undocumented module module
var Module = module.exports = require('module');

var EventEmitter = require('events').EventEmitter;

var Context = require('./context.js');

function DefineBlock(module, dependencies, callback) {
    this.params = new Array(dependencies.length);
    this.remain = dependencies.length;
    this.module = module;
    this.callback = callback;
    this.listeners = [];

    for(var i=0; i<dependencies.length; i++) {
        var dep = dependencies[i];
        var pos, match;
        if(dep[0] == '@') {
            var data = this.module.ctx.get(dep);
            if(typeof data != 'undefined') {
                this.params[i] = data;
                this.remain--;
            }
            if(this.listeners.indexOf(dep) != -1) {
                this.listeners.push(dep);
            }
            var cb = this.receiveData.bind(this, i, dep);
            cb.source = this;
            this.listeners.push(cb);
            this.module.ctx.on(dep, cb);
        }
        else {
            var file = Module._resolveFilename(dep, module);
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
        this.module.ctx.emit('defined:'+this.module.filename, this.module.exports);
        this.module.defined = true;
    },
    clean: function() {
        
    }
};

Module.prototype.extend = function() {
    this.defined = false;
    this.ctx = (this.parent && this.parent.ctx) || Context.default;

    var self = this;
    var ctx = this._globals = {};
    var _require = this.require.bind(this);

    _require.resolve = function(request) {
        return Module._resolveFilename(request, self);
    };
    _require.main = process.mainModule?process.mainModule:rootModule(this);
    _require.extensions = Module._extensions;
    _require.cache = Module._cache;

    for (var k in global) {
        ctx[k] = global[k];
    }
    ctx.define = this.define.bind(this);
    ctx.require = _require;
    ctx.__filename = this.filename;
    ctx.__dirname = path.dirname(this.filename);
    ctx.module = this;
    ctx.exports = this.exports;
};

Module.prototype.copy = function(ctx) {
    var module = new Module();
    for(var k in this) {
        if(this.hasOwnProperty(k)) {
            module[k] = this[k];
        }
    }
    if(ctx) {
        module.use(ctx);
    }
    return module;
};

Module.prototype.reload = function() {
    if(this.blocks && this.blocks.length) {
        for(var i=0; i<this.blocks.length; i++) {
            this.blocks[i].clean();
        }
    }
    this.blocks = [];

    var content = fs.readFileSync(this.filename, 'utf8');
    // strip utf8 BOM, SEE https://github.com/joyent/node/blob/master/lib/module.js#L450
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    content = content.replace(/^\#\!.*/, '');

    var p = path.dirname(this._globals.require.main.filename),
        file = path.relative(p, this.filename);
    vm.runInNewContext(content, this._globals, file);
    if(this.blocks.length > 1) {
        console.warn('WARNING : Multiple define blocks in', this.module.filename);
    }
    this.ctx.emit('loaded', this.filename);
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
    this.blocks.push(new DefineBlock(this, dependencies, callback));
};

Module.prototype.provide = function(name, data) {
    if(name[0] != '@') {
        name = '@'+name;
    }
    if(typeof data == 'undefined') {
        throw new TypeError("Can't provide `undefined` data.");
    }
    this.ctx.set(name, data);
};

// REPL support ! :D
function rootModule(module) {
    while(module.parent) {
        module = module.parent;
    }
    return module;
}

require.extensions['.js'] = function(module, filename) {
    module.extend();
    module.ctx.emit('required', filename);
    module.reload();
};
