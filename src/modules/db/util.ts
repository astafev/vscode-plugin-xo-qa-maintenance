import * as Sqlite from 'better-sqlite3';
import { Configuration } from '../vscode/configuration';

export class SqlUtil {
    protected db: Sqlite.Database;

    constructor() {
        this.db = new Sqlite(Configuration.projectConfig.db);
     }

     public reset() {
         this.db = new Sqlite(Configuration.projectConfig.db);
     }
}
