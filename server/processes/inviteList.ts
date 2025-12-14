import { excelDefaults } from "../../common/models/excel/defaults.model";
import { excelColumn, excelData } from "../../common/models/excel/options.schema";
import { getCollection } from "../utils/db";

const defaults = new excelDefaults();

export async function getEmailLinks() {
    const [inviteList] = await Promise.all([getCollection("invite-list")]);

    const columns: excelColumn[] = [
        {
            columnName: "name",
            style: "standardHeaderStyle",
            width: 26
        },
        {
            columnName: "email",
            style: "standardHeaderStyle",
            width: 33
        },
        {
            columnName: "link",
            style: "standardHeaderStyle",
            width: 60
        }
    ];

    const data: excelData = {
        filename: `invite_list_${new Date().toISOString().substring(0, 10)}.xlsx`,
        worksheets: [
            {
                name: "invite list",
                columns: columns,
                data: inviteList.map((i) => {
                    return {
                        name: `${i["First Name IRL"]} ${i["Last Name IRL"]}`,
                        email: i["Email Address1"],
                        link: `https://register.soonercon.com/${i["Guest ID"]}`
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
