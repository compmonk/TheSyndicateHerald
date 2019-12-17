const sessions = require("../data/sessions");

const isLoggedIn = function (request) {
    return !!(request.session.user && sessions.isSessionValid(request.sessionID));
};

module.exports = {
  isLoggedIn
};