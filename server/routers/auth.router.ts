import { Router } from "express";
import googleAuthRouter from "../strategies/google.strategy";
import discordAuthRouter from "../strategies/discord.strategy";
import { logger } from "../utils/logger";
import { User } from "../../common/models/user.model";

const authRouter = Router();
authRouter.use("/google", googleAuthRouter);
authRouter.use("/discord", discordAuthRouter);

authRouter.get("/login/success", (req, res) => {
    if (req.user) {
        logger.info(`Login success for user: ${(req.user as User).displayName}`);
        res.status(200).json({
            success: true,
            message: "successful",
            user: req.user
        });
    } else {
        logger.info(`Login success from strategy but could not find user.`);
        res.sendStatus(401);
    }
});

authRouter.get("/login/failed", (_, res) => {
    res.status(401).json({
        success: false,
        message: "failed"
    });
});

authRouter.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
    });
    res.redirect(`${process.env.CLIENT_URL}/login`);
});

export default authRouter;
