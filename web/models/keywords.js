const mongoose = require("mongoose");

const keywordsSchema = new mongoose.Schema({
    keyword: { type: String, required: true, unique: true },
    lastModified: { type: Date, required: false, default: undefined },
    relatedKeywords: { type: String, required: false, default: undefined },
});

module.exports = mongoose.model("Keywords", keywordsSchema);