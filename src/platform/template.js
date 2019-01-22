const Hbs = require('handlebars');

module.exports = function({ proc, logger }) {

    class Template {
        constructor(content, key) {
            this._content = content;
            this._key = key;
        }
        get key() {
            return this._key;
        }
        compile() {
            this._tmpl = Hbs.compile(this._content);
            return this;
        }
        async render(data = {}) {
            if (!this._tmpl && this._content) {
                this.compile();
            }
            return this._tmpl(data);
        }
    }

    return Template;
}