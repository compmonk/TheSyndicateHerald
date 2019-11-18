const MUUID = require('uuid-mongodb');

const {isUUID} = require('validator/lib/isUUID');

const collections = require("./collection");

const sessions = collections.sessions;
const users = require("./users");

async function addSession(sessionId, userId) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (sessionId === undefined || sessionId === null) {
        errors['sessionId'] = "sessionId is not defined";
        error.http_code = 400
    }

    if (typeof sessionId === "string") {
        try {
            sessionId = MUUID.from(sessionId);
        } catch (e) {
            errors['sessionId'] = e.message;
            error.http_code = 400;
            error.message = JSON.stringify({
                errors: errors
            });
            throw error
        }
    } else if (!isUUID(sessionId)) {
        errors['sessionId'] = "sessionId is not defined";
        error.http_code = 400;
        error.message = JSON.stringify({
            errors: errors
        });
        throw error
    }

    try {
        const user = await users.getUserById(userId);

        const sessionsCollection = await sessions();
        let session = {
            "_id": MUUID.from(sessionId),
            "userId": user._id,
            "startTime": new Date(),
            "isActive": true
        };

        const insertInfo = await sessionsCollection.insertOne(session);

        if (insertInfo.insertedCount === 0) {
            error.message = JSON.stringify({
                'error': "could not create session",
                'object': session,
                'errors': errors
            });
            error.http_code = 400;
            throw error
        }

        const newId = insertInfo.insertedId.toString();

        return await getSession(newId);

    } catch (e) {
        throw e
    }
}

async function getSession(sessionId) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (sessionId === undefined || sessionId === null) {
        errors['id'] = "sessionId is not defined";
        error.http_code = 400
    }

    if (typeof sessionId === "string") {
        try {
            sessionId = MUUID.from(sessionId);
        } catch (e) {
            errors['id'] = e.message;
            error.http_code = 400;
            error.message = JSON.stringify({
                errors: errors
            });
            throw error
        }
    } else if (!isUUID(sessionId)) {
        errors['id'] = "sessionId is not defined";
        error.http_code = 400;
        error.message = JSON.stringify({
            errors: errors
        });
        throw error
    }

    const sessionsCollection = await sessions();

    const session = await sessionsCollection.findOne({_id: sessionId});

    if (session === null) {
        errors['id'] = `news with id ${sessionId} doesn't exists`;
        error.http_code = 404;
        error.message = JSON.stringify({
            errors: errors
        });
        throw error
    }

    return session;
}

async function endSession(sessionId) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (await isSessionValid(sessionId)) {
        let session = await getSession(sessionId);
        session.isActive = false;
        session.endTime = new Date();

        const sessionsCollection = await sessions();

        return await sessionsCollection.updateOne({_id: sessionId}, {$set: session})
            .then(async function (updateInfo) {
                if (updateInfo.nModified === 0) {
                    error.message = JSON.stringify({
                        'error': "could not end session",
                        'object': session,
                        'errors': errors
                    });
                    error.http_code = 400;
                    throw error
                }
            });
    }
}

async function isSessionValid(sessionId) {
    try {
        const session = await getSession(sessionId);
        return session.isActive;
    } catch (e) {
        return false
    }
}

async function getSessionByUserId(userId) {
    try {
        const user = await users.getUserById(userId);
        const sessionsCollection = await sessions();
        return  await sessionsCollection.find(
            {userId: user._id},
            {projection:{"_id": false}}
            ).toArray();
    } catch (e) {
        throw e
    }
}

module.exports = {
    addSession,
    endSession,
    isSessionValid,
    getSessionByUserId
};