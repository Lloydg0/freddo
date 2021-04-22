//requiring packets
const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const { SECRET_KEY } = require("./secrets.json");
const { hash, compare } = require("./utils/bc.js");

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

    if (!req.session.signatureId && req.url !== "/petition") {
        res.redirect("/petition");
    } else {
        next();
    }
});
////////////////////////////////////////////////////////////////

//Get request
app.get("/petition", (req, res) => {
    console.log("a GET request was made to /petition Route");
    // res.session.signature-id
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main",
        });
    }
});

app.get("/thanks", (req, res) => {
    console.log("a GET request was made to /thanks Route");
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        //getting the signature from the ID and allowing it to be rendered
        db.getSignatureById(req.session.signatureId).then((result) => {
            console.log(result);
            res.render("thanks", {
                layout: "main",
                signature: result.rows[0].signature,
            }).catch((err) => {
                console.log("error in signature render", err);
            });
        });
    }
});

app.get("/signers", (req, res) => {
    console.log("a GET request was made to /signers Route");
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        // SELECT first_name AND last_name FROM signatures
        db.getData()
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
});

//POST request
app.post("/petition", (req, res) => {
    console.log(" a Post request was made to /petition");
    //sending the cookie
    if (req.body.yes) {
        console.log("req URL: ", req.url);
        //sending the added data to the db
        db.addData(req.body)
            .then((result) => {
                // console.log("result: ", result);
                req.session.signatureId = result.rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                //insert validation error TODO
                console.log("Error in adding Data", err);
                res.render("petition", {
                    layout: "main",
                });
            });
    } else {
        res.redirect("/petition");
    }
});

app.listen(8080, () => console.log("Petition up and running"));
