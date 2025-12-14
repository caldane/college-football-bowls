import "dotenv/config";
import express from "express";
import https from "https";
import fs from "fs";
import { connect } from "./utils/db";
import { logger } from "./utils/logger";
import { init } from "./utils/server.helper";
import path from "path";

require("https").globalAgent.options.rejectUnauthorized = false;

const app = express();
const port = process.env.SERVER_PORT;

init(app);
app.get("/", (_, res) => {
    res.send("Hello");
});

const sslServer = https.createServer(
    {
        key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
        cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem"))
    },
    app
);

sslServer.listen(port, async () => {
    logger.env();
    logger.info(`App is running on PORT ${port}`);
    await connect();
});
