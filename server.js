//requiring packets
const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const SECRET_KEY =
    process.env.SECRET_KEY || require("./secrets.json").SECRET_KEY;
const { hash, compare } = require("./utils/bc.js");
module.exports.app = app;

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
    next();
});

////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////Get requests

app.get("/", (req, res) => {
    res.redirect("/register");
});

// login get request
app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
    });
});

// register get request
app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
    });
});

//profile GET request
app.get("/profile", (req, res) => {
    if (req.session.user_id) {
        res.render("profile", {
            layour: "main",
        });
    }
});

//petition(signature) page get request
app.get("/petition", (req, res) => {
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
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        db.getSignatureById(req.session.signatureId)
            .then((result) => {
                res.render("thanks", {
                    layout: "main",
                    signature: result.rows[0].signature,
                });
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

//signers page get request
app.get("/signers", (req, res) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else if (req.session.user_id) {
        if (req.session.signatureId) {
            db.getUserDataForSignersPage()
                .then((result) => {
                    res.render("signers", {
                        layout: "main",
                        dbdata: result.rows,
                    });
                })
                .catch((err) => {
                    console.log(err);
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
                res.render("signers", {
                    layout: "main",
                    dbdata: result.rows,
                    city,
                });
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

// GET profile/edit route
app.get("/profile/edit", (req, res) => {
    if (req.session.user_id) {
        db.getUpdatableUserData(req.session.user_id)
            .then((result) => {
                if (result.rows[0]) {
                    res.render("edit", {
                        layout: "main",
                        first_name: result.rows[0].first_name,
                        last_name: result.rows[0].last_name,
                        email: result.rows[0].email,
                        age: result.rows[0].age,
                        city: result.rows[0].city,
                        url: result.rows[0].url,
                    });
                }
            })
            .catch((err) => {
                console.log(err);
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
    if (req.body) {
        db.addSignatureId(req.body.signature, req.session.user_id)
            .then((result) => {
                req.session.signatureId = result.rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log(err);
                res.render("petition", {
                    layout: "main",
                });
            });
    } else {
        res.redirect("/petition");
    }
    //validation
    if (!req.body.signature) {
        return res.render("petition", {
            err: "No signature detected",
        });
    }
});

// register POST request
app.post("/register", (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    if (password) {
        hash(password)
            .then((password_hash) => {
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
                        console.log(err);
                    });
            })
            .catch((err) => {
                console.log(err);
            });
    }

    //validation;
    if (!first_name || !last_name || !email || !password) {
        return res.render("register", {
            err: "An error occurred, please try again.",
        });
    }
});

// login POST request
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (email) {
        db.retrivingUserEmail(email)
            .then((result) => {
                if (result) {
                    compare(password, result.rows[0].password_hash)
                        .then((comparison) => {
                            if (comparison) {
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
                            console.log(err);
                        });
                }
            })
            .catch((err) => {
                console.log(err);
            });

        //validation
        if (!email || !password) {
            return res.render("login", {
                err: "No credentials found",
            });
        }
    }
});

//POST /profile route
app.post("/profile", (req, res) => {
    const { age, city, url } = req.body;
    if (req.session.user_id) {
        if (age || city || url) {
            db.addUserProfileInfo({ age, city, url }, req.session.user_id)
                .then((result) => {
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log("Error in post profiles route", err);
                });
        }
        if (req.session.user_id) {
            if (!req.body.age || !req.body.city || !req.body.url) {
                db.addUserProfileInfo({ age, city, url }, req.session.user_id)
                    .then((result) => {
                        res.redirect("/petition");
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                res.redirect("/petition");
            }
        }
    }

    // checking to see if a valid number was entered for age and throwing on page error.
    if (isNaN(age) && !age % 1 === 0) {
        res.render("profile", {
            err: "Please enter a valid number for age",
        });
    }
});

//POST /profile/edit request
app.post("/profile/edit", (req, res) => {
    const { password } = req.body;
    if (password) {
        hash(password)
            .then((password_hash) => {
                const { first_name, last_name, email, age, city, url } =
                    req.body;
                db.updateUsersFirstLastEmailAndPassword(
                    first_name,
                    last_name,
                    email,
                    password_hash,
                    req.session.user_id
                )
                    .then((result) => {
                        db.upsertUserProfilesAgeCityUrl(
                            age,
                            city,
                            url,
                            req.session.user_id
                        )
                            .then((result) => {
                                res.redirect("/thanks");
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        if (req.session.user_id) {
            const { first_name, last_name, email, age, city, url } = req.body;
            db.updateUsersFirstLastEmail(
                first_name,
                last_name,
                email,
                req.session.user_id
            )
                .then((result) => {
                    db.upsertUserProfilesAgeCityUrl(
                        age,
                        city,
                        url,
                        req.session.user_id
                    )
                        .then((result) => {
                            res.redirect("/thanks");
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }
});

//POST request for /signature/delete route
app.post("/signature/delete", (req, res) => {
    db.deleteSignature(req.session.user_id)
        .then((result) => {
            req.session.signatureId = null;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log(err);
        });
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("Petition up and running")
    );
}
