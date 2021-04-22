const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.getData = () => {
    return db.query(`SELECT first_name, last_name FROM signatures`);
};

module.exports.getSignatureById = (id) => {
    const q = `SELECT signature FROM signatures WHERE ID = ${id}`;
    return db.query(q);
};

module.exports.addData = (data) => {
    //preventing an SQL Injection using params
    const q = `INSERT INTO signatures (first_name, last_name, signature)
        VALUES ($1, $2, $3) RETURNING ID`;
    const params = [data.first_name, data.last_name, data.signature];
    return db.query(q, params);
};
