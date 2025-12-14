import type { AnyBulkWriteOperation, Collection, Document, OptionalUnlessRequiredId, UpdateFilter } from "mongodb";
import { Filter, MongoClient, ObjectId, ServerApiVersion, WithId } from "mongodb";
import { excelDefaults } from "../../common/models/excel/defaults.model";
import { excelColumn, excelData } from "../../common/models/excel/options.schema";
import { UserPanelWithTracks } from "../../common/models/IUserPanel";
import { ICategory } from "../../common/models/registration-dependencies/interfaces/category";
import { ITrack } from "../../common/models/registration-dependencies/interfaces/tracks";
import { Track } from "../../common/models/registration-dependencies/track.model";
import { Registration } from "../../common/models/registration.model";
import { sc_guest_socials_Record, sc_guests_Record, sc_panels_Record, sc_panelsTracks_Record, sc_tracks_Record } from "../../common/models/sql.model";
import { logger } from "../utils/logger";
import { makeHtml, makeParagraphTag, makeURI, slugify } from "./html.utils";
import { panelsSortDelegate, parseTime } from "./time.utils";

interface IMongoError {
    type: string;
    message: string;
    stack: string;
    code: string;
    syscall: string;
    hostname: string;
}

const defaults = new excelDefaults();

const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
const client = new MongoClient(process.env.MONGO_URI as string, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

export async function connect() {
    try {
        await client.connect();

        await client.db("admin").command({ ping: 1 });
        logger.info("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        logger.error("Could not connect to db.", error);
        logger.error("Mongo Error: ", error as IMongoError);
        process.exit(1);
    }
}

/**
 * Retrieve the names of all collections in the configured MongoDB database whose
 * collection name begins with the given prefix.
 *
 * The function queries the database's collections via listCollections(), converts
 * the result to an array, and filters by String.prototype.startsWith using the
 * provided groupName.
 *
 * @param groupName - The prefix to match collection names against. Examples of groups
 *   are "registrations", "panels", "invite-list", etc.
 *
 * @returns A Promise that resolves to an array of collection name strings that
 *   start with the provided prefix. The order of names follows the order returned
 *   by the underlying listCollections() call and is not guaranteed to be sorted.
 *
 * @remarks
 * - Matching is case-sensitive (String.prototype.startsWith).
 * - Only collection names are returned; no collection objects or metadata are included.
 * - This function depends on a MongoDB client and a configured database name (e.g., MONGO_DB_NAME).
 *
 * @throws Will reject the returned Promise if the group name is empty.
 *
 * @example
 * const registrationCollections = await getCollectionGroup("registration"); // ["registrations2023", "registrations2024"]
 */
export async function getCollectionGroup(groupName: string): Promise<string[]> {
    if (!groupName) {
        throw new Error("groupName must be a non-empty string");
    }
    return (await client.db(MONGO_DB_NAME).listCollections().toArray()).filter((c) => c.name.startsWith(groupName)).map((c) => c.name);
}

export async function getMasterList(): Promise<{
    data: excelData;
}> {
    const reg_cursor = client.db(MONGO_DB_NAME).collection("registrations").find({});
    const panel_cursor = client.db(MONGO_DB_NAME).collection("panels").find({}).sort({ title: 1 });
    const registrations = [];
    const panels: { id: string; title: string }[] = [];
    let dictionary: any = {};
    const panelsByPopularityDict: {
        [key: string]: {
            value: number;
            data: {
                Pseudonym: string;
                [key: string]: string;
                ScheduledAppearancesPreferred: string;
                ["Arrival Date/Time"]: string;
                ["Depart Date/Time"]: string;
                ["ConventionCheckInTime"]: string;
                ["ConventionCheckOutTime"]: string;
            }[];
        };
    } = {};

    for await (const doc of panel_cursor) {
        panels.push({ id: doc._id.toString(), title: doc.title });
    }

    for await (const doc of reg_cursor.sort({ "RegistrationNames.Pseudonym": 1 })) {
        const reg = doc as Registration;
        if (!reg.status || reg.status.level <= 6 || reg.isActive === false) {
            continue;
        }

        if (reg.panelAnswers) {
            let myPanels = panels.map((p) => ({ title: p.title, value: reg.panelAnswers.find((a) => a.panel._id === p.id)?.participate || "" }));
            dictionary = Object.assign({}, ...myPanels.map((x) => ({ [x.title]: x.value !== "No" ? x.value.substring(0, 1) : "" })));
            const panelsSelected = reg.panelAnswers.filter((p) => p.participate == "Yes" || p.participate == "Moderate").map((p) => p.panel.title);
            for (const panel of panelsSelected) {
                if (!panelsByPopularityDict[panel]) {
                    panelsByPopularityDict[panel] = { value: 0, data: [] };
                }
                panelsByPopularityDict[panel].value++;
                panelsByPopularityDict[panel].data.push({
                    Pseudonym: reg.RegistrationNames.Pseudonym,
                    [panel]: dictionary[panel],
                    ScheduledAppearancesPreferred: reg.AppearancePreference?.ScheduledAppearancesPreferred || "",
                    ["Arrival Date/Time"]: reg.TravelInfo?.ConventionArrivalDate || "",
                    ["Depart Date/Time"]: reg.TravelInfo?.ConventionDepartureDate || "",
                    ["ConventionCheckInTime"]: reg.TravelInfo?.ConventionCheckInTime || "",
                    ["ConventionCheckOutTime"]: reg.TravelInfo?.ConventionCheckOutTime || ""
                });
            }
        }
        registrations.push({
            guestId: reg.guestId || "",
            status: reg.status.name || "",
            lastModified: reg.status.date || "",
            FirstName: reg.PanelistContact.FirstName || "",
            LastName: reg.PanelistContact.LastName || "",
            Pseudonym: reg.RegistrationNames.Pseudonym || "",
            PreferredPronouns: reg.PanelistContact.PreferredPronouns || "",
            CellPhone: reg.PanelistContact.CellPhone || "",
            Phone: reg.PanelistContact.Phone || "",
            Email: reg.PanelistContact.Email || "",
            ContactMethod: reg.PanelistContact.ContactMethod || "",
            CanWeTextYou: reg.PanelistContact.CanWeTextYou ? "Yes" : "",
            PanelistCity: reg.PanelistContact.PanelistCity || "",
            PanelistState: reg.PanelistContact.PanelistState || "",
            ScheduledAppearancesPreferred: reg.AppearancePreference?.ScheduledAppearancesPreferred || "",
            DWP_SignUp: reg.AppearancePreference?.DWP_SignUp ? "Yes" : "",
            DWP_Suggestions: reg.AppearancePreference?.DWP_Suggestions || "",
            AVL_Needs: reg.AppearancePreference?.AVL_Needs ? "Yes" : "",
            AVL_Requests: reg.AppearancePreference?.AVL_Requests || "",
            OtherRequests: reg.AppearancePreference?.OtherRequests || "",
            ["Koffeeklatch "]: reg.AppearancePreference?.Koffeeklatch ? "Yes" : "",
            LiteraryBeers: reg.AppearancePreference?.LiteraryBeers ? "Yes" : "",
            Autographs: reg.AppearancePreference?.Autographs ? "Yes" : "",
            ["Late Night Artist's Chat"]: reg.AppearancePreference?.LateNightArtistsChat ? "Yes" : "",
            HelpArtShowReception: reg.AppearancePreference?.HelpArtShowReception ? "Yes" : "",
            HelpArtAuction: reg.AppearancePreference?.HelpArtAuction ? "Yes" : "",
            HelpCharityAuction: reg.AppearancePreference?.HelpCharityAuction || "",
            DonateCharityAuction: reg.AppearancePreference?.DonateCharityAuction || "",
            PerformReadings: reg.AppearancePreference?.PerformReadings ? "Yes" : "",
            AlternateHistory: reg.ReadingPreference?.AlternateHistory?.toString() || "",
            Comedy: reg.ReadingPreference?.Comedy?.toString() || "",
            Fantasy: reg.ReadingPreference?.Fantasy?.toString() || "",
            Horror: reg.ReadingPreference?.Horror?.toString() || "",
            Poetry: reg.ReadingPreference?.Poetry?.toString() || "",
            ScienceFiction: reg.ReadingPreference?.ScienceFiction?.toString() || "",
            PastPresentFuture: reg.ReadingPreference?.PastPresentFuture?.toString() || "",
            FantasyScienceFiction: reg.ReadingPreference?.FantasyScienceFiction?.toString() || "",
            UrbanFantasy: reg.ReadingPreference?.UrbanFantasy?.toString() || "",
            Manga: reg.ReadingPreference?.Manga?.toString() || "",
            OtherArrivalDate: reg.TravelInfo?.OtherArrivalDate || "",
            OtherCheckInTime: reg.TravelInfo?.OtherCheckInTime || "",
            OtherDepartureDate: reg.TravelInfo?.OtherDepartureDate || "",
            OtherCheckOutTime: reg.TravelInfo?.OtherCheckOutTime || "",
            HotelConfirmationNumber: reg.TravelInfo?.HotelConfirmationNumber || "",
            NumberOfAccompanyingMinorChildren: reg.TravelInfo?.NumberOfAccompanyingMinorChildren || "",
            ConventionArrivalDate: reg.TravelInfo?.ConventionArrivalDate || "",
            ConventionArrivalTime: reg.TravelInfo?.ConventionArrivalTime || "",
            ConventionCheckInTime: reg.TravelInfo?.ConventionCheckInTime || "",
            ConventionCheckOutTime: reg.TravelInfo?.ConventionCheckOutTime || "",
            ConventionDepartureDate: reg.TravelInfo?.ConventionDepartureDate || "",
            ConventionDepartureTime: reg.TravelInfo?.ConventionDepartureTime || "",
            AirportPickUp: reg.TravelInfo?.AirportPickUp || "",
            AirlineFlightInformation: reg.TravelInfo?.AirlineFlightInformation || "",
            StayingAtTheConventionHotel: reg.TravelInfo?.StayingAtTheConventionHotel || "",
            ...dictionary
        });

        logger.info(`${reg.PanelistContact.FirstName} ${reg.PanelistContact.LastName}: Processed`);
    }

    const columnWidths: { [key: string]: number } = {
        ["Pseudonym"]: 24,
        ["ScheduledAppearancesPreferred"]: 28,
        ["Arrival Date/Time"]: 20,
        ["Depart Date/Time"]: 20,
        ["ConventionCheckInTime"]: 50,
        ["ConventionCheckOutTime"]: 50
    };
    const panelsByPopularity: {
        name: string;
        popularity: number;
        columns: {
            columnName: string;
            style?: string | undefined;
        }[];
        data: {
            Pseudonym: string;
            [key: string]: string;
            ScheduledAppearancesPreferred: string;
            ["Arrival Date/Time"]: string;
            ["Depart Date/Time"]: string;
            ["ConventionCheckInTime"]: string;
            ["ConventionCheckOutTime"]: string;
        }[];
    }[] = Object.keys(panelsByPopularityDict)
        .sort((a, b) => panelsByPopularityDict[b].value - panelsByPopularityDict[a].value)
        .map((p: string) => ({
            name: sanitizeWorksheetName(p),
            popularity: panelsByPopularityDict[p].value,
            columns: Object.keys(panelsByPopularityDict[p].data[0]).map((key) => ({
                columnName: key,
                style: "standardHeaderStyle",
                width: columnWidths[key] || 40
            })),
            data: panelsByPopularityDict[p].data
        }));

    const data: excelData = {
        filename: `master_list_${new Date().toISOString().substring(0, 10)}.xlsx`,
        worksheets: [
            {
                name: "master list",
                columns: Object.keys(registrations[0]).map((key) => getMasterListColumnOptions(key, dictionary)),
                data: registrations
            },
            ...panelsByPopularity
        ],
        styles: {
            panel: {
                alignment: {
                    textRotation: 90
                },
                fill: {
                    type: "pattern", // the only one implemented so far.
                    patternType: "solid", // most common.
                    fgColor: defaults.header.bgColor,
                    bgColor: defaults.header.bgColor // HTML style hex value. defaults to black
                },
                font: {
                    color: defaults.header.fontColor,
                    bold: true
                }
            },
            standardHeaderStyle: {
                fill: {
                    type: "pattern", // the only one implemented so far.
                    patternType: "solid", // most common.
                    fgColor: defaults.header.bgColor
                },
                font: {
                    color: defaults.header.fontColor,
                    bold: true
                }
            },
            primaryRowStyle: {
                fill: {
                    type: "pattern",
                    patternType: "solid",
                    fgColor: "#C5ECFF"
                }
            },
            secondaryRowStyle: {
                fill: {
                    type: "pattern",
                    patternType: "solid",
                    fgColor: "#E7F7FF"
                }
            }
        }
    };
    return { data: data };
}

const getMasterListColumnOptions = (key: string, panels: any): excelColumn => {
    const options: excelColumn = {
        columnName: key
    };

    if (panels.hasOwnProperty(key)) {
        options.style = "panel";
        options.width = 2.75;
    } else {
        options.style = "standardHeaderStyle";
    }

    return options;
};

const sanitizeWorksheetName = (name: string) => {
    return name
        .replace(/[?!:']/g, "")
        .replace(/[\/\\]/g, "-")
        .substring(0, 30);
};

export async function getRegistrations(filter: Filter<Document> = {}): Promise<Registration[]> {
    // const reg: Registration = null;
    // reg.RegistrationNames.Pseudonym;
    return (await client
        .db(MONGO_DB_NAME)
        .collection("registrations")
        .find(filter)
        .project({
            AreasOfInterest: 0,
            panelAnswers: 0,
            ReadingPreference: 0,
            AppearancePreference: 0,
            EmergencyContact: 0,
            GuestRegistration: 0
        })
        .sort({ "RegistrationNames.Pseudonym": 1 })
        .toArray()) as Registration[];
}

export async function getUserTags(filter: Filter<Document> = {}) {
    return (await client
        .db(MONGO_DB_NAME)
        .collection("users")
        .find(filter)
        .project({
            UserId: 1,
            Tags: 1
        })
        .toArray()) as { UserId: string; Tags: string[] }[];
}

export async function getArchiveRegistrations(collectionName: string, filter: Filter<Document> = {}): Promise<Registration[]> {
    return (await client
        .db(MONGO_DB_NAME)
        .collection(collectionName)
        .find(filter)
        .project({
            guestId: 1,
            AreasOfInterest: 1,
            EmergencyContact: 1,
            PanelistContact: 1,
            BioAndSocials: 1,
            RegistrationNames: 1
        })
        .sort({ "RegistrationNames.Pseudonym": 1 })
        .toArray()) as Registration[];
}

export async function getGuests(): Promise<[sc_guests_Record[], sc_guest_socials_Record[]]> {
    const guestIds = await getAssignedGuestIds();
    const guestRegistrations = (await getRegistrations({ guestId: { $in: guestIds } })).filter((r) => r.isActive !== false);

    const guestData = guestRegistrations.map(
        (guest) =>
            ({
                Website_Name: null,
                Name: makeHtml(guest.RegistrationNames?.Pseudonym ?? ""),
                Slug: slugify(guest.RegistrationNames?.Pseudonym ?? ""),
                Bio: makeParagraphTag(guest.BioAndSocials?.bio ?? ""),
                PictureUrl: guest.imageUploaded
                    ? `${process.env.SURVEY_URL}/api${guest.imageHref}`
                    : "/wp-content/uploads/2023/02/SoonerCon-Mascot-Icon-for-website-512px.png",
                Tags: null,
                GoH: guest.goh ?? false,
                Cancelled: false,
                Active: true,
                guestId: guest.guestId ?? null
            } as sc_guests_Record)
    );
    const guestSocials: sc_guest_socials_Record[] = guestRegistrations
        .map((r) =>
            [
                { slug: slugify(r.RegistrationNames.Pseudonym), url: r.BioAndSocials?.facebookUrl, type: "Facebook" },
                { slug: slugify(r.RegistrationNames.Pseudonym), url: r.BioAndSocials?.instagramHandle, type: "Instagram" },
                { slug: slugify(r.RegistrationNames.Pseudonym), url: r.BioAndSocials?.tiktokHandle, type: "Tiktok" },
                { slug: slugify(r.RegistrationNames.Pseudonym), url: r.BioAndSocials?.twitterHandle, type: "Twitter" },
                { slug: slugify(r.RegistrationNames.Pseudonym), url: r.BioAndSocials?.bskyHandle, type: "Bsky" },
                { slug: slugify(r.RegistrationNames.Pseudonym), url: r.BioAndSocials?.website1Url, type: "Website" },
                { slug: slugify(r.RegistrationNames.Pseudonym), url: r.BioAndSocials?.website2Url, type: "Website" },
                { slug: slugify(r.RegistrationNames.Pseudonym), url: r.BioAndSocials?.website3Url, type: "Website" }
            ].filter((s) => s.url && s.type)
        )
        .flat();

    return [guestData, guestSocials];
}

export async function getUserPanels() {
    const query = [
        {
            $lookup: {
                from: "panels",
                let: { userPanelName: "$panelName" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [{ $trim: { input: "$title" } }, { $trim: { input: "$$userPanelName" } }]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            categories: 1
                        }
                    }
                ],
                as: "matchedPanel"
            }
        },
        {
            $addFields: {
                panelId: { $arrayElemAt: ["$matchedPanel._id", 0] },
                panelCategories: {
                    $map: {
                        input: { $arrayElemAt: ["$matchedPanel.categories", 0] },
                        as: "catId",
                        in: { $toObjectId: "$$catId" }
                    }
                }
            }
        },
        {
            $lookup: {
                from: "categories",
                let: {
                    catIdsSafe: {
                        $cond: {
                            if: { $isArray: "$panelCategories" },
                            then: "$panelCategories",
                            else: []
                        }
                    }
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$_id", "$$catIdsSafe"]
                            }
                        }
                    },
                    {
                        $project: {
                            Tracks: 1
                        }
                    }
                ],
                as: "categoryTracks"
            }
        },
        {
            $addFields: {
                allTrackIds: {
                    $reduce: {
                        input: "$categoryTracks.Tracks",
                        initialValue: [],
                        in: { $setUnion: ["$$value", "$$this"] }
                    }
                }
            }
        },
        {
            $lookup: {
                from: "tracks",
                let: { trackIds: "$allTrackIds" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$_id", "$$trackIds"]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            TrackName: 1
                        }
                    }
                ],
                as: "trackInfo"
            }
        },
        {
            $project: {
                matchedPanel: 0,
                panelCategories: 0,
                categoryTracks: 0,
                allTrackIds: 0
            }
        }
    ];

    return (await client.db(MONGO_DB_NAME).collection("user-panels").aggregate(query).toArray()) as UserPanelWithTracks[];
}

