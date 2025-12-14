import { Router } from "express";
import { logger } from "../utils/logger";
import { getGuests, getPanelSchedule, getPanelTracks, getTracks } from "../utils/db";
import { objectToSql } from "../utils/sql.utils";
import { SqlCommands } from "../../common/models/sql.model";
import { asyncWordpressQuery } from "../utils/wordpress.utils";

const wordpressRouter = Router();

wordpressRouter.post("/guests", async (req, res) => {
    try {
        logger.info(`update dev Soonercon wordpress db [sc_guests] request from: ${req.ip}`);
        const [guestData, guestSocialData] = await getGuests();
        const guestSql = objectToSql(guestData, SqlCommands.INSERT, {
            tableName: "sc_guests"
        });
        const socialSql = objectToSql(guestSocialData, SqlCommands.INSERT, {
            tableName: "sc_guest_socials"
        });
        logger.info("Deleting old guests from wordpress db.");
        await asyncWordpressQuery("DELETE FROM sc_guests");
        await asyncWordpressQuery("DELETE FROM sc_guest_socials");
        logger.info("Inserting new guests into wordpress db.");
        const results = await asyncWordpressQuery(guestSql);
        await asyncWordpressQuery(socialSql);

        logger.info("update wordpress completed.");
        res.send(results);
    } catch (error) {
        logger.warn("sql disconnected.");
        res.sendStatus(500);
    }
});

wordpressRouter.post("/tracks", async (req, res) => {
    try {
        logger.info(`update dev Soonercon wordpress db [sc_tracks] request from: ${req.ip}`);
        const trackData = await getTracks();
        trackData.unshift({ id: "1", track: "Everything", slug: "everything" });
        trackData.unshift({ id: "2", track: "Gaming Room", slug: "/gaming" });
//        trackData.unshift({ id: "3", track: "Workshops", slug: "/programming/workshops/" });
        trackData.unshift({ id: "4", track: "Latercon [emoji_devil]", slug: "latercon" });
        const sql = objectToSql(trackData, SqlCommands.INSERT, {
            tableName: "sc_tracks"
        });
        logger.info("Deleting old tracks from wordpress db.");
        await asyncWordpressQuery("DELETE FROM sc_tracks");
        logger.info("Inserting new tracks into wordpress db.");
        const results = await asyncWordpressQuery(sql);
        logger.info("update wordpress completed.");
        res.send(results);
    } catch (error) {
        logger.warn("sql disconnected.");
        res.sendStatus(500);
    }
});

wordpressRouter.post("/panel-schedule", async (req, res) => {
    try {
        logger.info(`update dev Soonercon wordpress db [sc_panelsTracks] and [sc_panels] request from: ${req.ip}`);
        const panelData = await getPanelSchedule();
        const panelTracksData = await getPanelTracks();

        const panelSql = objectToSql(panelData, SqlCommands.INSERT, {
            tableName: "sc_panels"
        });
        const panelTracksSql = objectToSql(panelTracksData, SqlCommands.INSERT, {
            tableName: "sc_panelsTracks"
        });
        logger.info("Deleting old panels from wordpress db.");
        await asyncWordpressQuery("DELETE FROM sc_panels");

        logger.info("Inserting new panels into wordpress db.");
        const results = await asyncWordpressQuery(panelSql);
        
        logger.info("Deleting old panelsTracks from wordpress db.");
        await asyncWordpressQuery("DELETE FROM sc_panelsTracks");

        logger.info("Inserting new panelsTracks into wordpress db.");
        await asyncWordpressQuery(panelTracksSql);
        logger.info("update wordpress completed.");
        res.send(results);
    } catch (error) {
        logger.error("Error updating wordpress db: ", error);
    }
});

wordpressRouter.get("/test", async (req, res) => {
    res.send(await asyncWordpressQuery("SELECT * FROM sc_guests WHERE Slug = 'caleb-haldane'"));
});

export default wordpressRouter;