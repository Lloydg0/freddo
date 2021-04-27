DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users;


CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    first_name    VARCHAR NOT NULL CHECK (first_name != ''),
    last_name     VARCHAR NOT NULL CHECK (last_name != ''),
    email         VARCHAR NOT NULL UNIQUE CHECK (email != ''),
    password_hash VARCHAR NOT NULL CHECK (password_hash != ''),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL UNIQUE REFERENCES users (id),
    signature  VARCHAR NOT NULL CHECK (signature != ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    id      SERIAL PRIMARY KEY,
    age     INTEGER,
    city    VARCHAR(100),
    url     VARCHAR(300),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users (id)
);


