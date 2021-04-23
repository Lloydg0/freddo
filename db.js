// requirign packets
const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

//gets data first & Last name from signatrues DB to present to the /signers route
module.exports.getData = () => {
    return db.query(`SELECT first_name, last_name FROM users`);
};

//gets the signature id to render into the /thanks route
module.exports.getSignatureById = (id) => {
    const q = `SELECT signature FROM signatures WHERE ID = $1`;
    return db.query(q, [id]);
};

//storing the users registration data
module.exports.saveUserRegistrationData = (data) => {
    const q = `INSERT INTO users (first_name, last_name, email, password_hash)
        VALUES ($1, $2, $3, $4) RETURNING ID`;
    const params = [
        data.first_name,
        data.last_name,
        data.email,
        data.password_hash,
    ];
    return db.query(q, params);
};

//retreiving user email & password from users database
module.exports.retrivingUserEmail = (email) => {
    // const q = `SELECT id, email, password_hash FROM users`;
    const q = `SELECT id, password_hash FROM users where email = $1`;
    return db.query(q, [email]);
};

//adding the signatureId to the signatures datebase
module.exports.addSignatureId = (signature, user_id) => {
    //preventing an SQL Injection using params
    const q = `INSERT INTO signatures (user_id, signature)
    VALUES ($1, $2) RETURNING ID`;
    const params = [user_id, signature];
    console.log("user_id", user_id);
    return db.query(q, params);
};