export async function getAssignedGuestIds(): Promise<string[]> {
    const query = [
        { $unwind: "$guests" },
        {
            $group: {
                _id: null,
                guestIds: { $addToSet: "$guests.id" }
            }
        },
        {
            $project: {
                _id: 0,
                guestIds: 1
            }
        }
    ];

    const result = await client.db(MONGO_DB_NAME).collection("user-panels").aggregate<{ guestIds: string[] }>(query).toArray();

    return result.length > 0 ? result[0].guestIds : [];
}

export async function getPanelSchedule(): Promise<sc_panels_Record[]> {
    var crypto = require("crypto");

    const panelSchedule = (await getUserPanels())
        .filter((psRow) => psRow.track !== "Reference")
        .sort(panelsSortDelegate)
        .reduce((acc, curr) => {
            const psRow = curr as UserPanelWithTracks;
            return [
                ...acc,
                ...(psRow.guests
                    ? psRow.guests.map((guest) => ({
                          id: crypto
                              .createHash("md5")
                              .update(psRow.panelName + psRow.startTime + psRow.programmingDay + psRow.location + psRow.description + guest.id + guest.name)
                              .digest("hex"),
                          guestId: guest.id,
                          Keyword: psRow.track,
                          Credited_As_Name: makeHtml(guest.name ?? ""),
                          Moderator: psRow.moderator?.name,
                          panelId: psRow._id.toString(),
                          Panel_Title: makeHtml(psRow.panelName ?? ""),
                          Panel_Description: makeParagraphTag(psRow.description ?? ""),
                          Eventbrite_Price: null,
                          Military_Time: parseTime(psRow.startTime).toString().padStart(5, "0"),
                          Time: psRow.startTime,
                          Day: psRow.programmingDay === "Friday" ? "2025-06-20" : psRow.programmingDay === "Saturday" ? "2025-06-21" : "2025-06-22",
                          Location: psRow.location,
                          Full_Panelist_List: makeHtml(psRow.guests.map((g) => g.name).join(", ") ?? "").replace(/[\n]/g, ", "),
                          Moderator_M: psRow.moderator?.name ? makeHtml(psRow.moderator.name) : "No Moderator",
                          agerestrictedContent: psRow.ageRestriction
                              ? psRow.ageRestriction
                              : ((psRow.panelName.includes("(18+)") ? "18UPONLY" : null) as "ALLAGES" | "18UPONLY" | "21UPONLY" | "13UPONLY" | null)
                      }))
                    : [
                          {
                              id: crypto
                                  .createHash("md5")
                                  .update(psRow.panelName + psRow.startTime + psRow.programmingDay + psRow.location + psRow.description)
                                  .digest("hex"),
                              guestId: null,
                              Keyword: psRow.track,
                              Credited_As_Name: null,
                              Moderator: psRow.moderator?.name,
                              panelId: psRow._id.toString(),
                              Panel_Title: makeHtml(psRow.panelName ?? ""),
                              Panel_Description: makeParagraphTag(psRow.description ?? ""),
                              Eventbrite_Price: null,
                              Military_Time: parseTime(psRow.startTime).toString().padStart(5, "0"),
                              Time: psRow.startTime,
                              Day: psRow.programmingDay === "Friday" ? "2025-06-20" : psRow.programmingDay === "Saturday" ? "2025-06-21" : "2025-06-22",
                              Location: psRow.location,
                              Full_Panelist_List: null,
                              Moderator_M: psRow.moderator?.name ? makeHtml(psRow.moderator.name) : "No Moderator",
                              agerestrictedContent:
                                  psRow.ageRestriction ??
                                  ((psRow.panelName.includes("(18+)") ? "18UPONLY" : null) as "ALLAGES" | "18UPONLY" | "21UPONLY" | "13UPONLY" | null)
                          }
                      ])
            ];
        }, [] as sc_panels_Record[]);

    return panelSchedule;
}

