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
const Ajv = require('ajv');
const BaseLoader = require('../base-loader');
const identity = require('lodash.identity');

const ajv = new Ajv({ schemaId: 'auto' });
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

module.exports = function({ proc, logger, spec }) {

    class ApiLoader extends BaseLoader {
        constructor() {
            super(proc, 'api', logger);
        }
        load() {
            return super.load("**/*.api.js", spec);
        }
        async start() {
            // Register all our schemas
            logger.debug("Start our %d apis by having them listen to their respective ports", this.components.length);
            return Promise.map(this.components, api => Promise.resolve(api.value).then(api => api.start()));
        }
        async stop() {
            logger.debug("Stop all our apis on shutdown");
            return Promise.map(this.components, api => Promise.resolve(api.value).then(api => api.stop()));
        }
    }

    return new ApiLoader();
}