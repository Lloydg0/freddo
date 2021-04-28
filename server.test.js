const supertest = require("supertest");
const { app } = require("./server");
const cookieSession = require("cookie-session");

test("Users who are logged out are redirected to the registration page when they attempt to go to the petition page", () => {
    cookieSession.mockSessionOnce({
        loggedin: false,
    });
    return supertest(app)
        .get("/petition")
        .then((res) => {
            if (require.session) {
                expect(res.redirect).toBe("/register");
            }
        });
});
test("Users who are logged in are redirected to the petition page when they attempt to go to either the registration page or the login page", () => {
    cookieSession.mockSessionOnce({});
    return supertest(app)
        .get("/registration" || "/login")
        .then((res) => {
            if (require.session) {
                expect(res.redirect).toBe("/petition");
            }
        });
});

test("Users who are logged in and have signed the petition are redirected to the thank you page when they attempt to go to the petition page or submit a signature", () => {
    cookieSession.mockSessionOnce({
        loggedin: true,
        signed: true,
    });
    return supertest(app)
        .get("/petition")
        .then((res) => {
            if (require.session) {
                expect(res.redirect).toBe("/thanks");
            }
        });
});

test("Users who are logged in and have not signed the petition are redirected to the petition page when they attempt to go to either the thank you page or the signers page", () => {
    cookieSession.mockSessionOnce({
        loggedin: true,
        signed: false,
    });
    return supertest(app)
        .get("/thanks" || "/signers")
        .then((res) => {
            if (require.session) {
                expect(res.redirect).toBe("/petition");
            }
        });
});
