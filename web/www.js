const app = require("./app");
const http = require("http");
const MongoDriver = require("./modules/db");

const port = normalizePort(process.env.PORT || "3000");
const server = http.createServer(app);

app.set("port", port);

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
(async () => {
    try {
        await MongoDriver.connectDB();
    } catch(error) {
        // Logging 필요
        console.log(error);
        process.exit(1);
    }
    
    try {
        MongoDriver.createDummy();
    } catch(error) {
        // Logging 필요
        console.log(error);
        process.exit(1);
    }
})();


function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

function onError(error) {
    if(error.syscall !== "listen") {
        throw error;
    }

    const bind = typeof port === "string"
        ? `Pipe ${port}`
        : `Port ${port}`;
            
    switch(error.code) {
        case "EACCES":
            console.error(`${bind} requires elevated priviledges`);
            process.exit(1);
        case "EADDRINUSE":
            console.error(`${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
}

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}
