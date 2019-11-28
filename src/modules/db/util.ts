import * as Sqlite from 'better-sqlite3';
import { Configuration } from '../vscode/configuration';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class SqlUtil {
    protected db: Sqlite.Database;

    constructor() {
        const dbPath = Configuration.projectConfig.db;
        if (!fs.existsSync(path.dirname(dbPath))) {
            fs.mkdirSync(path.dirname(dbPath));
        }
        this.db = new Sqlite(dbPath);
    }

    public reset() {
        this.db = new Sqlite(Configuration.projectConfig.db);
    }

    public checkInited(context: vscode.ExtensionContext) {
        let stmt = this.db.prepare(`SELECT name
    FROM sqlite_master
    WHERE
        type='table' and name='ci_run'`);
        let row = stmt.get();
        if (row === undefined) {
            const sqlInit = fs.readFileSync(context.asAbsolutePath('./db-schema.sql')).toString('UTF-8');
            this.db.exec(sqlInit);
        }
    }
}
