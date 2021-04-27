//requiring packets
const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const { SECRET_KEY } = require("./secrets.json");
const { hash, compare, prefixURL } = require("./utils/bc.js");

// config information
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//////////////////////////// middleware ////////////////////

//retrieving static files
app.use(express.static("public"));

// Cookie session
app.use(
    cookieSession({
        secret: `${SECRET_KEY}`,
        maxAge: 1000 * 60 * 60 * 24 * 7 * 6,
    })
);

// url encoded parser
app.use(
    express.urlencoded({
        extended: false,
    })
);

//Preventing Vulnerablilities (must come after cookie session)
app.use(csurf());
app.use(function (req, res, next) {
    //stopping clickjacking
    res.setHeader("x-frame-options", "deny");
    //stopping CSRF
    res.locals.csrfToken = req.csrfToken();
    next();
});

//checking to see if there has been cookies
app.use((req, res, next) => {
    console.log("req.url: ", req.url);
    console.log("req.session", req.session);
    console.log("req.body", req.body);

    next();
});

////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////Get requests

// login get request
app.get("/login", (req, res) => {
    console.log("a GET request was made to /login Route");
    res.render("login", {
        layout: "main",
    });
});

// register get request
app.get("/register", (req, res) => {
    console.log("a GET request was made to /register Route");
    res.render("register", {
        layout: "main",
    });
});

//profile GET request
app.get("/profile", (req, res) => {
    console.log("a GET request was made to /profile Route");
    if (req.session.user_id) {
        res.render("profile", {
            layour: "main",
        });
    }
});

//petition(signature) page get request
app.get("/petition", (req, res) => {
    console.log("a GET request was made to /petition Route");
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main",
        });
    }
});

//thanks page get request
app.get("/thanks", (req, res) => {
    console.log("a GET request was made to /thanks Route");
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        //getting the signature from the ID and allowing it to be rendered
        db.getSignatureById(req.session.signatureId)
            .then((result) => {
                // console.log(result);
                res.render("thanks", {
                    layout: "main",
                    signature: result.rows[0].signature,
                });
            })
            .catch((err) => {
                console.log("error in signature render", err);
            });
    }
});

//signers page get request
app.get("/signers", (req, res) => {
    console.log("a GET request was made to /signers Route");
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else if (req.session.user_id) {
        if (req.session.signatureId) {
            // SELECT first_name AND last_name FROM signatures
            db.getUserDataForSignersPage()
                .then((result) => {
                    // console.log("result.rows", result.rows);
                    res.render("signers", {
                        layout: "main",
                        dbdata: result.rows,
                    });
                })
                .catch((err) => {
                    console.log("Error", err);
                });
        }
    }
});

//signers city get request
app.get("/signers/:city", (req, res) => {
    const { city } = req.params;
    if (req.url) {
        db.getUserDataForSignersByCity(city)
            .then((result) => {
                // console.log("City result", result);
                res.render("signers", {
                    layout: "main",
                    dbdata: result.rows,
                    city,
                });
            })
            .catch((err) => {
                console.log("Error in getting city from signers page", err);
            });
    }
});

// GET profile/edit route
app.get("/profile/edit", (req, res) => {
    console.log("GET request made to the profile edit route");
    if (req.session.user_id) {
        db.getUpdatableUserData(req.session.user_id)
            .then((result) => {
                // console.log("result.rows in profile edit route", result.rows);
                res.render("edit", {
                    layout: "main",
                    first_name: result.rows[0].first_name,
                    last_name: result.rows[0].last_name,
                    email: result.rows[0].email,
                    age: result.rows[0].age,
                    city: result.rows[0].city,
                    url: result.rows[0].url,
                });
            })
            .catch((err) => {
                console.log("Error in profile/edit get request", err);
            });
    }
});

//logout get request
app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
});

/////////////////////////////////////////////////////////////////////
//////////////////////////// POST REQUESTS //////////////////////////

// Petition( signature) POST request
app.post("/petition", (req, res) => {
    console.log(" a Post request was made to /petition");
    //sending the cookie
    if (req.body.yes) {
        //sending the added data to the db
        db.addSignatureId(req.body.signature, req.session.user_id)
            .then((result) => {
                req.session.signatureId = result.rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("Error in adding Signature", err);
                res.render("petition", {
                    layout: "main",
                });
            });
    } else {
        res.redirect("/petition");
    }
    //validation
    if (!req.body.signature) {
        return res.render("/petition", {
            err: "No signature detected",
        });
    }
});

// register POST request
app.post("/register", (req, res) => {
    console.log("This was a POST request to the register route");
    // read the body
    const { first_name, last_name, email, password } = req.body;
    if (password) {
        //hash password
        hash(password)
            .then((password_hash) => {
                //hash the password
                db.saveUserRegistrationData({
                    first_name,
                    last_name,
                    email,
                    password_hash,
                })
                    .then((result) => {
                        req.session.user_id = result.rows[0].id;
                        res.redirect("/profile");
                    })
                    .catch((err) => {
                        console.log(
                            "Error in saving Users registration data",
                            err
                        );
                    });
            })
            .catch((err) => {
                console.log("error in hash", err);
            });
    }

    //validation;
    if (!first_name || !last_name || !email || !password) {
        return res.render("/register", {
            err: "An error occurred, please try again. ",
        });
    }
});

