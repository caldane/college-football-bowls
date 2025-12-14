import { Router } from "express";
import { logger } from "../utils/logger";
import { bulkEntityUpdateByFilter, getArchiveRegistrations, getRegistrations, getUserTags, updateEntities, UpsertWithKey } from "../utils/db";
import { Registration } from "../../common/models/registration.model";
import { IGuest } from "../../common/models/users/guest";

const registrationRouter = Router();

registrationRouter.get("/allRegistrations", async (req, res) => {
    logger.info(`allRegistrations requested from: ${req.ip}`);
    res.send(await getRegistrations());
});

type UserUpsert = UpsertWithKey<IGuest, "UserId">;
registrationRouter.post("/copyRegistrations", async (req, res) => {
    logger.info(`copyRegistrations requested from: ${req.ip}`);

    if (!req.body || !req.body.filter || !req.body.collectionName) {
        const message = "Missing required field(s): ";
        const fields = ["collectionName", "filter"].filter((f) => !req?.body[f]);
        res.status(400).send(`${message} ${fields.join(", ")}`);
        return;
    }

    const registrations = await getArchiveRegistrations(req.body.collectionName as string, req.body.filter ?? {});
    if (!registrations || registrations.length === 0) {
        res.status(404).send("No registrations found");
        return;
    }

    const userFilter = req.body.filter
        ? {
              UserId: req.body.filter.guestId
          }
        : {};

    const allUserTags = (await getUserTags(userFilter)) ?? [];

    const userData: UserUpsert[] = registrations.map((r: Registration) => {
        const userTags: Set<string> = new Set(allUserTags.find((t) => t.UserId === r.guestId)?.Tags);
        userTags.add(req.body.tag);

        return {
            UserId: r.guestId,
            AreasOfInterest: r.AreasOfInterest,
            BioAndSocials: r.BioAndSocials,
            EmergencyContact: r.EmergencyContact,
            PanelistContact: r.PanelistContact,
            Tags: [...userTags]
        };
    });

    try {
        await bulkEntityUpdateByFilter("users", (user: UserUpsert) => ({ UserId: user.UserId }), userData);
        res.sendStatus(204);
    } catch (error) {
        logger.error("Error copying registrations:", error);
        res.status(500).send("Error copying registrations");
    }
});

export default registrationRouter;
