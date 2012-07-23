

exports.Context = require('./context.js');

// all the magic happen here!
var Module = require('./module.js');

for(var file in Module._cache) {
    Module._cache[file].extend();
}
