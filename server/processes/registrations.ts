import { PanelistContact } from "../../common/models/registration-dependencies/PanelistContact";
import { RegistrationNames } from "../../common/models/registration-dependencies/RegistrationNames";
import { Registration } from "../../common/models/registration.model";
import { getCollection, getLastArchiveName, insertRegistrations, updateInviteUsersGuestId } from "../utils/db";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { promises, existsSync } from "fs";
import { WithId } from "mongodb";
import { excelColumn, excelData } from "../../common/models/excel/options.schema";
import { excelDefaults } from "../../common/models/excel/defaults.model";
import { IInvite } from "../../common/models/invite/invite.interface";

const defaults = new excelDefaults();
const userProperties = ["AreasOfInterest", "BioAndSocials", "EmergencyContact", "PanelistContact"] as const;
const inviteProperties = [
    "Email Address1",
    "First Name IRL",
    "Last Name IRL",
    "Preferred Pronouns",
    "Contact Method",
    "Panelist City",
    "Panelist State",
    "Credited As Name"
] as const;

export async function createRegistrationsByInviteList(inviteList: IInvite[]) {
    const report = {
        newUserCount: 0,
        newRegistrationCount: 0,
        invitesMissingRegistrationCount: 0,
        inviteProps: {
            ["Email Address1"]: 0,
            ["First Name IRL"]: 0,
            ["Last Name IRL"]: 0,
            ["Preferred Pronouns"]: 0,
            ["Contact Method"]: 0,
            ["Panelist City"]: 0,
            ["Panelist State"]: 0,
            ["Credited As Name"]: 0
        },
        archiveMatchCount: 0,
        userMatchCount: 0
    };
    const archiveName = await getLastArchiveName();
    const [registrationList, inviteListFetch, userList, archives] = await Promise.all([
        getCollection("registrations"),
        getCollection("invite-list"),
        getCollection("users"),
        getCollection(archiveName.name)
    ]);
    const newRegistrations: Registration[] = [];
    const users: any[] = [];

    if (!inviteList) {
        inviteList = inviteListFetch as WithId<IInvite>[];
    }

    const invitesMissingRegistration = inviteList.filter((invite) => !registrationList.some((r) => r.guestId === invite["Guest ID"]));
    report.invitesMissingRegistrationCount = invitesMissingRegistration.length;

    invitesMissingRegistration.forEach((invite) => {
        let registration = {} as Registration;

        inviteProperties.forEach((prop) => {
            if (invite[prop]) {
                report.inviteProps[prop] = report.inviteProps[prop] + 1;
            }
        });

        const pc = {
            Email: invite["Email Address1"],
            FirstName: invite["First Name IRL"],
            LastName: invite["Last Name IRL"],
            PreferredPronouns: invite["Preferred Pronouns"],
            ContactMethod: invite["Contact Method"],
            PanelistCity: invite["Panelist City"],
            PanelistState: invite["Panelist State"]
        } as PanelistContact;

        const rn = {
            Pseudonym: invite["Credited As Name"]
        } as RegistrationNames;

        registration = {
            ...registration,
            isActive: true,
            PanelistContact: { ...registration.PanelistContact, ...pc },
            RegistrationNames: { ...registration.RegistrationNames, ...rn }
        };

        const archiveMatch = archives.find(
            (a) =>
                a.guestId.localeCompare(invite["Guest ID"], "en", { sensitivity: "base" }) === 0 ||
                invite["Email Address1"]?.localeCompare(a.PanelistContact?.Email, "en", { sensitivity: "base" }) === 0
        );
        if (archiveMatch) {
            report.archiveMatchCount++;
            registration = patchObject(registration, archiveMatch);
            registration.guestId = archiveMatch.guestId;
        }

        const matchingUsersByEmail = userList.filter(
            (user) =>
                user.UserId?.localeCompare(invite["Guest ID"], "en", { sensitivity: "base" }) === 0 ||
                user["Email Address1"]?.localeCompare(invite["Email Address1"], "en", { sensitivity: "base" }) === 0 ||
                user.PanelistContact?.Email?.localeCompare(invite["Email Address1"], "en", { sensitivity: "base" }) === 0
        );
        if (matchingUsersByEmail) {
            matchingUsersByEmail.forEach((user) => {
                report.userMatchCount++;
                registration = patchObject(registration, user);
                registration.guestId = user.UserId;
            });
        }

        if (!registration.guestId) {
            registration.guestId = uuidv4().replace(/-/g, "");
            let user = {
                ...invite,
                UserId: registration.guestId
            };
            user = patchObject(user, registration);
            if (registration.PanelistContact.FirstName || registration.PanelistContact.LastName) {
                logger.info(`Created new user: ${registration.PanelistContact.FirstName} ${registration.PanelistContact.LastName}`);
            } else if (registration.PanelistContact.Email) {
                logger.info(`Created new user: ${registration.PanelistContact.Email}`);
            } else {
                logger.info(`Created new user: ${JSON.stringify(invite, null, 2)}`);
            }
            users.push(user);
            report.newUserCount++;

            updateInviteUsersGuestId(invite, user.UserId);
        } else if (!invite["Guest ID"]) {
            updateInviteUsersGuestId(invite, registration.guestId);
            logger.info(`Found user and updated Guest ID: ${registration.PanelistContact.FirstName} ${registration.PanelistContact.LastName}`);
        } else if (invite["Guest ID"] !== registration.guestId) {
            updateInviteUsersGuestId(invite, registration.guestId);
            logger.info(`Found user and updated Guest ID: ${registration.PanelistContact.FirstName} ${registration.PanelistContact.LastName}`);
        } else {
            logger.info(`Found user: ${registration.PanelistContact.FirstName} ${registration.PanelistContact.LastName}`);
        }

        newRegistrations.push(registration);
        report.newRegistrationCount++;
    });

    if (!existsSync("./logs")) {
        await promises.mkdir("./logs");
    }

    promises.writeFile("logs/CreatedUsers.txt", JSON.stringify({ report, users, newRegistrations }, null, 2), {
        flag: "w"
    });

    if (newRegistrations.length) {
        insertRegistrations(newRegistrations);
    }

    logger.info(`Registration Report: ${newRegistrations.length} new Registrations created.`);

    return report;
}

