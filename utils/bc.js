const { genSalt, hash, compare } = require("bcryptjs");
exports.compare = compare;
exports.hash = (password) => genSalt().then((salt) => hash(password, salt));

module.exports.prefixURL = (url) => {
    if (!url) {
        return url;
    }
    if (url.startsWith("https://" || "http://")) {
        return url;
    }
    let urlPrefix = "https://";
    let genuineURL = urlPrefix.concat(url);
    return genuineURL;
};
