const express = require('express');
const assert = require('assert');
const async = require('async');
const request = require('request');
const ejs = require('ejs');

const utils = require('./my_util');

const strNoTitle = 'NO TITLE';
const strNoResponse = 'NO RESPONSE';
const port = 4545;

exports.Server = Server;

function Server() {
    var self = this;
    self.app = express();
    self.router = express.Router();
    self.test = 'AZ'
}

Server.prototype.run = function () {
    var self = this;
    self.setup();
    var listener = self.app.listen(port, function (err) {
        assert.equal(err, null);
        console.log("Server started [address - " + listener.address().address + "] [port - " + listener.address().port + "]");
    });
};

Server.prototype.setup = function () {
    var self = this;

    self.app.set('view engine', 'ejs');

    var routes = self.routes;
    for (var r in routes['GET']) {
        self.router.get(r, routes['GET'][r].bind(self));
    }
    for (var r in routes['ALL']) {
        self.router.all(r, routes['ALL'][r].bind(self));
    }

    self.app.use(self.router);
};

Server.prototype.errorPage = function (req, res) {
    res.statusCode = 404;
    res.send('404 - Invalid Operation');
};

Server.prototype.simpleServer = function (req, res) {
    var urlParam = req.query.address;
    if (!urlParam) {
        res.send("No Url Found");
        return;
    }

    if (!(urlParam instanceof Array)) {
        urlParam = [urlParam];
    }

    var titles = [];
    var doneReqs = 0;

    urlParam.forEach(function (_url) {
        var u = utils.fixUrl(_url);

        request(u, function (e, r, body) {
            var title = strNoResponse;
            if (!(e || +r.statusCode >= 400)) {
                title = utils.getTitleFromResponse(body, strNoTitle);
            }
            titles.push({'url': _url, 'title': title});

            if (doneReqs++ == urlParam.length - 1) {
                res.render('title_page', {'titles': titles});
            }
        });
    });
};

Server.prototype.asyncServer = function (req, res) {
    var urlParam = req.query.address;
    if (!urlParam) {
        res.send("No Url Found");
        return;
    }

    if (!(urlParam instanceof Array)) {
        urlParam = [urlParam];
    }

    async.map(
        urlParam,
        function (_url, cb) {
            var u = utils.fixUrl(_url);
            request(u, function (e, r, body) {
                var title = strNoResponse;
                if (!(e || +r.statusCode >= 400)) {
                    title = utils.getTitleFromResponse(body, strNoTitle);
                }
                cb(null, {'url': _url, 'title': title});
            });
        },
        function (e, results) {
            res.render('title_page', {'titles': results});
        });
};

Server.prototype.promiseServer = function (req, res) {
    var urlParam = req.query.address;
    if (!urlParam) {
        res.send("No Url Found");
        return;
    }

    if (!(urlParam instanceof Array)) {
        urlParam = [urlParam];
    }

    Promise
        .all(urlParam.map(function (_url) {
            return new Promise(function (resolve, reject) {
                var u = utils.fixUrl(_url);

                request(u, function (e, r, body) {
                    var title = strNoResponse;
                    if (!(e || +r.statusCode >= 400)) {
                        title = utils.getTitleFromResponse(body, strNoTitle);
                    }
                    resolve({'url': _url, 'title': title});
                });
            });
        }))
        .then(function (titles) {
            res.render('title_page', {'titles': titles});
        });
};

Server.prototype.routes = {
    GET: {
        // '/I/want/title': Server.prototype.simpleServer,         // simple
        // '/I/want/title': Server.prototype.asyncServer,      // async
        '/I/want/title': Server.prototype.promiseServer,       // promises
    },
    ALL: {
        '*': Server.prototype.errorPage,
    }
};

// setup logger
// check prereq
// start server
server = new Server();
server.run();