export function patchObject(user: any, patch: any): any {
    return {
        ...user,
        ...userProperties.reduce((acc, curr) => {
            if (patch[curr]) {
                return {
                    ...acc,
                    [curr]: { ...user[curr], ...patch[curr] }
                };
            }
            return acc;
        }, {})
    };
}

export async function followUpReport() {
    const [registrations] = await Promise.all([getCollection("registrations")]);

    const columns: excelColumn[] = [
        {
            columnName: "First Name",
            style: "standardHeaderStyle",
            width: 26
        },
        {
            columnName: "Last Name",
            style: "standardHeaderStyle",
            width: 26
        },
        {
            columnName: "Pseudonym",
            style: "standardHeaderStyle",
            width: 26
        },
        {
            columnName: "Email",
            style: "standardHeaderStyle",
            width: 26
        },
        {
            columnName: "Phone",
            style: "standardHeaderStyle",
            width: 26
        },
        {
            columnName: "Registration Link",
            style: "standardHeaderStyle",
            width: 60
        },
        {
            columnName: "Step Name",
            style: "standardHeaderStyle",
            width: 26
        },
        {
            columnName: "Last Access Date",
            style: "standardHeaderStyle",
            width: 15.25
        },
        {
            columnName: "Last Access Time",
            style: "standardHeaderStyle",
            width: 15.25
        },
        {
            columnName: "status",
            style: "standardHeaderStyle",
            width: 15.25
        },
        {
            columnName: "Can Attend",
            style: "standardHeaderStyle",
            width: 15.25
        }
    ];

    const data: excelData = {
        filename: `follow_up_list_${new Date().toISOString().substring(0, 10)}.xlsx`,
        worksheets: [
            {
                name: "Follow up list",
                columns: columns,
                data: registrations
                    //.filter((r: any) => r.status && r.status.level > 1 && r.status.level < 7)
                    .map((i) => {
                        const reg = i as Registration;
                        return {
                            ["First Name"]: reg.PanelistContact.FirstName,
                            ["Last Name"]: reg.PanelistContact.LastName,
                            Pseudonym: reg.RegistrationNames.Pseudonym,
                            Email: reg.PanelistContact.Email,
                            Phone: [reg.PanelistContact.Phone, reg.PanelistContact.CellPhone].filter((p) => p).join("; "),
                            ["Registration Link"]: `https://register.soonercon.com/${reg.guestId}`,
                            ["Step Name"]: reg?.status?.name,
                            ["Last Access Date"]: new Date(reg?.status?.date).toLocaleDateString(),
                            ["Last Access Time"]: new Date(reg?.status?.date).toLocaleTimeString(),
                            status: reg.status,
                            ["Can Attend"]: reg.TravelInfo?.CanAttend ?? "Did not answer"
                        };
                    })
            }
        ],
        styles: {
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
