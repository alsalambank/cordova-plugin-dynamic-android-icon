var exec = require('cordova/exec');
exports.setIcon = function (iconName, success, error) {
    exec(success, error, 'DynamicIcon', 'setIcon', [iconName]);
};
