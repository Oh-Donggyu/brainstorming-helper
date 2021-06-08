const mongoose = require("mongoose");
const secrets = require("../secrets.json");
const Keywords = require("../models/keywords");
const CustomError = require("../errors");

const DB_URL = secrets.DB_URL;
const DB_PORT = secrets.DB_PORT;

class MongoDriver {
    static async connectDB() {
        try {
            await mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
            console.log("[MongoDB] Connection Success");
        } catch(error) {
            console.log("[MongoDB] Connection Error");
            throw new CustomError("DB Connection Error", 500);
        }
    }

    static async findOne(opt) {
        let result = null;
        try {
            result = await Keywords.findOne(opt);
        } catch(error) {
            console.log("[MongoDB] FindOne Error");
            throw new CustomError("DB FindOne Error", 500);
        }
        return result;
    }

    static async watchDocument(word) {
        const opt = [
            { $match: { keyword: word } }
        ];

        // const collection = mongoose.collection("Keywords");
        const changeStreamIterator = Keywords.watch(opt);
        const next = await changeStreamIterator.next();

        console.log(next);
    }
    
    static async updateDocument(word, values) {
        const filter = { keyword: word };
        const updateDoc = {
            $set: {
                relatedKeywords: values,
            },
        };
        
        try {
            await Keywords.updateOne(filter, updateDoc);
        } catch(error) {
            throw new CustomError("Collection Update Error", 500);
        }
    }

    static async createDummy() {
        const relatedKeywords = {
            "가나다라": 12.91,
            "마바사": 123.11,
            "아자차카": 11.00,
            "타파하": 1.6,
        };
    
        const newkeyword = new Keywords({
            keyword: "남관우",
            lastModified: Date.now(),
            relatedKeywords: JSON.stringify(relatedKeywords),
        });
        
        let res = null;
        try {
            res = await Keywords.findOne({ keyword: "남관우" });
        } catch(error) {
            console.log("[MongoDB] Dummy FindOne Error");
            throw new CustomError("Dummy FindOne Error", 500);
        }

        try {
            if(res) {
                await Keywords.deleteOne({ keyword: "남관우" });
                console.log("[MongoDB] Delete Exist Dummy Success");
            }
        } catch(error) {
            throw new CustomError("Delete Exist Dummy Error", 500);
        }

        try {
            await newkeyword.save();
        } catch(error) {
            console.log("[MongoDB] Dummy create error");
            throw new CustomError("Create Dummy Error", 500);
        }
    }
}

module.exports = MongoDriver;