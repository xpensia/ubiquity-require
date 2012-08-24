# ubiquity-require

Asynchronous module loader for Nodejs with dependency injection



## Installation

```
npm install ubiquity-require
```
ubiquity-require is compatible with nodejs version 0.6 and later.
You should use at least version 0.0.3 of ubiquity-require which fix major bugs.


## Usage

### In your app.js
```js

// first, require ubiquity-require
require('ubiquity-require');

// require some modules
var express = require('express');
var dbDriver = require('my-db-driver');

// require your app config (you will see the magic next)
require('./config.js');

// initialise some core components of your app
var app = express.createServer();
var db = dbDriver.createConnection(process.env.DB_URL);

// expose those components to your app
module.provide('app', app);
module.provide('db', db);

// your app probably has others modules
require('./models/user.js');
// ...

// well for a complete example, don't forget this somewhere
app.listen(process.env.PORT);

```

### In your others files
Example ./config.js :
```js

// define your module by asking for dependencies and passing a callback
define(['express', './dumb_file.js', '@app'], function(express, dumb, app) {
    // the "@" symbole give you access to named values provided by other parts of your app
    app.configure(function(){
        app.set('views', __dirname + '/views');
        app.set('view engine', 'ejs');

        app.use(express.static(__dirname + '/public'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.cookieParser());
        app.use(express.session({ secret: process.env.SESSION_SECRET }));
        app.use(dumb.middleware;
        app.use(app.router);
    });
});

```

Example ./models/user.js :
```js

define(['orm', '@db'], function(orm, db) {
    var UserModel = orm.createModel(db, {
        // model definition...
    });

    this.provide('UserModel', UserModel);
});

```

Example ./dumb_file.js :
```js

// you don't have to migrate everything to use ubiquity-require
var fs = require('fs');
exports.middleware = function(req, res, next) {
    req.fooBar = fs.readFileSync('./foo.bar');
    next();
};

```

## Versions

You should at least use version 0.0.3
Version 0.0.2 had serious bugs.

Versions 0.0.x work with nodejs v0.6.x
Versions 0.1.x will need nodejs v0.8.x

* 0.1.0 : On going release with cool features :)

* 0.0.3 : Fix loading of some native modules and those who declare their
* 0.0.2 : First published version

