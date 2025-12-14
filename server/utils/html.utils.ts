import Maps from "./maps.utils";

export function makeHtml(text: string) {
    return text.trim().replace(/["]/g, "&quot;").replace(/[']/g, "&apos;");
}

export function makeParagraphTag(text: string) {
    return "<p>" + makeHtml(text.trim()).replace(/[\n]/g, "</p><p>") + "</p>";
}

export function makeURI(text: string) {
    return encodeURI(
        text
            .trim()
            .toLowerCase()
            .replace(/[,."'!’\/`]/g, "")
            .replace(/[ &]/g, "-")
            .replace(/---/g, "-")
    );
}

export function slugify(text: string): string {
    const slugMap = Maps.slugMap;
    return slugMap.has(text)
        ? slugMap.get(text)!
        : text
              .trim()
              .replace(/ +/g, "-")
              .replace(/[^A-Za-z0-9-]/g, "")
              .replace(/---/g, "-")
              .toLowerCase();
}

export function formatSocialUrl(url: string, type: "Facebook" | "Instagram" | "Tiktok" | "Twitter" | "Website") {
    if (!url) {
        return "";
    }

    switch (type) {
        case "Facebook":
            if (
                !url.toLocaleLowerCase().startsWith("http") &&
                !url.toLocaleLowerCase().startsWith("facebook.com") &&
                !url.toLocaleLowerCase().startsWith("www.facebook.com")
            ) {
                url = `facebook.com/${url}`;
            }
            break;
        case "Instagram":
            url = `instagram.com/${url}`;
            break;
        case "Tiktok":
            url = `tiktok.com/@${url}`;
            break;
        case "Twitter":
            url = `x.com/${url}`;

        default:
            break;
    }

    return url?.startsWith("http") ? url : url ? `https://${url}` : "";
}
