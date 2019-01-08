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