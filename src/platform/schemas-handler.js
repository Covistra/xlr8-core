module.exports = function({ logger, proc }) {

    return async function(req, res, next) {
        logger.debug("Received schema request", req.params);
        try {
            // This is a runtime selection. A dynamic component selector should be used instead of the 
            // stadnard inject or resolve method. 
            let schema = await proc.select().type('schema').query({ $id: new RegExp(`/${req.params.schemaRef}$`) }).get();
            if (schema) {
                res.json(schema);
            } else {
                res.status(404).end();
            }
        } catch (err) {
            next(err);
        }
    }
}