import { SqlUtil } from "./util";
import { TestCaseDetails } from "../dto/testCaseDetails";
import { TestCaseRun } from "../dto/testCaseRun";
import { IdTitle } from "../dto/idTitle";
import * as _ from "lodash";

export class InfoProvider extends SqlUtil {
    constructor(path: string) {
        super(path);
    }

    public getTestCaseRunDetails(data: IdTitle): TestCaseDetails {
        return {
            id: data.id,
            title: data.title,
            lastComment: this.getLastComment(data.id),
            runs: this.requestLastTestCaseRuns(data.id)
        };
    }

    public getLastComment(tcId: number, limit = 5): string {
        let result = this.db.prepare(`SELECT user_comment FROM test_result
        WHERE test_case_id = ?
          AND user_comment is not null AND user_comment <> ''
        ORDER BY ci_run_id DESC LIMIT 1`).get(tcId);
        return _.get(result, 'user_comment', undefined);
    }

    public requestLastTestCaseRuns(tcId: number, limit = 5): TestCaseRun[] {
        let results: any[] = this.db.prepare(`SELECT * FROM test_result WHERE test_case_id = ?
        ORDER BY ci_run_id DESC
        LIMIT ${limit}`).all(tcId);
        return results.map(val => {
            return {
                uid: val.uid,
                ci_run_id: val.ci_run_id,
                result: val.result as string,
                startTime: new Date(val.start_time as number),
                duration: val.duration as number,
                revision: val.revision as string,
                console: val.console as string,
                comment: val.user_comment as string
            } as TestCaseRun;
        });
    }
}