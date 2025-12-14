import mysql from "mysql";
import { logger } from "./logger";
const { makeDb } = require("mysql-async-simple");

const queryConfig = {
    host: process.env.WORDPRESS_URL,
    user: process.env.WORDPRESS_USER,
    password: process.env.WORDPRESS_PASSWORD,
    database: process.env.WORDPRESS_DATABASE
};

let connection = mysql.createConnection(queryConfig);
let db = makeDb();

export async function asyncWordpressQuery(sql: string) {
    try {
        connection = mysql.createConnection(queryConfig);
        db = makeDb();
        await db.connect(connection);
        logger.info("Successfully ran sql query against wordpress db.");
        return await db.query(connection, sql);
    } catch (error) {
        logger.error("SQL Error: ", error);
        return error;
    } finally {
        logger.warn("disconnected from wordpress.");
        await db.close(connection);
    }
}
