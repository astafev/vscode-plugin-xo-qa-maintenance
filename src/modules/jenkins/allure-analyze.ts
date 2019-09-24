import * as fs from 'fs';
import { makeLogger } from '../../utils';

export interface AllureReport {
    behaviors: Behaviors;
    parseLog(testCaseUid: string): string | undefined;
}

export class AlluresReportAnalyzer {
    private log = makeLogger();

    constructor(private readonly dir: string) {
    }

    public parse(): AllureReport {
        let dir = this.dir;
        let log = this.log;
        return {
            behaviors: this.parseBehaviors(),
            parseLog: function (uid: string): string | undefined {
                try {
                    let obj = JSON.parse(
                        fs.readFileSync(`${dir}\\allure-report\\data\\test-cases\\${uid}.json`).toString()
                    );
                    if (!obj.testStage) {
                        return undefined;
                    }
                    let steps = obj.testStage.steps;
                    let prevStepStart = steps[0].time.start;
                    return steps.reduce((log: string, step: any) => {
                        let passed = (step.time.start - prevStepStart) / 1000;
                        return `${log}\n+${passed}s ${step.name}`;
                    }, '');
                } catch (e) {
                    log.error(`Error parsing ${uid}`, e);
                    log.error(`Error reading ${dir}\\allure-report\\data\\test-cases\\${uid}.json`);
                    return '';
                }
            }
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
