import * as fs from 'fs';
import { IJenkinsBuild } from 'jenkins-api-ts-typings';

export class AlluresReportAnalyzer {
    constructor(private readonly dir: string) {
    }

    public parse() {
        return {
            behaviors: this.parseBehaviors()
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

export function getTestSuite(build: IJenkinsBuild) {
    let params: any = build.actions.find(action => {
        return action._class === 'hudson.model.ParametersAction';
    });
    let suitesParam = params.parameters.find((param:any) => {
        return param['name'] === 'SUITES';
    });
    return suitesParam['value'];
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
