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