const path = require("path");

const cse = require("../modules/cse");
const sc = require("../modules/spawn-child");
const MongoDriver = require("../modules/db");

const CACHE_LIMIT = 10000; // test. 캐시기간 10초

const retBodies = {
    cachedKeywords: {
        resultCode: 200,
        resultMsg: "Cached Keywords returned",
        resultBody: null,
    },
    newlyCreatedKeywords: {
        resultCode: 203,
        resultMsg: "Newly Created Keywords returned",
        resultBody: null,
    }
}

module.exports = {
    async search(req, res, next) {
        console.log(req.query);
        let word = req.query.word;
        const regex = /^[가-힣a-zA-Z0-9]+$/;
        word = regex.exec(word);

        // Search DB first
        // If cache is valid, use the cache
        const opt = { keyword: word };
        let cache = null;
        try {
            cache = await MongoDriver.findOne(opt);
        } catch(error) {
            return next(error);
        }

        // Check cache is valid
        if(cache && (Date.now() -  cache.lastModified <= CACHE_LIMIT)) {
            const retBody = retBodies.cachedKeywords;
            retBody.resultBody = JSON.stringify(cache);
            return res.status(200).json(retBody);
        }


        // Google Custom Search Engine
        word = encodeURIComponent(word);
        let items;
        try {
            items = await cse.run();
        } catch(error) {
            console.log("[Axios] axios.get error");
            console.log(error);
            return next(error);
        }
        const urls = cse.extractUrls(items);


        // Child crawler process spawn
        const crawlerPath = path.join(__dirname, "../../crawler/crawler.py");
        const cmd = "python";
        const crawler = sc.spawnPython(cmd, crawlerPath, urls);

        crawler.stdout.on("data", (data) => {
            console.log(`[Python] ${data.toString()}`);
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
            console.log("[Spawn] crawler spawn error");
            console.log(error);
            next(error);
        });
    },
}