const { Plugin } = require('./plugin')();

module.exports = function(platformSpec) {

    class MicroService extends Plugin {
        constructor() {
            super('service', process.cwd(), platformSpec);
        }
    }

    return new MicroService();
}