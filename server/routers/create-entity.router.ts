import { Router } from "express";
import { logger } from "../utils/logger";
import { createRegistrationsByInviteList } from "../processes/registrations";
import { insertCategory, insertEntities, insertTrack } from "../utils/db";

const createEntityRouter = Router();


    createEntityRouter.post("/registrations/invite-list", async (req, res) => {
        logger.info(`create registrations by invite list requested from: ${req.ip}`);
        res.send(await createRegistrationsByInviteList(req.body));
    });

    createEntityRouter.post("/invites", async (req, res) => {
        logger.info(`create new invites by invite array requested from: ${req.ip}`);
        const inviteList = req.body;
        res.send(await insertEntities("invite-list", inviteList));
    });

    createEntityRouter.post("/panels", async (req, res) => {
        logger.info(`create new panels by panel array requested from: ${req.ip}`);
        const panels = req.body;
        res.send(await insertEntities("panels", panels));
    });

    createEntityRouter.post("/tracks", async (req, res) => {
        logger.info(`create new tracks by track array requested from: ${req.ip}`);
        if (!req.body || !Array.isArray(req.body) || req.body.length === 0) {
            res.status(400).send("Empty body.");
            return;
        }
        const tracks = req.body.map((t: { TrackName: string; categories: string[] }) => insertTrack({ TrackName: t.TrackName, is_active: true }, t.categories));
        if (!tracks || tracks.length === 0) {
            res.status(400).send("No tracks to insert.");
            return;
        }

        const updatedTracks = await Promise.all(tracks);
        res.send(updatedTracks);
    });

    createEntityRouter.post("/category", async (req, res) => {
        logger.info(`create new category requested from: ${req.ip}`);
        const category = req.body;
        res.send(await insertCategory(category));
    });

    export default createEntityRouter;