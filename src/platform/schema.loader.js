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