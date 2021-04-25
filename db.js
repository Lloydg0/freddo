// requirign packets
const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

// gets data first & Lastname, age, city and website name from signatrues DB to present to the /signers route
module.exports.getUserDataForSignersPage = () => {
    const q = `SELECT users.id, first_name, last_name, user_profiles.id, age, city, url FROM users
                    LEFT JOIN user_profiles  ON users.id = user_profiles.user_id
                    LEFT JOIN signatures ON user_profiles.id = signatures.user_id`;
    return db.query(q);
};

//gets the signers by city render into the /signers:city route
module.exports.getSignersByCity = () => {
    const q = `SELECT city FROM user_profiles`;
    return db.query(q);
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

// add the user_profiles information into the database
module.exports.addUserProfileInfo = (data, user_id) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4) RETURNING ID`;
    const params = [data.age, data.city, data.prefixedURL, user_id];
    return db.query(q, params);
};
