const { genSalt, hash, compare } = require("bcryptjs");
exports.compare = compare;
exports.hash = (password) => genSalt().then((salt) => hash(password, salt));