// login POST request
app.post("/login", (req, res) => {
    console.log("This was a POST request to the login route");
    const { email, password } = req.body;
    if (email) {
        db.retrivingUserEmail(email)
            .then((result) => {
                if (result) {
                    // Verifying Passwords:
                    compare(password, result.rows[0].password_hash)
                        .then((comparison) => {
                            // comparison will be true or false
                            if (comparison) {
                                console.log("comparisonr results", result);
                                req.session.user_id = result.rows[0].id;
                                req.session.signatureId =
                                    result.rows[0].signature;
                                res.redirect("/thanks");
                            } else {
                                if (!comparison) {
                                    return res.render("/login", {
                                        err: "Wrong Email Or Password",
                                    });
                                }
                            }
                        })
                        .catch((err) => {
                            console.log(
                                "Password Comparison does not match",
                                err
                            );
                        });
                }
            })
            .catch((err) => {
                console.log("Error in retriving Email", err);
            });

        //validation
        if (!email || !password) {
            return res.render("/login", {
                err: "No credentials found",
            });
        }
    }
});

//POST /profile route
app.post("/profile", (req, res) => {
    console.log("This was a POST request to the /profile route");
    const { age, city, url } = req.body;
    //check if age city, url entered then database insert
    if (req.session.user_id) {
        const prefixedURL = prefixURL(url);
        //adding user profile information to db
        db.addUserProfileInfo({ age, city, prefixedURL }, req.session.user_id)
            .then((result) => {
                console.log("result in storing user profile info", result);
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("Error in post profiles route", err);
            });
    }
    // otherwise redirect
    // } else if () {
    //     res.redirect("/thanks");
    // }
    // checking to see if a valid number was entered for age and throwing on page error.
    if (isNaN(age) && !age % 1 === 0) {
        res.render("/profile", {
            err: "Please enter a valid number only for age",
        });
    }
});

//POST /profile/edit request
app.post("/profile/edit", (req, res) => {
    console.log("This is a POST request to the /profile/edit route");
    const { password } = req.body;
    if (password) {
        console.log("REQ>BODY", req.body);
        console.log("made in into password if block");
        //hash password
        hash(password)
            .then((password_hash) => {
                console.log("made in into hashed password");
                console.log("Password hash", password_hash);
                //hash the password
                const {
                    first_name,
                    last_name,
                    email,
                    age,
                    city,
                    url,
                } = req.body;
                db.updateUsersFirstLastEmailAndPassword(
                    first_name,
                    last_name,
                    email,
                    password_hash,
                    req.session.user_id
                )
                    .then((result) => {
                        console.log(
                            "result in updating users age, city, url",
                            result
                        );
                        // UPSERT on user_profiles
                        db.upsertUserProfilesAgeCityUrl(
                            age,
                            city,
                            url,
                            req.session.user_id
                        )
                            .then((result) => {
                                console.log(
                                    "result in upsert for age, city, url",
                                    result
                                );
                                res.redirect("/thanks");
                            })
                            .catch((err) => {
                                console.log(
                                    "Error in upsert for age, city, url change",
                                    err
                                );
                            });
                    })
                    .catch((err) => {
                        console.log(
                            "Error in updating users age, city, url",
                            err
                        );
                    });
            })
            .catch((err) => {
                console.log("Error in hashing password", err);
            });
    } else {
        // runs if the user did not enter a new password
        if (req.session.user_id) {
            const { first_name, last_name, email, age, city, url } = req.body;
            db.updateUsersFirstLastEmail(
                first_name,
                last_name,
                email,
                req.session.user_id
            )
                .then((result) => {
                    console.log(
                        "result in updating users age, city, url",
                        result
                    );
                    // UPSERT on user_profiles
                    db.upsertUserProfilesAgeCityUrl(
                        age,
                        city,
                        url,
                        req.session.user_id
                    )
                        .then((result) => {
                            console.log(
                                "result in upsert for age, city, url",
                                result
                            );
                            res.redirect("/thanks");
                        })
                        .catch((err) => {
                            console.log(
                                "Error in upsert for age, city, url change",
                                err
                            );
                        });
                })
                .catch((err) => {
                    console.log("Error in updating users age, city, url", err);
                });
        }
    }
});

//POST request for /signature/delete route
app.post("/signature/delete", (req, res) => {
    console.log("This is a POST request to the signature/delete route");

    db.deleteSignature(req.session.user_id)
        .then((result) => {
            console.log("result in delete singature", result);
            req.session.signatureId = null;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("Error in delete signautre", err);
        });
});

app.listen(8080, () => console.log("Petition up and running"));
