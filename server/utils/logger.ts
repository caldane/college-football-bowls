const styleText = (styles: string[], text: string) => {
    const styleMap: { [key: string]: string } = {
        bold: "\x1b[1m",
        blue: "\x1b[34m",
        orange: "\x1b[33m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        purple: "\x1b[35m",
        reset: "\x1b[0m"
    };
    const appliedStyles = styles.map((style) => styleMap[style] || "").join("");
    return `${appliedStyles}${text}${styleMap.reset}`;
};

const getCurrentTime = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "america/chicago" })).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
};
const getCurrentDate = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "america/chicago" })).toLocaleDateString("sv-SE");
};
const timestamp = () => {
    return `${getCurrentDate()} ${getCurrentTime()}`;
};

export const logger = {
    info: (msg: string, ...rest: any) => console.info(`[${timestamp()}] [${styleText(["bold", "blue"], "INFO")}] ${msg}`, rest),
    log: (msg: string, ...rest: any) => console.info(`[${timestamp()}] [${styleText(["bold", "blue"], "INFO")}] ${msg}`, rest),
    warn: (msg: string, ...rest: any) => console.warn(`[${timestamp()}] [${styleText(["bold", "orange"], "WARN")}] ${msg}`, rest),
    error: (msg: string, callstack: any, ...rest: any) => console.error(`[${timestamp()}] [${styleText(["bold", "red"], "ERROR")}] ${msg}`, callstack, rest),
    success: (msg: string, response?: any, ...rest: any) => console.log(`[${timestamp()}] [${styleText(["bold", "green"], "SUCCESS")}] ${msg}`, response, rest),
    debug: (msg: string, value: any) => {
        console.log(`[${timestamp()}] [${styleText(["bold", "purple"], "DEBUG")}] ${msg}`);
        console.table(value);
    },
    env: () => {
        const environment = [
            "SERVER_PORT",
            "MONGO_DB_NAME",
            "MONGO_URI",
            "HOSTNAME",
            "VHOST_PREFIX",
            "GOOGLE_CLIENT_ID",
            "GOOGLE_CLIENT_SECRET",
            "CLIENT_URL",
            "DISCORD_CLIENT_ID",
            "DISCORD_CLIENT_SECRET",
            "WORDPRESS_URL",
            "WORDPRESS_USER",
            "WORDPRESS_PASSWORD",
            "WORDPRESS_DATABASE",
            "OS",
            "NUMBER_OF_PROCESSORS",
            "PROCESSOR_ARCHITECTURE",
            "PROCESSOR_IDENTIFIER",
            "NODE_ENV"
        ].reduce(
            (acc, key) => {
                acc[key.substring(0, 20).padStart(20, " ")] = process.env[key]?.substring(0, 60).padEnd(60, " ");
                return acc;
            },
            {} as { [key: string]: string | undefined }
        );
        environment["NODE_VERSION".padStart(20, " ")] = process.versions.node.padEnd(60, " ");
        logger.debug("Environment: ", environment);
    }
};
