import { Attachment } from "../jenkins/allure-analyze";

export interface TestCaseRun {
    uid: string;
    ci_run_id: number;
    result: string;
    startTime: Date;
    duration: number;
    revision: string;
    console: string;
    comment: string;
    attachments: Attachment[];
}