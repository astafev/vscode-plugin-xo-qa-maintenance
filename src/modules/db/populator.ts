import { Behaviors, getTestSuite } from "../jenkins/allure-analyze";
import { IJenkinsBuild } from "jenkins-api-ts-typings";
import * as sqlite from 'sqlite3';
import { SqlUtil } from "./util";
import { CiRun, TestCase, TestResult } from "./entities";

export class DbPopulator extends SqlUtil {
    constructor(path: string) {
        super(path);
    }

    public store(result: {
        report: { behaviors: Behaviors },
        build: IJenkinsBuild
    }) {
        this.wrapInConnection(async () => {
            let b = await this.storeCiRun(result.build);
            console.log(b);
            let a = await this.storeResults(result.report.behaviors, b);
            console.log(a);
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
            result.ciRunId = run.id;
            result.result = ch.status;
            result.testCaseId = ch.testCaseId;
            let lastComment = this.getLastComment(result.testCaseId);
            if (!!lastComment) {
                result.comment = '[PREV] ' + lastComment;
            }
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
