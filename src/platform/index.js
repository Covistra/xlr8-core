const { Plugin } = require('../plugin')();

module.exports = function(platformSpec = {}) {

    class Platform extends Plugin {
        constructor() {
            super('platform', __dirname, platformSpec);
        }
    }

    return new Platform();
};