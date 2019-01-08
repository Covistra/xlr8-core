const flatten = require('lodash.flatten');
const identity = require('lodash.identity');

class ComponentSelector {
    constructor(opts) {
        this._opts = opts;
    }
    keys(...keys) {
        this._keys = keys;
        return this;
    }
    type(...types) {
        this._types = types;
        return this;
    }
    query(q) {
        this._query = q;
        return this;
    }
    async resolve(target, loaders) {
        XLR8.Logger.trace("resolving comp", target.key);
        return Promise.map(loaders, loader => {
            XLR8.Logger.trace("checking loader %s for target", loader.type, target.key);
            return loader.visitComponents(comp => {
                XLR8.Logger.trace("checking matching comp", comp.key, target.key, loader.type);
                if (comp.key === target.key) {
                    XLR8.Logger.trace("component match for loader %s. %s==%s", loader.type, comp.key, target.key);
                    target.$resolver(comp);
                    return comp;
                }
            }).then(components => components.filter(identity));
        }).then(flatten);
    }
    render(components, opts) {
        XLR8.Logger.trace("Rendering components", components);
        let result = {};
        return Promise.map(components, comp => {
            if (comp) {
                let r = result[comp.key];
                if (opts.promise) {
                    if (!r) {
                        if (opts.one) {
                            result = comp.value;
                        } else {
                            result[comp.key] = comp.value;
                        }
                    } else if (Array.isArray(r)) {
                        r.push(comp.value);
                    } else {
                        result[comp.key] = [r, comp.value];
                    }
                } else {
                    return Promise.resolve(comp.value).then(val => {
                        if (!r) {
                            if (opts.one) {
                                result = val;
                            } else {
                                result[comp.key] = val;
                            }
                        } else if (Array.isArray(r)) {
                            r.push(val);
                        } else {
                            result[comp.key] = [r, val];
                        }
                    });
                }
            }
        }).then(() => result);
    }
}

module.exports = function(proc, opts = {}) {

    ComponentSelector.prototype.findMatchingKeys = async function(q) {
        let query = q || this._query;
        let supportedLoaders = proc.loaders.filter(loader => loader.supports(this._types));
        let fields = Object.keys(query);
        XLR8.Logger.trace("Processing query fields", fields);
        return Promise.map(supportedLoaders, loader => {
            XLR8.Logger.trace("Filtering %d components for loader %s", loader.components.length, loader.type);
            return Promise.filter(loader.components, async comp => {
                return Promise.resolve(comp.value).then(val => {
                    if (val) {
                        XLR8.Logger.trace("Component %s value = ", comp.key, val);
                        return Promise.reduce(fields, (valid, field) => {
                            XLR8.Logger.trace("filtering on field", field, query);
                            if (query[field] instanceof RegExp) {
                                XLR8.Logger.trace("applying regex to field %s", field, query[field], valid, val[field]);
                                return valid && (val[field] && val[field].match(query[field]));
                            } else if (field === 'key') {
                                return valid && query.key.indexOf(comp.key) !== -1;
                            } else {
                                return valid && val[field] === query[field];
                            }
                        }, true);
                    } else {
                        return false;
                    }
                });
            });
        }).then(flatten).then(components => Promise.map(components, comp => comp.key));
    }

    ComponentSelector.prototype.wait = async function() {
        let supportedLoaders = proc.loaders.filter(loader => loader.supports(this._types));
        let keys$;
        if (this._query) {
            keys$ = this.findMatchingKeys(this._query);
        } else {
            keys$ = Promise.resolve(this._keys);
        }

        return keys$.then(keys => {
            this._pendings = keys.map(key => {
                let pending = { key };
                pending.$value = new Promise((resolve) => pending.$resolver = resolve);
                return pending;
            });

            let timer = setInterval(() => {
                let unresolvedPendings = this._pendings.filter(pending => !pending.$value.isFulfilled());
                XLR8.Logger.trace("Resolving %d missing dependencies...", unresolvedPendings.length);
                Promise.map(unresolvedPendings, unresolved => {
                    return this.resolve(unresolved, supportedLoaders);
                }).catch(err => {
                    XLR8.Logger.error(err);
                });
            }, opts.polling || 250);

            return Promise.all(this._pendings.map(p => p.$value)).then(components => this.render(components, opts)).timeout(opts.timeout || 0).finally(() => clearInterval(timer));
        });
    };

    ComponentSelector.prototype.get = async function() {
        let supportedLoaders = proc.loaders.filter(loader => loader.supports(this._types));

        let keys$;
        if (this._query) {
            keys$ = this.findMatchingKeys(this._query);
        } else {
            keys$ = Promise.resolve(this._keys);
        }

        return keys$.then(keys => {
            XLR8.Logger.trace("Found potential keys", keys);
            this._pendings = keys.map(key => {
                let pending = { key };
                pending.$value = new Promise((resolve) => pending.$resolver = resolve);
                return pending;
            });

            // Resolve all pendings
            XLR8.Logger.trace("Resolving pendings", this._pendings);
            return Promise.map(this._pendings, pending => this.resolve(pending, supportedLoaders)).then(flatten).then(components => {
                XLR8.Logger.trace("resolved components", components);
                return this.render(components, { one: true });
            });
        });
    };

    ComponentSelector.prototype.list = async function() {
        let supportedLoaders = proc.loaders.filter(loader => loader.supports(this._types));
        let keys$;
        if (this._query) {
            keys$ = this.findMatchingKeys(this._query);
        } else {
            keys$ = Promise.resolve(this._keys);
        }

        return keys$.then(keys => {

            this._pendings = keys.map(key => {
                let pending = { key };
                pending.$value = new Promise((resolve) => pending.$resolver = resolve);
                return pending;
            });

            // Resolve all pendings
            return Promise.map(this._pendings, pending => this.resolve(pending, supportedLoaders)).then(flatten).then(identity);
        });
    };

    return new ComponentSelector(opts);
}