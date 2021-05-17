const express = require("express");
const path = require("path");

const cse = require("../modules/cse");
const sc = require("../modules/spawn-child");

const router = express.Router();

router.get("/", (req, res, next) => {
    res.render("index");
});

router.get("/search", async (req, res, next) => {
    console.log(req.query);
    let word = req.query.word;
    const regex = /^[가-힣a-zA-Z0-9]+$/;
    word = regex.exec(word);
    word = encodeURIComponent(word);

    let items;
    try {
        items = await cse.run();
    } catch(error) {
        console.log("[axios] axios.get error");
        console.log(error);
        return next(error);
    }
    const urls = cse.extractUrls(items);

    const crawlerPath = path.join(__dirname, "../../crawler/crawler.py");
    const cmd = "python";
    const crawler = sc.spawnPython(cmd, crawlerPath, urls);

    crawler.stdout.on("data", (data) => {
        console.log(`[python] ${data.toString()}`);
    });
    crawler.on("close", (code) => {
        console.log(`crawler processing done with exit code ${code}`);
        const body = {
            resultCode: "200",
            resultMsg: "success",
        };
        res.status(200).json(body);
    });
    crawler.on("error", (error) => {
        console.log("[spawn] crawler spawn error");
        console.log(error);
        next(error);
    });
});

module.exports = router;