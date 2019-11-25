import { Behaviors, AllureReport, BehaviorChild, TestCase, Attachment } from "../jenkins/allure-analyze";
import { SqlUtil } from "./util";
import { makeLogger } from "../../utils";
import { CIBuild } from "../jenkins/dto";
import * as fs from 'fs';
import * as path from 'path';
import { Configuration } from "../vscode/configuration";

export class DbPopulator extends SqlUtil {
    private log = makeLogger();

    constructor() {
        super();
        this.checkInited();
    }

    public async store(content: CIBuild) {
        this.log.info(`Saving build ${content.getId()} to the db.`);
        //this.db.serialize();
        await this.storeCiRun(content);
        await this.storeResults(content.getAllureReport(), content.getId());
    }

    private async storeCiRun(build: CIBuild) {
        let stmt = this.db.prepare(`INSERT OR REPLACE INTO ci_run
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
    }

    private saveAttachments(report: AllureReport, testCase: TestCase) {

        let stmt = this.db.prepare(`INSERT OR REPLACE INTO attachments
        (uid, name, type, source, size, test_result_uid)
        VALUES
        (?, ?, ?, ?, ?, ?)`);
        const screenshotsPath = Configuration.projectConfig.screenshotsPath;
        if (!fs.existsSync(screenshotsPath)) {
            this.log.info(`Creating screenshots path directory ${screenshotsPath}`);
            fs.mkdirSync(screenshotsPath);
        }
        testCase.attachments.forEach((attachment: Attachment) => {
            // we don't need an old copy, let's just take the one in temp directory
            // rename doesn't work throwing error "Error: EXDEV: cross-device link not permitted, rename "
            fs.copyFile(report.pathToAttachment(attachment.source), path.join(screenshotsPath, attachment.source),
                (err) => {
                    if (err) {
                        this.log.error(`Error copying a file for ${JSON.stringify(attachment)}, ${err}`);
                        return;
                    }
                    stmt.run(attachment.uid,
                        attachment.name,
                        attachment.type,
                        attachment.source,
                        attachment.size,
                        testCase.uid
                    );
                });
        });
    }


    private async storeResults(report: AllureReport, buildId: number) {
        await this.storeTestCases(report.behaviors);

        let stmt = this.db.prepare(`INSERT OR REPLACE INTO test_result
        (uid, ci_run_id, test_case_id, result, console, start_time, duration,
            status_message, status_trace)
        VALUES
        (?, ?, ?, ?, ?, ?, ?,
            ?, ?)`);
        report.behaviors.children.forEach((behavior: BehaviorChild) => {
            try {
                var testCase = report.parseTestCase(behavior.uid);
            } catch (e) {
                this.log.error(`Error parsing ${behavior.uid}. ${e}`);
                return;
            }
            stmt.run(behavior.uid,
                buildId,
                behavior.testCaseId,
                behavior.status,
                testCase.log,
                behavior.time.start,
                behavior.time.duration,
                testCase.statusMessage,
                testCase.statusTrace
            );
            // don't know if it'll give the Node's GC any hint, but the log can be a big object, let's discard it as soon as possible
            testCase.log = '';

            this.saveAttachments(report, testCase);

        });
        //stmt.finalize();
    }

    private storeTestCases(behaviors: Behaviors) {
        let stmt = this.db.prepare(`INSERT OR REPLACE INTO test_case
         (id, title) VALUES (?, ?)`);
        behaviors.children.forEach(ch => {
            stmt.run(ch.testCaseId, ch.name);
        });
    }

    public updateComment(uid: string, comment: string) {
        let stmt = this.db.prepare(`UPDATE test_result SET user_comment = ? WHERE uid = ?`);
        stmt.run(comment, uid);
    }

    public checkInited() {
        let stmt = this.db.prepare(`SELECT name
    FROM sqlite_master
    WHERE
        type='table' and name='ci_run'`);
        let row = stmt.get();
        if (row === undefined) {
            const sqlInit = fs.readFileSync('./responsetek.db.sql').toString('UTF-8');
            this.db.exec(sqlInit);
        }
    }
}
