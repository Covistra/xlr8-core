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
const BaseLoader = require('../base-loader');

module.exports = function({ proc, logger, spec }) {

    const Action = require('./action')({ proc, logger });

    const helpers = {
        action(key, handler) {
            return new Action({ key, handler });
        }
    };

    class ActionLoader extends BaseLoader {
        constructor() {
            super(proc, 'action', logger);
        }
        load() {
            return super.load("**/*.action.js", spec, { helpers });
        }
        async start() {
            logger.debug("Execute all actions schedule to be executed at startup", this.components.length);
            return Promise.map(this.components, action => Promise.resolve(action.value).then(action => {
                if (action.onStart) {
                    return action.execute(proc.config);
                }
            }));
        }
        async stop() {}
    }

    return new ActionLoader();
}