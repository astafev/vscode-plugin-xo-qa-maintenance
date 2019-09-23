import { Behaviors, getTestSuite } from "../jenkins/allure-analyze";
import { IJenkinsBuild } from "jenkins-api-ts-typings";
import { createLogger } from 'winston';
import { SqlUtil } from "./util";

export class DbPopulator extends SqlUtil {
    private log = createLogger();

    constructor(path: string) {
        super(path);
    }

    public async store(content: {
        report: { behaviors: Behaviors },
        build: IJenkinsBuild
    }) {
        //this.db.serialize();
        this.storeCiRun(content.build);
        this.storeResults(content.report.behaviors, content.build.number);
    }

    private storeCiRun(build: IJenkinsBuild) {
        let stmt = this.db.prepare('INSERT OR IGNORE INTO ci_run (id, start_time, duration, result, suite) VALUES (?, ?, ?, ?, ?)');

        stmt.run(build.number,
            build.timestamp,
            build.duration,
            build.result,
            getTestSuite(build));
        //return stmt.finalize();
    }


    private async storeResults(behaviors: Behaviors, buildId: number) {
        await this.storeTestCases(behaviors);

        let stmt = this.db.prepare(`INSERT OR IGNORE INTO test_result
        (uid, ci_run_id, result, comment)
        VALUES
        (?, ?, ?, ?)`);
        behaviors.children.forEach(ch => {
            stmt.run(ch.uid, buildId, ch.status, ch.testCaseId);
        });
        //stmt.finalize();
    }

    private storeTestCases(behaviors: Behaviors) {
        let stmt = this.db.prepare('INSERT OR IGNORE INTO test_case (id, title) VALUES (?, ?)');
        behaviors.children.forEach(ch => {
            stmt.run(ch.testCaseId, ch.name);
        });
        //stmt.finalize();
    }
    /*
        private async getLastComment(tcId: number): Promise<String> {
            if (!this.connection) {
                throw new Error();
            }
            let result = await this.connection.createQueryBuilder(TestResult, 'test_result')
                .where('testCaseId = :id', { id: tcId })
                .andWhere('comment IS NOT NULL')
                // .orderBy('ORDER BY ciRunId DESC LIMIT 1')
                .getOne();
    
            if (!result || !result.comment) {
                return '';
            }
            return result.comment;
        }
    */
}
