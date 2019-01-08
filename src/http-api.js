const express = require('express');

class Endpoint {
    constructor(key, method, path, handler) {
        this._key = key;
        this._path = path;
        this._handler = handler;
        this._method = method || 'get';
    }
    register(app) {
        app[this._method.toLowerCase()](this._path, this._handler);
    }
    get path() {
        return this._path;
    }
}

module.exports = function() {

    class HttpApi {
        constructor({ port = 3000, proc, logger } = {}) {
            this._port = port;
            this._proc = proc;
            this._logger = logger;
            this._app = express();
            this._endpoints = [];
        }
        registerEndpoint({ key, method, path, handler }) {
            this._logger.debug("Registering endpoint %s (%s %s) on api", key, method, path)
            let endpoint = new Endpoint(key, method, path, handler);
            this._endpoints.push(endpoint);
            endpoint.register(this._app);
            return this.restart().then(() => endpoint);
        }
        unregisterEndpoint({ key, method, path }) {
            // FIXME: How to we remove a route from express? 
            return Promise.resolve();
        }
        registerEndpoints(endpoints) {
            return Promise.map(endpoints, endpoint => this.registerEndpoint(endpoint));
        }
        unregisterEndpoints(endpoints) {
            return Promise.map(endpoints, endpoint => this.unregisterEndpoint(endpoint));
        }
        start() {
            this._logger.info("Starting Default API on port %d", this._port);
            return Promise.fromCallback(cb => this._app.listen(this._port, cb));
        }
        restart() {
            return Promise.resolve();
        }
    }

    return HttpApi;
}