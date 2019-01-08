const bunyan = require('bunyan');
const bFormat = require('bunyan-format');
const formatOut = bFormat({ outputMode: 'short' });

const rootLogger = bunyan.createLogger({ name: process.env.LOG_NAME || 'xlr8', stream: formatOut, level: process.env.LOG_LEVEL || 'debug' });

rootLogger.info("XLR8 Version 1. Licensed under Apache 2.0 License.");

global.XLR8 = module.exports = {
    Process: require('./process'),
    Logger: rootLogger,
    makeComponentKey: require('./make-component-key'),
    HttpApi: require('./http-api')(),
    Plugin: require('./plugin')().Plugin,
    BaseLoader: require('./base-loader'),
    JsonSchema: require('./json-schema')
}