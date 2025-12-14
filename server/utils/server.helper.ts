import cors from "cors";
import express, { Express } from "express";
import passport from "passport";
import { logger } from "../utils/logger";
import authRouter from "../routers/auth.router";
import cookieSession from "cookie-session";
import wordpressRouter from "../routers/wordpress.router";
import reportsRouter from "../routers/reports.router";
import collectionRouter from "../routers/collection.router";
import registrationRouter from "../routers/registrations.router";
import createEntityRouter from "../routers/create-entity.router";
import guestRouter from "../routers/guest.router";

const init = (app: Express) => {
    logger.info(`Add middleware for json parser.`);
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb" }));

    logger.info(`Add middleware for cookie session.`);
    app.use(
        cookieSession({
            name: "session",
            keys: ["openreplay"],
            maxAge: 24 * 60 * 60 * 100
        })
    );

    logger.info(`Add middleware for session.`);
    app.use(function (request, response, next) {
        if (request.session && !request.session.regenerate) {
            request.session.regenerate = (cb: () => void) => {
                cb();
            };
        }
        if (request.session && !request.session.save) {
            request.session.save = (cb: () => void) => {
                cb();
            };
        }
        next();
    });

    logger.info(`Add middleware for passport.`);
    app.use(passport.initialize());
    app.use(passport.session());

    logger.info(`Register cors domain: ${process.env.CLIENT_URL}`);
    const corsOptions = {
        origin: [process.env.CLIENT_URL as string],
        optionsSuccessStatus: 204,
        credentials: true
    };
    app.use(cors(corsOptions));

    logger.info(`Add health check route.`);
    app.get("/health-check", (_, res) => res.status(200).json({ status: "ok" }));

    logger.info(`Add auth routes.`);
    app.use(`${process.env.VHOST_PREFIX}/auth`, authRouter);

    logger.info(`Add wordpress routes.`);
    app.use(`${process.env.VHOST_PREFIX}/wordpress`, wordpressRouter);

    logger.info(`Add reports routes.`);
    app.use(`${process.env.VHOST_PREFIX}/reports`, reportsRouter);

    logger.info(`Add collection routes.`);
    app.use(`${process.env.VHOST_PREFIX}/collection`, collectionRouter);

    logger.info(`Add create entity routes.`);
    app.use(`${process.env.VHOST_PREFIX}/create`, createEntityRouter);

    logger.info(`Add registration routes.`);
    app.use(`${process.env.VHOST_PREFIX}/registration`, registrationRouter);

    logger.info(`Add guest routes.`);
    app.use(`${process.env.VHOST_PREFIX}/guest`, guestRouter);
};

export { init };
