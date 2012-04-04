// ubiquity-require/browser/resolverExample.js

var __resolverDefineModule = function(){
  var Resolver = {};
  function Batch(cb) {
    this.callback = cb;
  }
  Resolver.resolve = function(from, to) {
    
  };
  Resolver.newBatch = function(cb) {
    return new Batch(cb);
  };
  Batch.prototype.add
};

// exports
if(define && define.model == 'ubiquity-require') {
  define.addNative('resolver', __resolverDefineModule);
}
else {
  module.exports = __resolverDefineModule();
}
