const Path = require('path');

module.exports = function(file) {

    const baseName = Path.basename(file, ".js");
    let fragments = baseName.split(/[\.\-_]/);
    return fragments.reduce((key, fragment) => {
        if (key.length > 0) {
            return key + fragment[0].toUpperCase() + fragment.substring(1);
        } else {
            return fragment;
        }
    }, "");
}