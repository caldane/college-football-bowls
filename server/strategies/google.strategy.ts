import * as passportGoogle from "passport-google-oauth20";
import passport from "passport";
import { GoogleUser } from "../../common/models/GoogleUser.model";
import { User } from "../../common/models/user.model";
import { Router } from "express";

passport.use(
    new passportGoogle.Strategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            callbackURL: `${process.env.VHOST_PREFIX ?? ""}/auth/google/callback`,
            scope: ["profile", "email"]
        },
        async (accessToken: any, refreshToken: any, profile: any, done) => {
            const googleUser = profile as GoogleUser;
            const user: User = {
                id: googleUser.id,
                displayName: googleUser.displayName,
                email: googleUser.emails[0].value,
                photo: googleUser.photos[0].value,
                provider: "google",
                roles: [],
                perms: []
            };

            done(null, user);
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user: false | Express.User | null | undefined, done) => {
    done(null, user);
});

const googleAuthRouter = Router();

googleAuthRouter.get(
    "/callback",
    passport.authenticate("google", {
        successRedirect: process.env.CLIENT_URL,
        failureRedirect: `${process.env.VHOST_PREFIX}/auth/login/failed`
    })
);

googleAuthRouter.get(
    "/",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

export default googleAuthRouter;
