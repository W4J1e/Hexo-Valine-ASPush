"use strict";
const router = require("express").Router();
const AV = require("leanengine");
const mail = require("../utilities/send-mail");
const spam = require("../utilities/check-spam");
const moment = require("moment");
const Comment = AV.Object.extend("Comment");

// Comment 列表
router.get("/", function (req, res, next) {
  if (req.currentUser) {
    console.log("成功登录了后台！", new Date());
    const query = new AV.Query(Comment);
    query.descending("createdAt");
    query.limit(50);
    query
      .find()
      .then(
        function (results) {
          res.render("comments", {
            title: process.env.SITE_NAME + "上的评论",
            comment_list: results,
            moment: moment,
            zone: String(process.env.LEANCLOUD_REGION),
            favicon: process.env.FAVICON
              ? process.env.FAVICON
              : "https://cdn.jsdelivr.net/gh/sviptzk/StaticFile_HEXO@v3.2.3/butterfly/img/favicon.ico",
          });
        },
        function (err) {
          if (err.code === 101) {
            res.render("comments", {
              title: process.env.SITE_NAME + "上的评论",
              comment_list: [],
              favicon: process.env.FAVICON
                ? process.env.FAVICON
                : "https://cdn.jsdelivr.net/gh/sviptzk/StaticFile_HEXO@v3.2.3/butterfly/img/favicon.ico",
            });
          } else {
            next(err);
          }
        }
      )
      .catch(next);
  } else {
    console.log("有用户成功找到了后台地址！", new Date());
    res.redirect("/", {
      favicon: process.env.FAVICON
        ? process.env.FAVICON
        : "https://cdn.jsdelivr.net/gh/sviptzk/StaticFile_HEXO@v3.2.3/butterfly/img/favicon.ico",
    });
  }
});

router.get("/resend-email", function (req, res, next) {
  if (req.currentUser) {
    const query = new AV.Query(Comment);
    query
      .get(req.query.id)
      .then(
        function (object) {
          query
            .get(object.get("rid"))
            .then(
              function (parent) {
                mail.send(object, parent);
                res.redirect("/comments");
              },
              function (err) {}
            )
            .catch(next);
        },
        function (err) {}
      )
      .catch(next);
  } else {
    res.redirect("/");
  }
});

router.get("/delete", function (req, res, next) {
  if (req.currentUser) {
    const query = new AV.Query(Comment);
    query
      .get(req.query.id)
      .then(
        function (object) {
          object.destroy();
          res.redirect("/comments");
        },
        function (err) {}
      )
      .catch(next);
  } else {
    res.redirect("/", {
      favicon: process.env.FAVICON
        ? process.env.FAVICON
        : "https://cdn.jsdelivr.net/gh/sviptzk/StaticFile_HEXO@v3.2.3/butterfly/img/favicon.ico",
    });
  }
});

router.get("/not-spam", function (req, res, next) {
  if (req.currentUser) {
    const query = new AV.Query(Comment);
    query
      .get(req.query.id)
      .then(
        function (object) {
          object.set("isSpam", false);
          object.set("ACL", { "*": { read: true } });
          object.save();
          spam.submitHam(object);
          res.redirect("/comments");
        },
        function (err) {}
      )
      .catch(next);
  } else {
    res.redirect("/");
  }
});
router.get("/mark-spam", function (req, res, next) {
  if (req.currentUser) {
    const query = new AV.Query(Comment);
    query
      .get(req.query.id)
      .then(
        function (object) {
          object.set("isSpam", true);
          object.set("ACL", { "*": { read: false } });
          object.save();
          spam.submitSpam(object);
          res.redirect("/comments");
        },
        function (err) {}
      )
      .catch(next);
  } else {
    res.redirect("/");
  }
});

module.exports = router;