export async function getTracks(): Promise<sc_tracks_Record[]> {
    return ((await client.db(MONGO_DB_NAME).collection("tracks").find({ is_active: true }).sort({ TrackName: 1 }).toArray()) as Track[]).map((track) => {
        return {
            id: track._id.toString(),
            track: track.TrackName,
            slug: makeURI(track.TrackName)
        } as sc_tracks_Record;
    });
}

export async function getPanelTracks(): Promise<sc_panelsTracks_Record[]> {
    const userPanels = await client.db(MONGO_DB_NAME).collection("user-panels").find<UserPanelWithTracks>({}).toArray();

    const panelTracks: sc_panelsTracks_Record[] = userPanels
        .filter((psRow) => psRow.track !== "Reference")
        .sort(panelsSortDelegate)
        .map((userPanel) =>
            userPanel.tracks?.map(
                (track) =>
                    ({
                        trackId: track.id.toString(),
                        panelId: userPanel._id.toString(),
                        guestId: ""
                    } as sc_panelsTracks_Record)
            )
        )
        .flat()
        .filter((panelTrack): panelTrack is sc_panelsTracks_Record => !!panelTrack && !!panelTrack.trackId && !!panelTrack.panelId);

    return panelTracks;
}

export async function getCollection<T extends Document>(collectionName: string, query: Filter<T> = {}) {
    const collection: Collection<T> = client.db(MONGO_DB_NAME).collection(collectionName);
    return await collection.find(query).toArray();
}

