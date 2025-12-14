import { Router } from "express";
import { logger } from "../utils/logger";
import path from "path";
import { getMasterList } from "../utils/db";
import GenerateExcel from "../utils/excel";
import { followUpReport } from "../processes/registrations";
import { getEmailLinks } from "../processes/inviteList";

const reportsRouter = Router();

reportsRouter.get("/MasterList", async (req, res) => {
    logger.info(`generate master list excel requested from: ${req.ip}`);
    const MasterList = await getMasterList();
    const response = await GenerateExcel(MasterList.data);
    logger.info("master list generated.", path.join(__dirname, response.filename));
    res.status(200).sendFile(path.join(__dirname, response.filename));
});

reportsRouter.get("/follow-up-report", async (req, res) => {
    logger.info(`generate follow up report excel requested from: ${req.ip}`);
    const report = await followUpReport();
    const response = await GenerateExcel(report.data);
    logger.info("follow up report generated.", path.join(__dirname, response.filename));
    res.status(200).sendFile(path.join(__dirname, response.filename));
});

reportsRouter.get("/invite-list", async (req, res) => {
    logger.info(`generate invite list excel requested from: ${req.ip}`);
    const inviteList = await getEmailLinks();
    const response = await GenerateExcel(inviteList.data);
    logger.info("invite list generated.", path.join(__dirname, response.filename));
    res.status(200).sendFile(path.join(__dirname, response.filename));
});

export default reportsRouter;