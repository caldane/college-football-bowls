import { SqlCommandOptions, SqlCommands, SqlData, SQLModel } from "../../common/models/sql.model";
import { logger } from "./logger";

const valueToSql = (value: string | number | boolean | null): (string | number) => {
    if (value === null) {
        return "NULL";
    }
    if (typeof value === "string") {
        return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
    }
    if (typeof value === "number") {
        return value.toString();
    }
    if (typeof value === "boolean") {
        return value ? 1 : 0;
    }

    return "NULL";
}

export const objectToSql = <T extends SQLModel>(obj: T, mode: SqlCommands, options: SqlCommandOptions): string => {
    const sqlData = obj.reduce(
        (acc: SqlData<T>, curr: T, i: number) => {
            if (i === 0) {
                acc.columns = Object.keys(curr) as (keyof T)[];
            }

            //logger.info(`Processing object: ${i}: ${JSON.stringify(curr)}`);
            acc.values = [...acc.values, Object.values(curr)];
            return acc;
        },
        { columns: [], values: [] } as SqlData<T>
    );
    try {
        switch (mode) {
            case SqlCommands.INSERT:
                if (!options.tableName) {
                    throw new Error("Table name is required for INSERT operation.");
                }
                if (sqlData.columns.length === 0 || sqlData.values.length === 0) {
                    throw new Error("No data provided for INSERT operation.");
                }
                if (!sqlData.values.every((row: string[]) => row.length === sqlData.columns.length)) {
                    throw new Error("Columns and values count mismatch for INSERT operation.");
                }
                return `INSERT INTO ${options.tableName} (${sqlData.columns.join(", ")}) VALUES ${sqlData.values
                    .map((row: (string | number | boolean)[]) => `(${row.map(value =>valueToSql(value)).join(", ")})` )
                    .join(", ")}`;
            case SqlCommands.UPDATE:
                return `UPDATE ${options.tableName} SET ${sqlData.columns
                    .map((col: string, idx: number) => `${col} = '${sqlData.values[idx]}'`)
                    .join(", ")} WHERE '${options.whereClause}'`;
            case SqlCommands.DELETE:
                return `DELETE FROM ${options.tableName} WHERE '${options.whereClause}'`;
            case SqlCommands.SELECT:
                return `SELECT ${sqlData.columns.join(", ")} FROM ${options.tableName} WHERE id = '${obj.id}'`;
            case SqlCommands.DROP:
                return `DROP TABLE ${options.tableName}`;
            case SqlCommands.TRUNCATE:
                return `TRUNCATE TABLE ${options.tableName}`;
            default:
                throw new Error(`Unsupported SQL command: ${mode}`);
        }
    } catch (error: { message: string } | any) {
        logger.error(`Error generating SQL command: ${error.message}`, error);
        throw new Error(`Failed to generate SQL command: ${error.message}`);
    } 
};