export async function getAggregation(collectionName: string) {
    return await client
        .db(MONGO_DB_NAME)
        .collection(collectionName)
        .aggregate([
            {
                $project: {
                    PanelistContact: 1,
                    RegistrationNames: 1,
                    status: 1,
                    panelAnswers: {
                        $map: {
                            input: {
                                $filter: {
                                    input: "$panelAnswers",
                                    as: "panel",
                                    cond: { $ne: ["$$panel.participate", "No"] }
                                }
                            },
                            as: "panel",
                            in: {
                                participate: "$$panel.participate",
                                panel: {
                                    _id: "$$panel.panel._id",
                                    title: "$$panel.panel.title",
                                    subtitle: "$$panel.panel.subtitle",
                                    type: "$$panel.panel.type",
                                    interest: "$$panel.panel.interest"
                                    // Do not include "categories" here
                                }
                            }
                        }
                    }
                }
            }
        ])
        .toArray();
}

export async function getLastArchiveName() {
    const archives = await client.db(MONGO_DB_NAME).listCollections().toArray();
    return archives.filter((ci) => ci.name.startsWith("regis")).sort((a, b) => b.name.localeCompare(a.name))[0];
}

export async function insertRegistrations(registrations: Registration[]) {
    return await client.db(MONGO_DB_NAME).collection("registrations").insertMany(registrations);
}

