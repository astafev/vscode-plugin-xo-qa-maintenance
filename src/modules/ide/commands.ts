import { JenkinsAPI } from "../jenkins/jenkins";
import { DbPopulator } from "../db/populator";
import * as vscode from 'vscode';
import { PREFIX } from "../../extension";
import { makeLogger } from "../../utils";

export class IdeCommands {
    private _commonConfig?: {
        jenkinsUser: string,
        jenkinsToken: string
    };
    private _projectConfig?: {
        db: string,
        jenkinsJob: string
    };

    private log = makeLogger();

    constructor() {
    }

    async init() {
        await this.readConfiguration();
    }

    public async readConfiguration() {
        this.log.info('Reading configuration');
        const config = await vscode.workspace.getConfiguration(PREFIX, null);
        this._projectConfig = {
            db: config.get('db', ''),
            jenkinsJob: config.get('jenkinsJob', '')
        };

        this._commonConfig = {
            jenkinsUser: config.get('jenkinsUser', ''),
            jenkinsToken: config.get('jenkinsToken', '')
        };
        this.log.debug(`The project config`, this._projectConfig);
    }

    public setConfig(
        commonConfig: {
            jenkinsUser: string,
            jenkinsToken: string
        },
        projectConfig: {
            db: string,
            jenkinsJob: string
        }
    ) {
        this._commonConfig = commonConfig;
        this._projectConfig = projectConfig;
    }

    private get projectConfig(): { db: string, jenkinsJob: string } {
        if (this._projectConfig === undefined) {
            throw this.error('Define the configuration');
        }
        return this._projectConfig;
    }

    private get commonConfig(): { jenkinsUser: string, jenkinsToken: string } {
        if (this._commonConfig === undefined) {
            throw this.error('Define the configuration');
        }
        return this._commonConfig;
    }

    public error(errorMsg: string) {
        vscode.window.showErrorMessage(errorMsg);
        return new Error(errorMsg);
    }

    public information(message: string) {
        vscode.window.showInformationMessage(message);
    }

    public pullTheBuilds(buildIds: number[]) {
        let api = this.getApi();
        let db = this.getDb();
        //vscode.window.
        return buildIds.reduce((promise, id) => {
            return promise.then(() => {
                return this.pullTheBuild(id, api, db);
            });
        }, Promise.resolve()).then(() => {

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
            this.information(`Successfully pulled ${buildId} build`);
        }).catch(err => {
            this.error(`Had an error pulling build ${buildId}:
            ${err}`);
        });
    }
}