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

const ajv = new Ajv({ schemaId: 'auto' });
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

module.exports = function({ proc, logger, query }) {

    class SchemaLoader extends BaseLoader {
        constructor() {
            super(proc, 'schema', logger);
        }
        load() {
            return super.load("**/*.schema.js");
        }
        async start() {
            super.start();
            // Register all our schemas
            logger.debug("Register %d schemas on startup", this.components.length);
            const { defaultApi } = await proc.select("defaultApi").type('api').wait();
            return defaultApi.registerEndpoint({
                key: 'schemas',
                method: 'get',
                path: '/schemas/:schemaRef*',
                handler: require('./schemas-handler')({ loader: this, logger, proc })
            }).then(endpoint => logger.info("Schemas served on %s", endpoint.path));
        }
        async stop() {
            super.start();
            logger.debug("Unregister %d schemas on shutdown", this.components.length);
            const { defaultApi } = await proc.resolve("defaultApi").type('api').wait();
            return defaultApi.unregisterEndpoint('schemas').then(() => logger.info("Schemas are not served anymore"));
        }
    }

    return new SchemaLoader();
}