const Ajv = require('ajv');

const ajv = new Ajv({
    schemaId: 'auto',
    coerceTypes: true,
    allErrors: true,
    removeAdditional: true,
    useDefaults: true
});

ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

class JsonSchema {
    constructor(source) {
        this._schema = ajv.compile(source);
        this._source = source;
    }
    validate(data) {
        return this._schema(data);
    }
    get errors() {
        return this._schema.errors;
    }
    get source() {
        return this._source;
    }
}

module.exports = JsonSchema;