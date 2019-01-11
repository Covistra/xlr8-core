/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2019 Covistra Technologies Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation 
 * files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, 
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished 
 * to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES 
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
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

module.exports = function () {

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
            // FIXME: How do we remove a route from express? 
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