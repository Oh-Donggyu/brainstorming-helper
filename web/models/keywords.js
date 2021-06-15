const mongoose = require("mongoose");

const keywordsSchema = new mongoose.Schema({
    keyword: { type: String, required: true, unique: true },
    lastModified: { type: String, required: true, default: undefined },
    relatedKeywords: { type: String, required: true, default: undefined },
});

module.exports = mongoose.model("Keywords", keywordsSchema);
