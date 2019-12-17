const express = require("express");
const router = express.Router();

const {isLoggedIn} = require("../core/login");
const {newsapi} = require("../core/news");
const users = require("../data/users");
const sessions = require("../data/sessions");
const userNews = require("../data/userNews");

// user home page
router.get("/", async (request, response) => {
    try {
        if (isLoggedIn(request)) {
            let sources = [];
            newsapi.sources({
                language: 'en',
                country: 'us'
            }).then(res => {

                sources = res.sources.map(function (source) {
                    return {
                        id: source.id,
                        name: source.name,
                        description: source.description,
                        url: source.url
                    }
                });

                response.render("user", {
                    user: request.session.user,
                    sources: sources
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

// user feeds
router.get("/feed", async (request, response) => {
    try {
        // const user = await users.getUserById(request.session.userID, {"sources": true});
        newsapi.v2.topHeadlines({
            sources: 'bbc-news'
        }).then(res => {
            response.render("feed", {
                news: res["articles"]
            })
        });
    } catch (e) {
        console.log(e)
    }
});

// user sessions
router.get("/sessions", async (request, response) => {
    const sessionsList = await sessions.getSessionByUserId(request.session.userID);
    response.render("sessions", {sessions: sessionsList})
});

// user liked and disliked news
router.get("/likes", async (request, response) => {
    const likes = await users.getLiked(request.session.userID);
    response.render("likes", {likes: likes})
});

// user shared news
router.get("/shared", async (request, response) => {
    const shared = await users.getShared(request.session.userID);
    response.render("shared", {shared: shared})
});

// like news web api
router.post("/like", async (request, response) => {
    try {
        await userNews.likeNews(request.session.userID, request.param("newsId"));
    } catch (e) {
        response.status(400).json({errorMessage: e})
    }
});

// dislike news web api
router.post("/dislike", async (request, response) => {
    try {
        await userNews.dislikeNews(request.session.userID, request.param("newsId"));
    } catch (e) {
        response.status(400).json({errorMessage: e})
    }
});

// share news web api
router.post("/share", async (request, response) => {
    try {
        await userNews.shareNews(request.session.userID, request.param("receiverIds"), request.param("newsId"));
    } catch (e) {
        response.status(400).json({errorMessage: e})
    }
});

// search news page
router.get("/search", async (request, response) => {
    response.render("search")
});

// search news page
router.post("/search", async (request, response) => {
    const news = [];
    response.render("search", {news: news})
});

module.exports = router;