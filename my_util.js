const xpath = require('xpath');
const xmldom = require('xmldom');

exports.getTitleFromResponse = function (response, defaultTitle) {
    var title = defaultTitle;
    if (response) {
        var doc = new xmldom.DOMParser().parseFromString(response);
        title = xpath.select("string(//title)", doc);
    }
    return title;
};

exports.fixUrl = function (url) {
    var u = url;
    if (!(u.startsWith('http://') || u.startsWith('https://'))) {
        u = 'https://' + u;
    }
    return u;
};