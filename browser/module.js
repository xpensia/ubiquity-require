// ubiquity-require/browser/module.js

var __moduleDefineModule = function(){
  
  function Module() {
    this.exports = {};
    this.isReady = false;
    this.parents = [];
    this.deps = [];
    this.rdeps = {};
    this.ldeps = {};
  }
  Module.prototype = {
    setDependencies: function(deps) {
      this.deps = deps;
    },
    addModule: function(dep, module) {
      var $this = this;
      if(!module.isReady) {
        module.addParent(function(){
          $this.addModule(dep, module);
        });
        return;
      }
      this.rdeps[dep] = module;
      for(var i=0; i<this.deps.length; i++) {
      }
    },
    addParent: function(cb) {
      this.parents.push(cb);
    },
    exec: function() {
      if(typeof this.callback != 'function')
        throw new Error('undefined callback');
      var deps = [];
      for(var i=0; i<this.deps.length; i++) {
        var dep = this.ldeps[this.deps[i]];
        deps.push(dep.exports);
      }
      this.exports = this.callback.apply({}, deps);
      this.emitReady();
    },
    emitReady: function() {
      this.isReady = true;
      for(var i=0; i<this.parents.length; i++) {
        this.parents[i]();
      }
      this.parents = [];
    },
    load: function() {
      if(this.deps.length === 0) {
        define.exec(this);
      }
      else {
        var $this = this;
        this.resolveDependencies(function() {
          $this.loadDependencies(function() {
            define.exec($this);
          });
        });
      }
    },
    resolveDependencies: function(cb) {
      var $this = this;
      var path = define.getNative('path');
      var resolver = define.getNative('resolver');
      var batch = resolver.newBatch(cb);
      this.deps.forEach(function(dep) {
        if(path.isAbsolute(dep)) {
          this.rdeps[dep] = dep;
        }
        else {
          batch.add(this.filename, dep, function(file) {
            $this.rdeps[dep] = file;
          });
        }
      });
      batch.launch();
    },
    loadDependencies: function(cb) {
      var $this = this;
      var path = define.getNative('path');
      var loader = define.getNative('loader');
      var batch = loader.newBatch(cb);
      this.deps.forEach(function(dep) {
        if(path.isAbsolute(dep)) {
          this.rdeps[dep] = dep;
        }
        else {
          batch.add(this.filename, dep, function(file) {
            $this.rdeps[dep] = file;
          });
        }
      });
      batch.launch();
    }
  };
  
  return Module;
};

// exports
if(define && define.model == 'ubiquity-require') {
  define.addNative('module', __moduleDefineModule);
}
else {
  module.exports = __moduleDefineModule();
}