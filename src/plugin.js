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
const Path = require('path');
const flatten = require('lodash.flatten');
const glob = require('glob');

module.exports = function() {

    class Plugin {
        constructor(name, rootPath, spec) {
            this._name = name;
            this._rootPath = rootPath;
            this._spec = spec;
            this._logger = XLR8.Logger.child({ plugin: name });
            this._loaders = [];
        }
        get loaders() {
            return this._loaders;
        }
        loadLoaders() {
            return this.lookupFiles('**/*.loader.js').then(loaderFiles => {
                this._logger.debug("Found %d loaders for plugin %s", loaderFiles.length, this._name, loaderFiles);
                return Promise.map(loaderFiles, loaderFile => {
                    const loaderName = Path.basename(loaderFile);
                    const logger = this._logger.child({ loader: loaderName });
                    let loader = require(Path.resolve(this._rootPath, loaderFile))({
                        proc: this._proc,
                        spec: this._spec,
                        plugin: this,
                        logger
                    });
                    this._loaders.push(loader);
                    this._proc.emit("loader", loader);
                    return loader;
                });
            });
        }
        install(proc) {
            this._proc = proc;
            return this;
        }
        uninstall() {
            this._proc = null;
            return this;
        }
        lookupFiles(pattern) {
            this._logger.trace("Looking for components %s in %s", pattern, this._rootPath);
            return Promise.fromCallback(cb => glob(pattern, { cwd: this._rootPath, nodir: true, absolute: true }, cb));
        }
        resolve(deps, opts) {
            return Promise.map(this._loaders, loader => loader.resolve(deps, opts)).then(flatten);
        }
    }

    return { Plugin };
}