import * as passportDiscord from "passport-discord";
import passport from "passport";
import { User } from "../../common/models/user.model";
import { DiscordUser } from "../../common/models/DiscordUser.model";
import { Router } from "express";

const soonerconServers = ["323639674566606849", "433299621121490946"];

passport.use(
    new passportDiscord.Strategy(
        {
            clientID: process.env.DISCORD_CLIENT_ID ?? "",
            clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
            callbackURL: `${process.env.VHOST_PREFIX ?? ""}/auth/discord/callback`,
            scope: ["identify", "email", "guilds", "guilds.members.read"]
        },
        async (accessToken: any, refreshToken: any, profile: any, done) => {
            const discordUser: DiscordUser = profile as DiscordUser;
            const userGuilds = profile.guilds.filter((g: { id: string }) => soonerconServers.find((s) => s === g.id));
            const userIsInServer = userGuilds.length > 0;

            const user: User = {
                id: profile.id,
                displayName: discordUser.username,
                roles: userIsInServer ? ["volunteer"] : [],
                perms: [],
                email: discordUser.email,
                photo: discordUser.avatar
                    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.webp?size=128`
                    : (null as unknown as string),
                provider: "discord"
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

const discordAuthRouter = Router();

discordAuthRouter.get(
    "/callback",
    passport.authenticate("discord", {
        successRedirect: process.env.CLIENT_URL,
        failureRedirect: `${process.env.VHOST_PREFIX}/auth/login/failed`
    })
);

discordAuthRouter.get(
    "/",
    passport.authenticate("discord", {
        scope: ["identify", "email", "guilds", "guilds.members.read"]
    })
);

export default discordAuthRouter;
