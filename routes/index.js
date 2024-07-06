import express from "express";

const router = express.Router();
let username = "anonymous"

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Yay node!", greeting:`Hello ${username}` });
});


export default router;
