import { JenkinsAPI } from "../jenkins/jenkins";
import { DbPopulator } from "../db/populator";
import * as vscode from 'vscode';

export class IdeCommands {

    constructor(
        private commonConfig: {
            jenkinsUser: string,
            jenkinsToken: string
        },
        private projectConfig: {
            db: string,
            jenkinsJob: string
        },
    ) {
    }

    public init() {
    }


    public pullTheBuilds(buildIds: number[]) {
        let api = this.getApi();
        let db = this.getDb();
        //vscode.window.
        return buildIds.reduce((promise, id) => {
            return promise.then(() => {
                return this.pullTheBuild(id, api, db);
            });
        }, Promise.resolve()).then(()=>{
            
        });
    }

    private getApi() {
        return new JenkinsAPI(this.commonConfig.jenkinsToken,
            this.commonConfig.jenkinsUser,
            this.projectConfig.jenkinsJob);
    }

    private getDb() {
        return new DbPopulator(this.projectConfig.db);
    }

    public pullTheBuild(buildId: number, api?: JenkinsAPI, db?: DbPopulator) {
        if (api === undefined) {
            api = this.getApi();
        }

        let _db: DbPopulator;
        if (db === undefined) {
            db = this.getDb();
        } else {
            _db = db;
        }
        return api.pullAllureReport(buildId).then(result => {
            return _db.store(result);
        }).then(() => {
            vscode.window.showInformationMessage(`Successfully pulled ${buildId} build`);
        }).catch(err => {
            vscode.window.showErrorMessage(`Had an error pulling build ${buildId}:
            ${err}`);
        });
    }
}