export async function updateInviteUsersGuestId(invite: WithId<any>, guestId: string) {
    return await client
        .db(MONGO_DB_NAME)
        .collection("invite-list")
        .updateOne({ _id: invite._id }, { $set: { "Guest ID": guestId } });
}

export async function insertTrack(track: ITrack, categories: string[]) {
    const existingTrack = await client.db(MONGO_DB_NAME).collection("tracks").findOne({ TrackName: track.TrackName });
    if (existingTrack) {
        console.info(`Track ${track.TrackName} already exists`);
        await addTrackToCategories(existingTrack._id, categories);
        return { acknowledged: false, message: `Track ${track.TrackName} already exists` };
    }

    console.info(`Inserting track ${track.TrackName}`);
    const insertedTrack = await client.db(MONGO_DB_NAME).collection("tracks").insertOne(track);
    await addTrackToCategories(insertedTrack.insertedId, categories);
    return { acknowledged: true, message: `Track ${track.TrackName} inserted`, trackId: insertedTrack.insertedId };
}

export async function addTrackToCategories(trackId: ObjectId, categories: string[]) {
    await client
        .db(MONGO_DB_NAME)
        .collection("categories")
        .updateMany({ CategoryName: { $in: categories } }, { $addToSet: { Tracks: { $each: [trackId] } } } as any);
}

