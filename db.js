// requirign packets
const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

//Getting the dynamic data to show in the edit page
module.exports.getUpdatableUserData = (user_id) => {
    const q = `SELECT users.id, first_name, last_name, email, user_profiles.id, age, city, url FROM users
                LEFT JOIN user_profiles ON users.id = user_profiles.user_id
                WHERE user_id = $1`;
    return db.query(q, [user_id]);
};

// module.exports.getUpdatableUserData = (
//     first_name,
//     last_name,
//     email,
//     age,
//     city,
//     url
// ) => {
//     const q = `SELECT users.id, first_name, last_name, email, user_profiles.id, age, city, url FROM users
//                 LEFT JOIN user_profiles ON users.id = user_profiles.user_id
//                 WHERE first_name = $1, last_name =$2, email = $3, age = $4, city = $5, url = $6`;
//     return db.query(q, [
//         first_name,
//         last_name,
//         email,
//         user_profiles.id,
//         age,
//         city,
//         url,
//     ]);
// };

//update on users first,last, email,password
module.exports.updateUsersFirstLastEmail = (
    frist_name,
    last_name,
    email,
    id
) => {
    const q = `UPDATE users SET (first_name, last_name, email) =
               (first_name = $1, last_name = $2 , email = $3) 
               WHERE ID = $4`;
    return db.query(q, [frist_name, last_name, email, id]);
};

//update on users first,last, email and password
module.exports.updateUsersFirstLastEmailAndPassword = (
    frist_name,
    last_name,
    email,
    password_hash,
    id
) => {
    const q = `UPDATE users SET (first_name, last_name, email, password_hash) = 
               (first_name = $1, last_name = $2 , email = $3, password_hash = $4) 
               WHERE ID = $5`;
    return db.query(q, [frist_name, last_name, email, password_hash, id]);
};

//USERT on users_profiles first,last, email
module.exports.upsertUserProfilesAgeCityUrl = (age, city, url) => {
    const q = ` INSERT INTO user_profiles (age, city, url)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id)
                DO UPDATE SET age = $1, city = $2 , url = $3
                RETURNING user_id`;
    const params = [age, city, url];
    return db.query(q, params);
};

//DELETE the signature from the signatures table
module.exports.deleteSignature = (user_id) => {
    const q = `DELETE FROM signatures WHERE user_id = $1`;
    return db.query(q, [user_id]);
};

// gets data first & Lastname, age, city and website name from signatrues DB to present to the /signers route
module.exports.getUserDataForSignersPage = () => {
    const q = `SELECT users.id, first_name, last_name, user_profiles.id, age, city, url FROM users
                LEFT JOIN user_profiles  ON users.id = user_profiles.user_id
                LEFT JOIN signatures ON user_profiles.id = signatures.user_id`;
    return db.query(q);
};

// gets data like above with extra conditional for the /signers:city route
module.exports.getUserDataForSignersByCity = (city) => {
    const q = `SELECT users.id, first_name, last_name, user_profiles.id, age, city, url FROM users
               LEFT JOIN user_profiles  ON users.id = user_profiles.user_id
               LEFT JOIN signatures ON user_profiles.id = signatures.user_id
               WHERE LOWER(city) = LOWER($1)`;
    return db.query(q, [city]);
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
    const q = `SELECT users.id, password_hash, signatures.id AS "signature" FROM users 
               LEFT JOIN signatures 
               ON users.id = signatures.user_id 
               WHERE email = $1`;
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
