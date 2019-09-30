import { Behaviors, AllureReport, BehaviorChild } from "../jenkins/allure-analyze";
import { SqlUtil } from "./util";
import { makeLogger } from "../../utils";
import { CIBuild } from "../jenkins/dto";

export class DbPopulator extends SqlUtil {
    private log = makeLogger();

    constructor(path: string) {
        super(path);
    }

    public async store(content: CIBuild) {
        this.log.info(`Saving build ${content.getId()} to the db.`);
        //this.db.serialize();
        await this.storeCiRun(content);
        await this.storeResults(content.getAllureReport(), content.getId());
    }

    private async storeCiRun(build: CIBuild) {
        let stmt = this.db.prepare(`INSERT OR IGNORE INTO ci_run
         (id, start_time, duration, result, suite, 
            console, branch, revision)
         VALUES (?, ?, ?, ?, ?,
            ?, ?, ?)`);

        stmt.run(build.getId(),
            build.getTimestamp(),
            build.getDuration(),
            build.getResult(),
            build.getTestSuite(),
            await build.getConsoleFull(),
            build.getBranch(),
            build.getRevision());
        //return stmt.finalize();
    }


    private async storeResults(report: AllureReport, buildId: number) {
        await this.storeTestCases(report.behaviors);

        let stmt = this.db.prepare(`INSERT OR IGNORE INTO test_result
        (uid, ci_run_id, test_case_id, result, console, start_time, duration)
        VALUES
        (?, ?, ?, ?, ?, ?, ?)`);
        report.behaviors.children.forEach((behavior: BehaviorChild) => {
            stmt.run(behavior.uid,
                buildId,
                behavior.testCaseId,
                behavior.status,
                report.parseLog(behavior.uid),
                behavior.time.start,
                behavior.time.duration,
            );
        });
        //stmt.finalize();
    }

    private storeTestCases(behaviors: Behaviors) {
        let stmt = this.db.prepare(`INSERT OR IGNORE INTO test_case
         (id, title) VALUES (?, ?)`);
        behaviors.children.forEach(ch => {
            stmt.run(ch.testCaseId, ch.name);
        });
    }

    public updateComment(uid: string, comment: string) {
        let stmt = this.db.prepare(`UPDATE test_result SET user_comment = ? WHERE uid = ?`);
        stmt.run(comment, uid);
    }
}