export async function insertCategory(category: ICategory) {
    const existingCategory = await client.db(MONGO_DB_NAME).collection("categories").findOne({ CategoryName: category.CategoryName });
    if (existingCategory) {
        console.info(`Category ${category.CategoryName} already exists`);
        return { acknowledged: false, message: `Category ${category.CategoryName} already exists` };
    }

    console.info(`Inserting category ${category.CategoryName}`);
    return await client.db(MONGO_DB_NAME).collection("categories").insertOne(category);
}

export async function deleteEntity(collectionName: string, id: string) {
    const collection: Collection<Document> = client.db(MONGO_DB_NAME).collection(collectionName);
    return await collection.deleteOne({ _id: new ObjectId(id) });
}

export async function updateEntity<T extends Document>(collectionName: string, id: string, body: T) {
    const collection: Collection<T> = client.db(MONGO_DB_NAME).collection(collectionName);
    console.log(`${collectionName} was found: ${!!collection}`)
    await collection.updateOne({ _id: new ObjectId(id) } as Filter<T>, { $set: body });
    return true
}

export async function updateField(collectionName: string, id: string, field: string, value: string | boolean | number) {
    const collection: Collection<Document> = client.db(MONGO_DB_NAME).collection(collectionName);
    return await collection.updateOne({ _id: new ObjectId(id) }, { $set: { [field]: value } });
}

