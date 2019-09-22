import { Behaviors, getTestSuite } from "../jenkins/allure-analyze";
import { IJenkinsBuild } from "jenkins-api-ts-typings";
import { SqlUtil } from "./util";
import { CiRun, TestCase, TestResult } from "./entities";
import { createLogger } from 'winston';

export class DbPopulator extends SqlUtil {
    private log = createLogger();

    constructor(path: string) {
        super(path);
    }

    public store(content: {
        report: { behaviors: Behaviors },
        build: IJenkinsBuild
    }) {
        this.wrapInConnection(async () => {
            let runs = await this.storeCiRun(content.build);
            this.log.debug(`Saved Runs ${JSON.stringify(runs)}`);
            let results = await this.storeResults(content.report.behaviors, runs);
            this.log.debug(`Saved ${results.length} Test Results`);
        });
    }

    private storeCiRun(build: IJenkinsBuild): Promise<CiRun> {
        let ciRun = new CiRun();
        ciRun.startTime = build.timestamp;
        ciRun.duration = build.duration;
        ciRun.suite = getTestSuite(build);
        ciRun.id = build.number;
        ciRun.result = build.result;
        return ciRun.save();
    }


    private async storeResults(behaviors: Behaviors, run: CiRun): Promise<TestResult[]> {
        let testCases = await this.storeTestCases(behaviors);
        console.log(testCases);
        return Promise.all(behaviors.children.map(ch => {
            let result = new TestResult();
            result.uid = ch.uid;
            result.ciRunId = run.id;
            result.result = ch.status;
            result.testCaseId = ch.testCaseId;
            /*let lastComment = this.getLastComment(result.testCaseId);
            if (!!lastComment) {
                result.comment = '[PREV] ' + lastComment;
            }*/
            return result.save();
        }));
    }

    private storeTestCases(behaviors: Behaviors): Promise<TestCase[]> {
        return Promise.all(behaviors.children.map(ch => {
            let tc = new TestCase();
            tc.id = ch.testCaseId;
            tc.title = ch.name;
            return tc.save();
        }));
    }

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

}
