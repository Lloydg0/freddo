var redis = require("redis");
const { promisify } = require("util");
var client = redis.createClient({
    host: "localhost",
    port: 6379,
});

client.on("error", function (err) {
    console.log(err);
});

module.exports.set = promisify(client.set).bind(client);
module.exports.setex = promisify(client.setex).bind(client);
module.exports.get = promisify(client.get).bind(client);
module.exports.del = promisify(client.del).bind(client);