export async function updateEntities<T extends Document>(collectionName: string, ids: string[], body: T) {
    const collection: Collection<T> = client.db(MONGO_DB_NAME).collection(collectionName);
    return await collection.updateMany({ _id: { $in: ids.map((id) => new ObjectId(id)) } } as Filter<T>, { $set: body });
}

export async function insertEntity<T extends Document>(collectionName: string, entity: OptionalUnlessRequiredId<T>) {
    const collection: Collection<T> = client.db(MONGO_DB_NAME).collection(collectionName);
    return await collection.insertOne(entity);
}

export async function insertEntities<T extends Document>(collectionName: string, entities: OptionalUnlessRequiredId<T>[]) {
    const collection: Collection<T> = client.db(MONGO_DB_NAME).collection(collectionName);
    return await collection.insertMany(entities);
}

export type UpsertWithKey<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export async function bulkEntityUpdateByFilter<T extends Document, K extends keyof T>(
    collectionName: string,
    makeFilter: (e: UpsertWithKey<T, K>) => Filter<T>,
    entities: ReadonlyArray<UpsertWithKey<T, K>>
) {
    const collection: Collection<T> = client.db(MONGO_DB_NAME).collection(collectionName);

    const ops: AnyBulkWriteOperation<T>[] = entities.map((e) => {
        const { _id, ...rest } = e as any;
        return {
            updateOne: {
                filter: makeFilter(e),
                update: { $set: rest } as UpdateFilter<T>,
                upsert: true
            }
        };
    });

    return collection.bulkWrite(ops);
}
