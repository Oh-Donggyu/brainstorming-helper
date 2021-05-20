const express = require("express");

const searchController = require("../controllers/searchController");
const router = express.Router();

router.get("/", (req, res, next) => {
    res.render("index", { title: "Brainstorming Helper" });
});
router.get("/search", searchController.search);

module.exports = router;