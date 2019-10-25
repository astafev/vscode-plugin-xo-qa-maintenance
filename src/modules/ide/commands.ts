import { JenkinsAPI } from "../jenkins/jenkins";
import { DbPopulator } from "../db/populator";
import * as vscode from 'vscode';
import { PREFIX } from "../../extension";
import { makeLogger } from "../../utils";
import { RunDetailsWebView } from "../webviews/run-details-view";
import { TextUtil } from "./text-util";
import { InfoProvider } from "../db/info-provider";
import { TestCaseDetails } from "../dto/testCaseDetails";
import { IdTitle } from "../dto/idTitle";

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
        this.log.error(errorMsg);
        vscode.window.showErrorMessage(errorMsg);
        return new Error(errorMsg);
    }

    public information(message: string) {
        this.log.info(message);
        vscode.window.showInformationMessage(message);
    }

    public pullTheBuilds(buildIds: number[]) {
        let api = this.getApi();
        let db = this.getDbPopulator();
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

    private getDbPopulator() {
        return new DbPopulator(this.projectConfig.db);
    }

    private getDbInfoProvider() {
        return new InfoProvider(this.projectConfig.db);
    }

    public pullTheBuild(buildId: number, api?: JenkinsAPI, db?: DbPopulator) {
        if (api === undefined) {
            api = this.getApi();
        }

        let _db: DbPopulator;
        if (db === undefined) {
            db = this.getDbPopulator();
        } else {
            _db = db;
        }
        this.information(`Pulling build ${buildId}`);
        return api.pullCiBuild(buildId).then(result => {
            return _db.store(result);
        }).then(() => {
            this.information(`Successfully pulled ${buildId} build`);
        }).catch(err => {
            this.log.error(err);
            this.error(`Had an error pulling build ${buildId}:
            ${err}`);
        });
    }

    public createAWebView(editor: vscode.TextEditor) {
        this.log.info(`Generating a web view`);
        let idTitle: IdTitle;
        try {
            idTitle = new TextUtil(editor.document).getTestCase(editor.selection);
        } catch (e) {
            this.error(`Can't parse the test file.`);
            return;
        }
        this.log.debug(`id = ${idTitle.id}, title = ${idTitle.title}`);
        const panel = vscode.window.createWebviewPanel(
            'testCaseDetails',
            `${idTitle.id} "${idTitle.title}"`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        try {
            let details = this.getDbInfoProvider().getTestCaseRunDetails(idTitle);
            panel.webview.html = new RunDetailsWebView(details).generateHtml(panel.webview);
            panel.webview.onDidReceiveMessage(message => {
                this.log.info(`Received a message. ${JSON.stringify(message)}`);
                switch (message.command) {
                    case 'commentUpdate':
                        this.getDbPopulator().updateComment(message.uid, message.text);
                        return;
                }
            });
        } catch (e) {
            console.log(e);
            panel.webview.html = new RunDetailsWebView({} as TestCaseDetails).generateHtml(panel.webview);
        }
    }
}