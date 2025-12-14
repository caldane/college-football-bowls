import { Response } from "express";
import { excelDefaults } from "../../common/models/excel/defaults.model";
import { excelData } from "../../common/models/excel/options.schema";
import { logger } from "./logger";

const xl = require("excel4node");
const defaults = new excelDefaults();

export default function GenerateExcel(data: excelData, res?: Response): Promise<{ filename: string; stats: any }> {
    const wb = new xl.Workbook();
    const myStyles: { [x: string]: any } = Object.assign({}, ...Object.keys(data.styles).map((s) => ({ [s]: wb.createStyle(data.styles[s]) })));

    data.worksheets.forEach((wsData) => {
        const ws = wb.addWorksheet(wsData.name);

        //Write Column Title in Excel file
        let headingColumnIndex = 1;
        wsData.columns.forEach((column) => {
            if (column.width) {
                ws.column(headingColumnIndex).setWidth(column.width);
            }
            if (column.style) {
                ws.cell(1, headingColumnIndex++).string(column.columnName).style(myStyles[column.style]);
            } else {
                ws.cell(1, headingColumnIndex++).string(column.columnName);
            }
        });

        logger.info(`Created excel Headers: ${wsData.name}`);

        //Write Data in Excel file
        let rowIndex = 2;
        wsData.data.forEach((record: { [key: string]: string }) => {
            let columnIndex = 1;
            Object.keys(record).forEach((columnName) => {
                if (rowIndex % 2) {
                    ws.cell(rowIndex, columnIndex++).string(record[columnName]).style(myStyles.primaryRowStyle);
                } else {
                    ws.cell(rowIndex, columnIndex++).string(record[columnName]).style(myStyles.secondaryRowStyle);
                }
            });
            rowIndex++;
        });

        logger.info(`Created excel Body: ${wsData.name}`);
    });

    return new Promise((resolve, reject) => {
        const filename = `./exports/${data.filename}`;
        wb.write(filename, (err: any, stats: any) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                console.log(`Finished Creating Excel File: ${filename}`, stats);
                resolve({ filename: filename, stats });
            }
        });
    });
}
