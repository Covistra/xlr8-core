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
const fs = require('fs-extra');
const Path = require('path');

module.exports = function({ proc, logger, spec }) {

    const Template = require('./template')({ proc, logger });

    const helpers = {
        async load(path, key, { compiled = true } = {}) {
            let content = await fs.readFile(Path.resolve(path), 'utf8');
            let tmpl = new Template(content, key);
            if (compiled) {
                tmpl.compile();
            }
            return tmpl;
        },
        compile(content) {
            let tmpl = new Template(content);
            tmpl.compile();
            return tmpl;
        }
    };

    class TemplateLoader extends BaseLoader {
        constructor() {
            super(proc, 'template', logger);
        }
        load() {
            return super.load("**/*.template.js", spec, { helpers });
        }
    }

    return new TemplateLoader();
}