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
const get = require('lodash.get');

class Context {
    constructor(ctx) {
        this._ctx = ctx;
    }
    get(field, defaultVal) {
        return get(this._ctx, field) || defaultVal;
    }
}

class BaseLoader {
    constructor(proc, type, logger) {
        this.proc = proc;
        this.type = type;
        this.logger = logger;
        this.components = [];
    }
    start() {

    }
    stop() {

    }
    load(pattern, context, { cstor = false } = {}) {
        return this.proc.resolveFiles(pattern).then(files => {
            this.logger.debug("%s: found %d files", this.type, files.length);

            return Promise.map(files, file => {
                this.logger.trace("Loading component %s", file);
                let value = require(file);
                let key = XLR8.makeComponentKey(file, this.type);
                if (typeof value === 'function') {
                    let componentLogger = this.logger.child({ type: this.type, key });
                    return { key, value: value({ proc: this.proc, context: new Context(context), logger: componentLogger, key }) };
                } else {
                    return { key, value };
                }
            });
        }).then(components => {
            this.logger.trace("Loaded components", components);
            if (cstor) {
                this.components = components.map(comp => new cstor(comp.value));
            } else {
                this.components = components;
            }
            return this.components;
        }).then(components => components.map(comp => {
            this.proc.emit(this.type, comp)
            this.proc.emit("component", { type: this.type, comp });
            return comp;
        }));
    }
    supports(types) {
        if (Array.isArray(types)) {
            return types.indexOf(this.type) !== -1;
        } else {
            return true;
        }
    }
    map(fn) {
        return Promise.map(this.components, fn);
    }
    each(fn) {
        return Promise.each(this.components, fn);
    }
}

module.exports = BaseLoader;