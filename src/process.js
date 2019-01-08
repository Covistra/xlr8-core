const platformFactory = require('./platform');
const flatten = require('lodash.flatten');
const serviceFactory = require('./service');
const EE = require('events').EventEmitter;
const componentSelectorFactory = require('./component-selector');

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
    constructor({ packageInfo, rootPath, loadPlugin }) {
        super();
        this.packageInfo = packageInfo;
        this.rootPath = rootPath;
        this.loadPlugin = loadPlugin;

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
}

module.exports = Process;