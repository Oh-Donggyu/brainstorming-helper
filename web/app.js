const express = require("express");
const createError = require("http-errors");
const { resolve } = require("path");
const path = require("path");
const CustomError = require("./errors");

const app = express();

const indexRouter = require("./routers/index");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

app.use((req, res, next) => {
    next(createError(404));
});

app.use((err, req, res, next) => {
    res.locals.error = req.app.get("env") === "development" ? err : {};

    if(err instanceof CustomError) {
        res.locals.errMsg = err.description;
        res.status(err.httpStatusCode).render("error");
    } else {
        res.locals.errMsg = err.message;
        res.status(err.status || 500).render("error");
    }
});

module.exports = app;

