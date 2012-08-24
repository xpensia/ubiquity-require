
var path = require('path'),
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

Module.wrapper[0] += '\
    var define;\
    if(module.define && !define) {\
        var EventEmitter = require("events").EventEmitter;\
        module.defined = false;\
        module.ev = new EventEmitter();\
        define = module.define.bind(module);\
    }\
';
