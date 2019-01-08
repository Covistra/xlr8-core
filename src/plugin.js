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