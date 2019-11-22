import * as fs from 'fs';
import { makeLogger } from '../../utils';
import * as path from 'path';

export interface AllureReport {
    behaviors: Behaviors;
    parseTestCase(testCaseUid: string): TestCase;
    /** @param source as written in the test case json file. Typically uid+".png" */
    pathToAttachment(source: string): string;
}

export interface TestCase {
    uid: string;
    log: string;
    attachments: Attachment[];
    statusMessage?: string;
    statusTrace?: string;
}

export const ATTACHMENT_SECTION_START = '\n>>>>ATTACHMENT ID:';
export const ATTACHMENT_SECTION_END = '<<<<\n';

export class AlluresReportAnalyzer {
    private log = makeLogger();

    constructor(private readonly dir: string) {
    }

    public parse(): AllureReport {
        const dir = this.dir;
        const log = this.log;
        return {
            behaviors: this.parseBehaviors(),
            pathToAttachment(source: string) {
                return path.join(dir, 'allure-report', 'data', 'attachments', source);
            },
            parseTestCase: function (uid: string): TestCase {
                try {
                    const obj = JSON.parse(
                        fs.readFileSync(
                            path.join(dir, 'allure-report', 'data', 'test-cases', `${uid}.json`)).toString()
                    );
                    if (!obj.testStage) {
                        throw new Error(`Unknown format, can't find testStage in "${dir}\\allure-report\\data\\test-cases\\${uid}.json"`);
                    }

                    const steps = obj.testStage.steps;
                    const firstStepStart = steps[0].time.start;
                    let attachments: Attachment[] = [];

                    function toLog(step: any): string {
                        let log = '';
                        if (step.name) {
                            // when step.name is present, step.time.start is present as well
                            let passed = (step.time.start - firstStepStart) / 1000;
                            log += `\n+${passed}s ${step.name}`;
                        }
                        if (step.steps) {
                            log = step.steps.reduce((log: string, step: any) => {
                                return `${log}${toLog(step)}`;
                            }, log);
                        }

                        if (step.attachments) {
                            attachments = attachments.concat(step.attachments);
                            step.attachments.forEach((attachment: Attachment) => {
                                log += `${ATTACHMENT_SECTION_START}${attachment.uid}${ATTACHMENT_SECTION_END}`;
                            });
                        }
                        return log;
                    }

                    const log = toLog(obj.testStage);
                    return {
                        uid: obj.uid,
                        log: log,
                        attachments: attachments,
                        statusMessage: obj.statusMessage,
                        statusTrace: obj.statusTrace
                    };
                } catch (e) {
                    log.error(`Error parsing ${uid} (${dir}\\allure-report\\data\\test-cases\\${uid}.json)`, e);
                    throw new Error(`Error reading ${dir}\\allure-report\\data\\test-cases\\${uid}.json`);
                }
            },
        };
    }

    private parseBehaviors() {
        let content = fs.readFileSync(`${this.dir}\\allure-report\\data\\behaviors.json`);
        let behaviors: Behaviors = JSON.parse(content.toString());
        behaviors.children.forEach(b => {
            let caseId = this.getTestCaseId(b.name);
            b.testCaseId = Number.parseInt(caseId);
        });
        return behaviors;
    }

    private getTestCaseId(name: string) {
        let regexp = new RegExp('\\[(\\d*)\\]').exec(name);
        if (regexp === null) {
            throw new Error(`Unknown name: ${name}`);
        }
        return regexp[1];
    }
}


export interface Attachment {
    uid: string;
    name: string;
    source: string;
    type: string;
    size: number;
}
export interface Behaviors {
    uid: string;
    children: BehaviorChild[];
    name: string;
}
export interface BehaviorChild {
    name: string;
    uid: string;
    testCaseId: number;
    parentUid: string;
    status: string;
    flaky: boolean;
    time: { start: number, stop: number, duration: number };
}
