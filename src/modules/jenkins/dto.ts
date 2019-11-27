import { Behaviors, AllureReport } from "./allure-analyze";
import { IJenkinsBuild } from "jenkins-api-ts-typings";
import { JenkinsAPI } from "./jenkins";
import * as _ from "lodash";

export interface CIBuild {
    getId(): number;
    getTimestamp(): number;
    getDuration(): number;
    getResult(): string;
    getTestSuite(): string;
    getConsoleFull(): Promise<string>;
    getBranch(): string;
    getRevision(): string;
    getAllureReport(): AllureReport;
    getSpecs(): string;
    getTestCases(): string;
}

export class JenkinsBuild implements CIBuild {
    private consoleFull: Promise<string>;

    private buildData?: { revision: string, branch: string };

    constructor(private build: IJenkinsBuild,
        private report: AllureReport) {
        this.consoleFull = JenkinsAPI.getInstance().getConsoleFull(this.build.number);
    }

    getId(): number {
        return this.build.number;
    }

    getTimestamp(): number {
        return this.build.timestamp;
    }

    getDuration(): number {
        return this.build.duration;
    }

    getResult(): string {
        return this.build.result;
    }

    private getParamAction(name: string): string {
        let params: any = this.actionByClass('hudson.model.ParametersAction')[0];
        if (!params.parameters) {
            throw new Error(`Wrong format of params action: ${JSON.stringify(params)}`);
        }
        let paramVal = params.parameters.find((param: any) => {
            return param['name'] === name;
        });
        if (!paramVal) {
            throw new Error(`Can't find the ${name} parameter`);
        }
        return paramVal['value'];
    }

    getTestSuite(): string {
        return this.getParamAction('SUITES');
    }
    getSpecs(): string {
        return this.getParamAction('SPECS');
    }
    getTestCases(): string {
        return this.getParamAction('TEST_CASES');
    }

    private actionByClass(clazz: string): any[] {
        let action = this.build.actions.filter(action => {
            return action._class === clazz;
        });
        if (action.length === 0) {
            throw new Error(`Wrong class name for jenkins job: ${clazz}. Jenkins job is ${this.getId()}`);
        }
        return action;
    }


    getBranch(): string {
        let action = _.last(this.actionByClass('hudson.plugins.git.util.BuildData'));
        return action.lastBuiltRevision.branch[0].name;
    }

    getRevision(): string {
        let action = _.last(this.actionByClass('hudson.plugins.git.util.BuildData'));
        return action.lastBuiltRevision.SHA1;
    }

    getConsoleFull(): Promise<string> {
        return this.consoleFull;
    }

    getAllureReport(): AllureReport {
        return this.report;
    }
}
