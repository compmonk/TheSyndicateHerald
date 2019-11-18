const MUUID = require('uuid-mongodb');

const {isEmail} = require('validator/lib/isEmail');
const {isUUID} = require('validator/lib/isUUID');


const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(16);

const collections = require("./collection");

const users = collections.users;

async function addUser(newUser) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (newUser === undefined || newUser === null) {
        errors['user'] = "user object not defined";
        error.http_code = 400
    } else if (typeof newUser !== "object") {
        errors['user'] = "invalid type of user";
        error.http_code = 400
    }

    if (!newUser.hasOwnProperty("firstName")) {
        errors['firstName'] = "missing property";
        error.http_code = 400
    }

    if (!newUser.hasOwnProperty("lastName")) {
        errors['lastName'] = "missing property";
        error.http_code = 400
    }

    if (!newUser.hasOwnProperty("username")) {
        errors['username'] = "missing property";
        error.http_code = 400
    }

    if (!newUser.hasOwnProperty("email")) {
        errors['email'] = "missing property";
        error.http_code = 400
    }

    if (!isEmail("email")) {
        errors['email'] = "invalid type";
        error.http_code = 400
    }

    if (!newUser.hasOwnProperty("password")) {
        errors['password'] = "missing property";
        error.http_code = 400
    }

    if (error.http_code !== 200) {
        error.message = JSON.stringify({'errors': errors});
        throw error
    }


    newUser._id = MUUID.v4();
    newUser.hashedPassword = bcrypt.hashSync(newUser.password, salt);
    newUser.sources = [];
    newUser.categories = [];
    newUser.liked = [];
    newUser.disliked = [];
    newUser.sent = [];
    newUser.received = [];

    const usersCollection = await users();

    const insertInfo = await usersCollection.insertOne(newUser);

    if (insertInfo.insertedCount === 0) {
        error.message = JSON.stringify({
            'error': "could not create user",
            'object': newUser,
            'errors': errors
        });
        error.http_code = 400;
        throw error
    }

    const newId = insertInfo.insertedId.toString();

    return await getUserById(newId);
}

async function updateUser(userId, updatedUser) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (updatedUser === undefined || updatedUser === null) {
        errors['user'] = "user object not defined";
        error.http_code = 400
    } else if (typeof updatedUser !== "object") {
        errors['user'] = "invalid type of user";
        error.http_code = 400
    }

    if (error.http_code !== 200) {
        error.message = JSON.stringify({'errors': errors});
        throw error
    }

    try {
        await getUserById(userId);

        const usersCollection = await users();

        return await usersCollection.updateOne({_id: userId}, {$set: updatedUser})
            .then(async function (updateInfo) {
                if (updateInfo.nModified === 0) {
                    error.message = JSON.stringify({
                        'error': "could not update user",
                        'object': updatedUser,
                        'errors': errors
                    });
                    error.http_code = 400;
                    throw error
                }
                return await getUserById(userId);
            });
    } catch (e) {
        throw e
    }
}

async function getUserById(userId, ...projection) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (userId === undefined || userId === null) {
        errors['id'] = "id is not defined";
        error.http_code = 400
    }

    if (typeof userId === "string") {
        try {
            userId = MUUID.from(userId);
        } catch (e) {
            errors['id'] = e.message;
            error.http_code = 400;
            error.message = JSON.stringify({
                errors: errors
            });
            throw error
        }
    } else if (!isUUID(userId)) {
        errors['id'] = "id is not defined";
        error.http_code = 400;
        error.message = JSON.stringify({
            errors: errors
        });
        throw error
    }

    const usersCollection = await users();

    let user = null;
    if (projection.length) {
        user = await usersCollection.findOne({_id: userId}, {projection: projection});
    } else {
        user = await usersCollection.findOne({_id: userId}, {
            projection: {
                "hashedPassword": false,
                "liked": false,
                "disliked": false,
                "sent": false,
                "received": false
            }
        });
    }

    if (user === null) {
        errors['id'] = `user with id ${userId} doesn't exists`;
        error.http_code = 404;
        error.message = JSON.stringify({
            errors: errors
        });
        throw error
    }

    return user;
}

async function userExists(userId) {
    if (userId === undefined || userId === null) {
        return false
    }
    if (typeof userId === "string") {
        try {
            userId = MUUID.from(userId);
        } catch (e) {
            return false
        }
    } else if (!isUUID(userId)) {
        return false
    }

    const usersCollection = await users();
    return await usersCollection.findOne({_id: userId}) !== null;
}

async function usernameAvailable(username) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (username === undefined || username === null) {
        errors['username'] = "username object not defined";
        error.http_code = 400
    } else if (typeof username !== "object") {
        errors['username'] = "invalid type of user";
        error.http_code = 400
    }

    const usersCollection = await users();

    const user = await usersCollection.findOne({username: username});

    return user === null;
}

async function getLiked(userId) {
    try {
        return await getUserById(userId, {"liked": true})
    } catch (e) {
        throw e
    }
}

async function getShared(userId) {
    try {
        return await getUserById(userId, {"sent": true, "received": true});
    } catch (e) {
        throw e
    }
}

async function isAuthenticated(username, password) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (username === undefined || username === null) {
        errors['username'] = "username not defined";
        error.http_code = 400
    } else if (typeof username !== "string") {
        errors['username'] = "invalid type of username";
        error.http_code = 400
    }

    if (password === undefined || password === null) {
        errors['password'] = "password not defined";
        error.http_code = 400
    } else if (typeof password !== "string") {
        errors['password'] = "invalid type of password";
        error.http_code = 400
    }

    const usersCollection = await users();

    const user = await usersCollection.findOne({username: username});

    if (user === null) {
        errors['username'] = `user with username ${username} not found`;
        error.http_code = 404;
        error.message = JSON.stringify({
            errors: errors
        });
        throw error
    }

    if(!bcrypt.compareSync(password, user.hashedPassword)) {
        errors['password'] = "Invalid password";
        error.http_code = 403;
        error.message = JSON.stringify({
            errors: errors
        });
        throw error
    }

    return true;
}

module.exports = {
    addUser,
    updateUser,
    getUserById,
    usernameAvailable,
    userExists,
    getLiked,
    getShared,
    isAuthenticated
};