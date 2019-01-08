module.exports = function({ proc, logger, context }) {
    const port = context.get('config.api.default', 3000);
    logger.debug("Registering default API service on port %d", port);
    return new XLR8.HttpApi({ port, proc, logger });
};