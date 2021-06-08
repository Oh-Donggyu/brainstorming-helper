const axios = require("axios");
const secrets = require("../secrets.json");
const CustomError = require("../errors");

const KEY = secrets.KEY;
const CX = secrets.CX;
const REQ_PAGE_SIZE = 10;

class GoogleCustomSearch {
    static async run(word, startPage) {
        const c2coff = 1;           // chinese off
        const filter = 1;           // Enable duplicated content filter
        const exactTerms = word;
        const lr = "lang_kr";       // Restrict documents wrote in korean
        // start : start index of cse return values
        // num : number of cse return values
    
        let query = `key=${KEY}&cx=${CX}&`;
        query += `c2coff=${c2coff}&`;
        query += `filter=${filter}&`;
        query += `exactTerms=${exactTerms}&`;
        query += `lr=${lr}&`;

        const curQuery = `${query}&start=${startPage}&num=${REQ_PAGE_SIZE}`;
    
        const config = {
            method: "get",
            url: `https://www.googleapis.com/customsearch/v1?${curQuery}`,
            type: "application/json",
        };

        let res;
        try {
            res = await axios(config); // if search result doesn't exist, res is undefined
        } catch(error) {
            throw new CustomError("Google CSE Request Error", 500);
        }

        // if search result exists
        if(res)
            return res.data.items;
        else
            return [];

    
        // let items = [];
        // let curPages = 0;
        // while(curPages < TOTAL_PAGE) {
        //     const curQuery = `${query}&start=${curPages+1}&num=${REQ_PAGE_SIZE}`;
    
        //     const config = {
        //         method: "get",
        //         url: `https://www.googleapis.com/customsearch/v1?${curQuery}`,
        //         type: "application/json",
        //     };
    
        //     let res;
        //     try {
        //         res = await axios(config); // if search result doesn't exist, res is undefined
        //     } catch(error) {
        //         throw new CustomError("Google CSE Request Error", 500);
        //     }
    
        //     // if search result exists
        //     if(res) {
        //         const curItems = res.data.items;
        //         Array.prototype.push.apply(items, curItems);
                
        //         // type of request, nextPage, previousPage of Google CSE return value is array.
        //         const reqContext = res.data.queries.request[0];
        //         let nextPageContext = null;
        //         if(res.data.queries.nextPage) {
        //             nextPageContext = res.data.queries.nextPage[0];
        //         }
    
        //         if(!nextPageContext) {
        //             curPages += reqContext.count;
        //             break;
        //         }
        //         else
        //             curPages += REQ_PAGE_SIZE;
        //     } else
        //         break;
        // }
    
        // return items;
    }

    static extractUrls(items) {
        let urls = null;
        if(items)
            urls = items.map(n => n.link);
        return urls;
    }
}


module.exports = GoogleCustomSearch;