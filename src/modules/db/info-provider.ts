import { SqlUtil } from "./util";
import { TestCaseDetails } from "../dto/testCaseDetails";
import { TestCaseRun } from "../dto/testCaseRun";
import { IdTitle } from "../dto/idTitle";
import * as _ from "lodash";
import { Configuration } from "../vscode/configuration";
import { Attachment } from "../jenkins/allure-analyze";

export class InfoProvider extends SqlUtil {
    private static _instance: InfoProvider;

    private constructor() {
        super();
    }

    static get instance() {
        if (!this._instance) {
            let provider = new InfoProvider();
            this._instance = provider;
            Configuration.registerCallbackOnUpdate(() => {
                return provider.reset();
            });
        }
        return this._instance;
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

    public getAttachments(tcUid: string): Attachment[] {
        return this.db.prepare(`SELECT * FROM attachments WHERE test_result_uid = ?`).all(tcUid);
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
                comment: val.user_comment as string,
                attachments: this.getAttachments(val.uid)
            } as TestCaseRun;
        });
    }

    public getInfoForTreeView(tcId: number): {
        status: string
    } {
        let result: any = this.db.prepare(`SELECT * FROM test_result WHERE test_case_id = ?
        ORDER BY ci_run_id DESC
        LIMIT 1`).get(tcId);
        return {
            status: _.get(result, 'result', undefined)
        };
    }
}