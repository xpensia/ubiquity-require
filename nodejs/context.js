
var Domain = require('domain');

function Context() {
    Domain.call(this);
    this._data = {};
}

module.exports = Context;

Context.prototype = new Domain();

Context.prototype.extend = function() {
    var ctx = new Context();
    ctx._parent = this;
};

Context.prototype.on = function() {
    if(ctx._parent) {
        ctx._parent.on.apply(ctx._parent, arguments);
    }
    return Domain.prototype.on.apply(this, arguments);
};

Context.prototype.once = function() {
    if(ctx._parent) {
        ctx._parent.once.apply(ctx._parent, arguments);
    }
    return Domain.prototype.once.apply(this, arguments);
}

Context.prototype.addListener = function() {
    if(ctx._parent) {
        ctx._parent.addListener.apply(ctx._parent, arguments);
    }
    return Domain.prototype.addListener.apply(this, arguments);
};

Context.prototype.removeListener = function() {
    if(ctx._parent) {
        ctx._parent.removeListener.apply(ctx._parent, arguments);
    }
    return Domain.prototype.removeListener.apply(this, arguments);
};

Context.prototype.listeners = function() {
    var ret;
    if(ctx._parent) {
        ret = ctx._parent.listeners.apply(ctx._parent, arguments);
    }
    else {
        ret = [];
    }
    return ret.concat(Domain.prototype.listeners.apply(this, arguments));
};

Context.prototype.get = function(name) {
    if(typeof this._data[name] != 'undefined') {
        return this._data[name];
    }
    return (this._parent && this._parent.get(name));
};

Context.prototype.set = function(name, value) {
    if(typeof this._data[name] != 'undefined') {
        // 'reload:@vars', oldValue, newValue
        this.emit('reload:'+name, this._data[name], value);
    }
    this.emit(name, value);
};

Context.default = new Context();
