import { Router } from "express";
import { logger } from "../utils/logger";
import { deleteEntity, getAggregation, getCollection, insertEntity, updateEntities, updateEntity, updateField } from "../utils/db";
import { ObjectId } from "mongodb";

const collectionRouter = Router();

collectionRouter.get("/:collectionName", async (req, res) => {
    const collectionName = req.params.collectionName;
    logger.info(`${collectionName} requested from: ${req.ip}`);
    const query: { isActive?: boolean } = {};
    if (collectionName === "registrations") {
        query["isActive"] = true;
        res.send(await getAggregation(collectionName));
    } else {
        res.send(await getCollection(collectionName, query));
    }
});

collectionRouter.post("/:collectionName", async (req, res) => {
    logger.info(`create Entity [${req.params.collectionName}] request from: ${req.ip}`);
    const { data } = req.body;
    res.send(await insertEntity(req.params.collectionName, data));
});

collectionRouter.patch("/:collectionName", async (req, res) => {
    logger.info(`update Entities [${req.params.collectionName}] request from: ${req.ip}`);
    const { data, ids } = req.body;
    const act = await updateEntities(req.params.collectionName, ids, data);
    logger.info("update Entities completed.");
    res.send(act);
});

collectionRouter.get("/:collectionName/:id", async (req, res) => {
    logger.info(`get Entity [${req.params.collectionName}] id[${req.params.id}] request from: ${req.ip}`);
    res.send(await getCollection(req.params.collectionName, { _id: new ObjectId(req.params.id) }));
});

collectionRouter.delete("/:collectionName/:id", async (req, res) => {
    logger.info(`delete Entity [${req.params.collectionName}] id[${req.params.id}] request from: ${req.ip}`);
    res.send(await deleteEntity(req.params.collectionName, req.params.id));
});

collectionRouter.put("/:collectionName/:id", async (req, res) => {
    logger.info(`put Entity [${req.params.collectionName}] id[${req.params.id}] request from: ${req.ip}`);
    res.send(await updateEntity(req.params.collectionName, req.params.id, req.body));
});

collectionRouter.patch("/:collectionName/:id", async (req, res) => {
    logger.info(`patch Entity [${req.params.collectionName}] id[${req.params.id}] request from: ${req.ip}`);
    res.send(await updateEntity(req.params.collectionName, req.params.id, req.body));
});

collectionRouter.get("/:collectionName/:field/:type/:value", async (req, res) => {
    logger.info(`${req.params.collectionName} WHERE ${req.params.field} = ${req.params.value} requested from: ${req.ip}`);
    res.send(await getCollection(req.params.collectionName));
});

collectionRouter.put("/:collectionName/:id/:field/:type/:value", async (req, res) => {
    logger.info(`update Entity [${req.params.collectionName}] id[${req.params.id}] request from: ${req.ip}`);
    let value;
    switch (req.params.type) {
        case "bool":
            value = req.params.value === "true";
            break;

        case "string":
            value = req.params.value;
            break;

        case "number":
            value = +req.params.value;
            break;

        default:
            value = req.params.value;
            break;
    }
    const response = await updateField(req.params.collectionName, req.params.id, req.params.field, value);
    res.send(response);
});

export default collectionRouter;
