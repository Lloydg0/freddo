const { genSalt, hash, compare } = require("bcryptjs");
exports.compare = compare;
exports.hash = (password) => genSalt().then((salt) => hash(password, salt));

//checking to see if the website entered in the inputfiled is a real url and not an attack
module.exports.prefixURL = (url) => {
    if (url.startsWith("https://" || "http://")) {
        console.log("function URL", url);
        return url;
    }
    let urlPrefix = "https://";
    let genuineURL = urlPrefix.concat(url);
    console.log("fucntion genuine URL ", genuineURL);
    return genuineURL;
};
