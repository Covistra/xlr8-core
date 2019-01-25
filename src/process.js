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
const platformFactory = require('./platform');
const flatten = require('lodash.flatten');
const serviceFactory = require('./service');
const EE = require('events').EventEmitter;
const componentSelectorFactory = require('./component-selector');
const Yaml = require('js-yaml');
const fs = require('fs-extra');
const KubernetesCluster = require('./kubernetes/cluster');

function loadPlugins(process) {
    const plugins = process.packageInfo.xlr8 ? process.packageInfo.xlr8.plugins || [] : [];

    XLR8.Logger.debug("Registering %d detected plugins", plugins.length);

    return Promise.map(plugins, pluginModule => {
        XLR8.Logger.debug("Loading plugin %s", pluginModule);
        let plugin = process.loadPlugin(pluginModule);
        return process.installPlugin(plugin);
    });
}

function loadLoaders(process) {
    XLR8.Logger.debug("Loading all loaders from %d plugins", process.plugins.length);
    return Promise.map(process.plugins, plugin => plugin.loadLoaders()).then(flatten);
}

function isObject(obj) {
    return (typeof obj === "object" && obj !== null) || typeof obj === "function";
}

class Process extends EE {
    constructor({ packageInfo, rootPath, loadPlugin, k8s, config }) {
        super();
        this.packageInfo = packageInfo;
        this.rootPath = rootPath;
        this.loadPlugin = loadPlugin;
        this.cluster = new KubernetesCluster(k8s);
        this.config = config;

        let platformPlugin = platformFactory(packageInfo.xlr8);
        platformPlugin.install(this);
        let servicePlugin = serviceFactory(packageInfo.xlr8);
        servicePlugin.install(this);
        this.plugins = [platformPlugin, servicePlugin];
        this.emit('plugin', platformPlugin);
        this.emit('plugin', servicePlugin);
    }
    async load() {
        // Load all plugins
        this.plugins.push(...await loadPlugins(this));

        // Register all loaders
        this.loaders = await loadLoaders(this);

        // Loop through all loaders to load all components
        return Promise.map(this.loaders, loader => loader.load());
    }
    installPlugin(plugin) {
        return plugin && plugin.install(this);
    }
    resolveFiles(pattern) {
        return Promise.map(this.plugins, plugin => plugin.lookupFiles(pattern)).then(flatten);
    }
    uninstallPlugin(plugin) {
        return plugin && plugin.uninstall(this);
    }
    start() {
        return Promise.map(this.loaders, loader => loader.start());
    }
    select(...keys) {
        let opts = {
            timeout: 30000,
            polling: 100
        };
        if (keys.length > 0 && isObject(keys[keys.length - 1])) {
            opts = Object.assign(opts, keys.splice(-1, 1)[0]);
        }
        let selector = componentSelectorFactory(this, opts);
        if (keys.length > 0) {
            selector.keys(...keys);
        }
        return selector;
    }
    async readYamlFile(path, encoding = 'utf8') {
        let content = await fs.readFile(path, encoding);
        return Yaml.safeLoad(content);
    }
    stop() {
        return Promise.map(this.loaders, loader => loader.stop());
    }
    async execute(commandKey, params) {
        XLR8.Logger.debug("executing command %s", `${commandKey}Command`);
        let command = await this.select(`${commandKey}Command`).type('command').get();
        if (command) {
            return command(params);
        } else {
            throw new Error("invalid command:" + commandKey);
        }
    }
}

module.exports = Process;