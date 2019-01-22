module.exports = function({ proc, logger }) {

    class Action {
        constructor({ key, handler }) {
            this.key = key;
            this.handler = handler;
        }
        schedule(pattern) {
            if (pattern === 'on-start') {
                this.onStart = true;
            }
            return this;
        }
        async execute(...args) {
            if (this.handler) {
                return this.handler(...args);
            }
        }
    }

    return Action;
}