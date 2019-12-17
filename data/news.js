const MUUID = require('uuid-mongodb');
const uuidv1 = require('uuid/v1');

const collections = require("./collection");
const newsCollection = collections.news;

async function addNews(newNews) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (newNews === undefined || newNews === null) {
        errors['news'] = "news object not defined";
        error.http_code = 400
    } else if (typeof newNews !== "object") {
        errors['news'] = "invalid type of news";
        error.http_code = 400
    }

    if (!newNews.hasOwnProperty("source")) {
        errors['source'] = "missing property";
        error.http_code = 400
    }

    if (!(typeof newNews["source"] !== "object")) {
        errors['source'] = "invalid type";
        error.http_code = 400
    }

    if (!newNews.hasOwnProperty("author")) {
        errors['author'] = "missing property";
        error.http_code = 400
    }

    if (!newNews.hasOwnProperty("title")) {
        errors['title'] = "missing property";
        error.http_code = 400
    }

    if (!newNews.hasOwnProperty("description")) {
        errors['description'] = "missing property";
        error.http_code = 400
    }

    if (!newNews.hasOwnProperty("url")) {
        errors['url'] = "missing property";
        error.http_code = 400
    }

    if (!newNews.hasOwnProperty("urlToImage")) {
        errors['urlToImage'] = "missing property";
        error.http_code = 400
    }

    if (!newNews.hasOwnProperty("publishedAt")) {
        errors['publishedAt'] = "missing property";
        error.http_code = 400
    }

    if (!newNews.hasOwnProperty("content")) {
        errors['content'] = "missing property";
        error.http_code = 400
    }

    if (error.http_code !== 200) {
        error.message = JSON.stringify({'errors': errors});
        throw error
    }

    newNews._id = uuidv1({msecs: new Date(newNews.publishedAt).getTime()});
    newNews.likedBy = [];
    newNews.dislikedBy = [];

    const newsCollection = await news();

    const insertInfo = await newsCollection.insertOne(newNews);

    if (insertInfo.insertedCount === 0) {
        error.message = JSON.stringify({
            'error': "could not create news",
            'object': newNews,
            'errors': errors
        });
        error.http_code = 400;
        throw error
    }

    const newId = insertInfo.insertedId.toString();

    return await getNewsById(newId);

}

async function getNewsById(newsId) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (newsId === undefined || newsId === null) {
        errors['id'] = "id is not defined";
        error.http_code = 400
    }
    if (typeof newsId === "string") {
        try {
            newsId = MUUID.from(newsId);
        } catch (e) {
            errors['id'] = e.message;
            error.http_code = 400;
            error.message = JSON.stringify({
                errors: errors
            });
            throw error
        }
    } else if (!isUUID(newsId)) {
        errors['id'] = "id is not defined";
        error.http_code = 400;
        error.message = JSON.stringify({
            errors: errors
        });
        throw error
    }

    const newsCollection = await newsCollection();

    const news = await newsCollection.findOne({_id: newsId});

    if (news === null) {
        errors['id'] = `news with id ${newsId} doesn't exists`;
        error.http_code = 404;
        error.message = JSON.stringify({
            errors: errors
        });
        throw error
    }

    return news;
}

async function getNewsByPublishedAt(publishedAt) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (publishedAt === undefined || publishedAt === null) {
        errors['publishedAt'] = "publishedAt not defined";
        error.http_code = 400
    } else if (typeof publishedAt !== "string") {
        errors['publishedAt'] = "invalid type of publishedAt";
        error.http_code = 400
    }

    try {
        return await getNewsById(uuidv1({msecs: new Date(publishedAt).getTime()}))
    } catch (e) {
        throw e
    }
}

async function updateNews(newsId, updatedNews) {
    const error = new Error();
    error.http_code = 200;
    const errors = {};

    if (updatedNews === undefined || updatedNews === null) {
        errors['news'] = "news object not defined";
        error.http_code = 400
    } else if (typeof updatedNews !== "object") {
        errors['news'] = "invalid type of news";
        error.http_code = 400
    }

    if (error.http_code !== 200) {
        error.message = JSON.stringify({'errors': errors});
        throw error
    }

    try {
        await getNewsById(newsId);

        const newsCollection = await news();

        return await newsCollection.updateOne({_id: newsId}, {$set: updatedNews})
            .then(async function (updateInfo) {
                if (updateInfo.nModified === 0) {
                    error.message = JSON.stringify({
                        'error': "could not update news",
                        'object': updatedNews,
                        'errors': errors
                    });
                    error.http_code = 400;
                    throw error
                }
                return await getNewsById(newsId);
            });
    } catch (e) {
        throw e
    }
}

module.exports = {
    addNews,
    getNewsById,
    getNewsByPublishedAt,
    updateNews
};