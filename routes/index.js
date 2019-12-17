const session = require('express-session');
const MUUID = require('uuid-mongodb');

const {isLoggedIn} = require("../core/login");
const rootRoutes = require("./root");
const userRoutes = require("./user");

const constructorMethod = app => {
    app.use(session({
        name: 'AuthCookie',
        secret: 'meetmetatthetogaparty',
        resave: false,
        saveUninitialized: true,
        genid: function (request) {
            return MUUID.v4().toString()
        }
    }));

    app.use("/", rootRoutes);

    app.use("/:username", function (request, response, next) {
        if(isLoggedIn(request)) {
            next()
        } else {
            response.status(403);
            response.redirect("/")
        }
    });

    app.use("/:username", userRoutes);

    app.use("*", (request, response) => {
        response.status(404).json({error: "Route not found"});
    });
};

module.exports = constructorMethod;
