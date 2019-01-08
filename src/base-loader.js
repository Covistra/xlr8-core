const get = require('lodash.get');
const identity = require('lodash.identity');

class Context {
    constructor(ctx) {
        this._ctx = ctx;
    }
    get(field, defaultVal) {
        return get(this._ctx, field) || defaultVal;
    }
}

class BaseLoader {
    constructor(proc, type, logger) {
        this.proc = proc;
        this.type = type;
        this.logger = logger;
        this.components = [];
    }
    start() {

    }
    stop() {

    }
    load(pattern, context, { cstor = false } = {}) {
        return this.proc.resolveFiles(pattern).then(files => {
            this.logger.debug("%s: found %d files", this.type, files.length);

            return Promise.map(files, file => {
                this.logger.trace("Loading component %s", file);
                let value = require(file);
                let key = XLR8.makeComponentKey(file, this.type);
                if (typeof value === 'function') {
                    let componentLogger = this.logger.child({ type: this.type, key });
                    return { key, value: value({ proc: this.proc, context: new Context(context), logger: componentLogger, key }) };
                } else {
                    return { key, value };
                }
            });
        }).then(components => {
            this.logger.trace("Loaded components", components);
            if (cstor) {
                this.components = components.map(comp => new cstor(comp.value));
            } else {
                this.components = components;
            }
            return this.components;
        }).then(components => components.map(comp => {
            this.proc.emit(this.type, comp)
            this.proc.emit("component", { type: this.type, comp });
            return comp;
        }));
    }
    async resolve(deps = []) {
        this.logger.trace("Resolving deps ", deps);
        return Promise.map(deps, dep => this.components.find(comp => comp.key === dep).filter(identity));
    }
    supports(types) {
        if (Array.isArray(types)) {
            return types.indexOf(this.type) !== -1;
        } else {
            return true;
        }
    }
    visitComponents(visitor) {
        return Promise.map(this.components, visitor);
    }
    selectComponentsByKey(keys) {
        return Promise.filter(this.components, comp => keys.indexOf(comp.key) !== -1);
    }
    selectComponents(selector) {
        let fields = Object.keys(selector);
        if (fields.length === 1 && fields[0] === 'key') {
            return this.selectComponentsByKey(selector.key);
        } else {
            this.logger.trace("%s: Filtering %d components with selector", this.type, this.components.length, selector);
            return Promise.filter(this.components, async comp => {
                return Promise.resolve(comp.value).then(val => {
                    if (val) {
                        this.logger.debug("Component %s value = ", comp.key, val);
                        return Promise.reduce(fields, (valid, field) => {
                            this.logger.trace("filtering on field", field, selector);
                            if (selector[field] instanceof RegExp) {
                                this.logger.trace("applying regex to field %s", field, selector[field], valid, val[field]);
                                return valid && (val[field] && val[field].match(selector[field]));
                            } else if (field === 'key') {
                                return valid && selector.key.indexOf(comp.key) !== -1;
                            } else {
                                return valid && val[field] === selector[field];
                            }
                        }, true);
                    } else {
                        return false;
                    }
                });
            });
        }
    }
    _selectComponents(selector) {
        let fields = Object.keys(selector);
        this.logger.trace("%s: Filtering %d components with selector", this.type, this.components.length, selector);
        return Promise.filter(this.components, async comp => {
            this.logger.trace("filtering component %s", comp.key);
            return Promise.resolve(comp.value).then(val => {
                if (val) {
                    this.logger.trace("found value for component %s", comp.key, val);
                    if (typeof val.value === 'function') {
                        this.logger.trace("component %s is indirect. Let's get its value", comp.key);
                        return val.value().then(val => {
                            this.logger.trace("async component %s value", comp.key, val);
                            return Promise.reduce(fields, (valid, field) => {
                                this.logger.trace("filtering on field", field, selector);
                                if (selector[field] instanceof RegExp) {
                                    this.logger.trace("applying regex to field %s", field, selector[field], valid, val[field]);
                                    return valid & (val[field] && val[field].match(selector[field]));
                                } else if (field === 'key') {
                                    return valid & selector.key.indexOf(comp.key) !== -1;
                                } else {
                                    return valid & val[field] === selector[field];
                                }
                            }, true);
                        });
                    } else {}
                } else {
                    return false;
                }
            });
        });
    }
    map(fn) {
        return Promise.map(this.components, fn);
    }
    each(fn) {
        return Promise.each(this.components, fn);
    }
}

module.exports = BaseLoader;