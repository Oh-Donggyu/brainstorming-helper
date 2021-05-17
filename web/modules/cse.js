const axios = require("axios");

const KEY = "AIzaSyAEUJnBOP6BmMgSN2cGzDT8X0nCibuN9Zk";
const CX = "81e3534b2ea929781";
const REQ_PAGE_SIZE = 10;
const TOTAL_PAGE = 30;

async function run(word) {
    let query = `key=${KEY}&cx=${CX}&`;
    query += "c2coff=1&";               // chinese off
    query += "filter=1&"                // Enable duplicated content filter
    query += `exactTerms=${word}&`;
    query += "lr=lang_kr&";             // Restrict documents wrote in korean
    // query += "start=1&";             // start index of total search result
    // query += "num=10&";              // Number of returned values. valid value is 1 to 10

    let items = [];
    let curPages = 0;
    while(curPages < TOTAL_PAGE) {
        const curQuery = `${query}&start=${curPages+1}&num=${REQ_PAGE_SIZE}`;

        const config = {
            method: "get",
            url: `https://www.googleapis.com/customsearch/v1?${curQuery}`,
            type: "application/json",
        };

        let res;
        try {
            res = await axios(config); // if search result doesn't exist, res is undefined
        } catch(error) {
            throw Error(error);
        }

        // if search result exists
        if(res) {
            const curItems = res.data.items;
            Array.prototype.push.apply(items, curItems);
            
            // type of request, nextPage, previousPage of Google CSE return value is array.
            const reqContext = res.data.queries.request[0];
            let nextPageContext = null;
            if(res.data.queries.nextPage) {
                nextPageContext = res.data.queries.nextPage[0];
            }

            if(!nextPageContext) {
                curPages += reqContext.count;
                break;
            }
            else
                curPages += REQ_PAGE_SIZE;
        } else
            break;
    }

    return items;
}

function extractUrls(items) {
    let urls = null;
    if(items)
        urls = items.map(n => n.link);
    return urls;
}


module.exports = {
    run,
    extractUrls,
};