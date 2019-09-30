export interface TestCaseRun {
    uid: string;
    result: string;
    startTime: Date;
    duration: number;
    revision: string;
    console: string;
    comment: string;
}