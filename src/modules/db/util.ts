import { createConnection, Connection } from "typeorm";
import { SqliteConnectionOptions } from "typeorm/driver/sqlite/SqliteConnectionOptions";
import { CiRun, TestCase, TestResult } from "./entities";

export class SqlUtil {
    protected connection?: Connection;

    constructor(readonly path: string) { }

    protected wrapInConnection(fn: Function) {
        return this.createAConnection().then(conn => {
            return fn(conn);
        }).then(() => {
            return this.closeAConnection();
        });
    }

    protected closeAConnection() {
        if (!this.connection) {
            return Promise.resolve();
        }
        let conn = this.connection;
        this.connection = undefined;
        return conn.close();
    }

    protected createAConnection() {
        let options: SqliteConnectionOptions = {
            type: "sqlite",
            database: this.path,
            entities: [
                CiRun, TestCase, TestResult
            ]
        };
        return createConnection(options).then(conn => {
            this.connection = conn;
            return conn;
        });
    }
}
