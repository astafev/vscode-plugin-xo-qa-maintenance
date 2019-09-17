import * as fs from 'fs';

export class AlluresReportAnalyzer {
    constructor(private readonly dir: string) {
    }

    public async parse() {
        this.parseBehaviors();
    }

    private async parseBehaviors() {
        let content = fs.readFileSync(`${this.dir}\\allure-report\\data\\behaviors.json`);
        let behaviors: Behaviors = JSON.parse(content.toString());
        behaviors.children.forEach(b => {
            let caseId = this.getTestCaseId(b.name);
            console.log(`Case: ${b.name}. id: ${caseId}. Status: ${b.status}`);
        });
    }

    private getTestCaseId(name: string) {
        let regexp = new RegExp('\\[(\\d*)\\]').exec(name);
        if (regexp === null) {
            throw new Error(`Unknown name: ${name}`);
        }
        return regexp[1];
    }
}

interface Behaviors {
    uid: string;
    children: BehaviorChild[];
    name: string;
}
interface BehaviorChild {
    name: string;
    uid: string;
    parentUid: string;
    status: string;
    flaky: boolean;
    time: { start: number, stop: number, duration: number };
}
