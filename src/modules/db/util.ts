import * as Sqlite from 'better-sqlite3';

export class SqlUtil {
    protected db: Sqlite.Database;

    constructor(readonly path: string) {
        this.db = new Sqlite(path);
     }
}
