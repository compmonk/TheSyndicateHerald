const express = require("express");
const moment = require('moment');
const bodyParser = require("body-parser");

const {isLoggedIn} = require("../core/login");
const {newsapi} = require("../core/news");
const users = require("../data/users");
const sessions = require("../data/sessions");
const userNews = require("../data/userNews");
const jsonUtils = require("../public/js/jsonUtils");


const router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded());

// user home page
router.get("/", async (request, response) => {
    try {
        if (isLoggedIn(request)) {

            newsapi.sources({
                language: 'en',
                country: 'us'
            }).then(res => {
                let sources = res.sources.map(function (source) {
                    return {
                        id: source.id,
                        text: source.name
                    }
                });
                let sourcesSelected = request.session.user.sources.map(function (s) {
                    const source = sources.filter((x) => (x.id === s))[0];
                    return {
                        id: source.id,
                        text: source.text
                    }
                });
                console.log(JSON.parse(JSON.stringify(sourcesSelected)));
                response.render("user", {
                    user: request.session.user,
                    sources: sources,
                    sourcesSelected: JSON.stringify(sourcesSelected),
                    layout: 'user',
                    url: {
                        profile: `/${request.session.user.username}/`,
                        feed: `/${request.session.user.username}/feed`,
                        likes: `/${request.session.user.username}/likes`,
                        sessions: `/${request.session.user.username}/sessions`,
                        shared: `/${request.session.user.username}/shared`,
                        search: `/${request.session.user.username}/search`
                    }
                })
            });
        } else {
            response.redirect("/")
        }
    } catch (e) {
        response.status(500);
        response.render("error", {title: "Error"})
    }
});

router.post("/", async (request, response) => {
    try {
        if (request.body["sources"]) {
            request.session.user = await users.updateUser(request.session.userID, request.body["sources"], true);
        } else {
            request.session.user = await users.updateUser(request.session.userID, result);
        }

        response.redirect(`/${request.session.user.username}/feed`)
    } catch (e) {
        response.status(e.http_code).send(e.message);
    }
});


// user feeds
router.get("/feed", async (request, response) => {
    try {
        newsapi.v2.topHeadlines({
            sources: request.session.user.sources.join()
        }).then(res => {
            response.render("feed", {
                news: res["articles"].map(function (article) {
                    article.from = moment.duration(moment(article.publishedAt) - moment.now()).humanize(true)
                    return article
                }),
                layout: 'user',
                url: {
                    profile: `/${request.session.user.username}/`,
                    feed: `/${request.session.user.username}/feed`,
                    likes: `/${request.session.user.username}/likes`,
                    sessions: `/${request.session.user.username}/sessions`,
                    shared: `/${request.session.user.username}/shared`,
                    search: `/${request.session.user.username}/search`
                }
            })
        });
    } catch (e) {
        console.log(e)
    }
});

// user sessions
router.get("/sessions", async (request, response) => {
    const sessionsList = await sessions.getSessionByUserId(request.session.userID);
    response.render("sessions", {
        sessions: sessionsList,
        layout: 'user',
        url: {
            profile: `/${request.session.user.username}/`,
            feed: `/${request.session.user.username}/feed`,
            likes: `/${request.session.user.username}/likes`,
            sessions: `/${request.session.user.username}/sessions`,
            shared: `/${request.session.user.username}/shared`,
            search: `/${request.session.user.username}/search`
        }
    })
});

// user liked and disliked news
router.get("/likes", async (request, response) => {
    const likes = await users.getLiked(request.session.userID);
    response.render("likes", {
        likes: likes,
        layout: 'user',
        url: {
            profile: `/${request.session.user.username}/`,
            feed: `/${request.session.user.username}/feed`,
            likes: `/${request.session.user.username}/likes`,
            sessions: `/${request.session.user.username}/sessions`,
            shared: `/${request.session.user.username}/shared`,
            search: `/${request.session.user.username}/search`
        }
    })
});

// user shared news
router.get("/shared", async (request, response) => {
    const shared = await users.getShared(request.session.userID);
    response.render("shared", {
        shared: shared,
        layout: 'user',
        url: {
            profile: `/${request.session.user.username}/`,
            feed: `/${request.session.user.username}/feed`,
            likes: `/${request.session.user.username}/likes`,
            sessions: `/${request.session.user.username}/sessions`,
            shared: `/${request.session.user.username}/shared`,
            search: `/${request.session.user.username}/search`
        }
    })
});

// like news web api
router.post("/like", async (request, response) => {
    try {
        await userNews.likeNews(request.session.userID, request.param("newsId"));
    } catch (e) {
        response.status(e.http_code).send(e)
    }
});

// dislike news web api
router.post("/dislike", async (request, response) => {
    try {
        await userNews.dislikeNews(request.session.userID, request.param("newsId"));
    } catch (e) {
        response.status(e.http_code).send(e)
    }
});

// share news web api
router.post("/share", async (request, response) => {
    try {
        await userNews.shareNews(request.session.userID, request.param("receiverIds"), request.param("newsId"));
    } catch (e) {
        response.status(e.http_code).send(e)
    }
});

// search news page
router.get("/search", async (request, response) => {
    response.render("search", {
        layout: 'user',
        url: {
            profile: `/${request.session.user.username}/`,
            feed: `/${request.session.user.username}/feed`,
            likes: `/${request.session.user.username}/likes`,
            sessions: `/${request.session.user.username}/sessions`,
            shared: `/${request.session.user.username}/shared`,
            search: `/${request.session.user.username}/search`
        }
    })
});

// search news page
router.post("/search", async (request, response) => {
    const news = [];
    response.render("search", {
        news: news,
        layout: 'user',
        url: {
            profile: `/${request.session.user.username}/`,
            feed: `/${request.session.user.username}/feed`,
            likes: `/${request.session.user.username}/likes`,
            sessions: `/${request.session.user.username}/sessions`,
            shared: `/${request.session.user.username}/shared`,
            search: `/${request.session.user.username}/search`
        }
    })
});

module.exports = router;