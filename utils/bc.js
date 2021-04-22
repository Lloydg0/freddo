// const bc = require("bcryptjs");
const { genSalt, hash, compare } = require("bcryptjs");
exports.compare = compare;
exports.hash = (password) => genSalt().then((salt) => hash(password, salt));

// bc.hash("password", salt).then((hash) => console.log(hash));

// bc.compare(
//     "123456",
//     "enter previously hashed password to check it it mathced"
// ).then((comparison) => console.log(comparison));
