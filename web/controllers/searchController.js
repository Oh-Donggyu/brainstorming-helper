const GoogleCustomSearch = require("../services/google-custom-search");
const MongoDriver = require("../services/db");
const { KafkaDriver, keywordResMap } = require("../services/kafka");

const TOTAL_URLS = 30;
const CACHE_LIMIT = 1; // test. 캐시기간 1초

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
const PRODUCER_TOPIC = "urls";
const CUSTOMER_TOPIC = "tfidfResults"; // TODO: 토픽명 확인

module.exports = {
    index(req, res, next) {
        res.render("index", { title: "Brainstorming Helper" });
    },

    async search(req, res, next) {
        console.log(req.query);
        let word = req.query.word; // WARNING: req.query.word is object. not string
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

        // Create topic if not exist before send message
        try {
            await KafkaDriver.createTopic(PRODUCER_TOPIC);
        } catch(error) {
            console.log(error);
            return next(error);
        }

        // Remember keyword - res object pair until tf-idf calculated
        // If the keyword is already in process, just add res object to value array
        // If not, create key-value pair and insert
        if(keywordResMap.has(word)) {
            const resArr = keywordResMap.get(word);
            resArr.push(res);
        } else {
            const resArr = new Array();
            resArr.push(res);
            keywordResMap.set(word[0], resArr);
        }

        // Google Custom Search Engine
        const encodedWord = encodeURIComponent(word);
        let urlCount = 0;
        let items;
        while(urlCount < TOTAL_URLS) { // TODO: 429 에러 안뜨는지 확인
            try {
                items = await GoogleCustomSearch.run(encodedWord, urlCount+1);
            } catch(error) {
                console.log(error);
                return next(error);
            }
            let urls = GoogleCustomSearch.extractUrls(items);

            // urls array to one string format
            let urlsString = "";
            for(const url of urls)
                urlsString += `${url} `;

            const message = {
                key: word,
                value: urlsString,
            };
            // Send urls to kafka urls topic
            try {
                await KafkaDriver.sendMessage(PRODUCER_TOPIC, message);
            } catch(error) {
                console.log(error);
                return next(error);
            }

            urlCount += urls.length;
        }








        // // Child crawler process spawn
        // const crawlerPath = path.join(__dirname, "../../crawler/crawler.py");
        // const cmd = "python";
        // const crawler = sc.spawnPython(cmd, crawlerPath, urls);

        // crawler.stdout.on("data", (data) => {
        //     console.log(`[Python] ${data.toString()}`);
        // });
        // crawler.on("close", async (code) => {
        //     console.log(`crawler processing done with exit code ${code}`);
        //     setTimeout(() => {
        //         MongoDriver.updateDocument(word, "남관우 12.9 오동규 11.1 김하랑 154.1");
        //     }, 2000);

        //     await MongoDriver.watchDocument(word);

        //     res.status(200).json(body);
        // });
        // crawler.on("error", (error) => {
        //     console.log("[Spawn] crawler spawn error");
        //     console.log(error);
        //     next(error);
        // });
    },
}