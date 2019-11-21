import { JenkinsAPI } from "../jenkins/jenkins";
import { DbPopulator } from "../db/populator";
import * as vscode from 'vscode';
import { makeLogger, parseRange } from "../../utils";
import { RunDetailsWebView } from "../webviews/run-details-view";
import { TextUtil } from "./text-util";
import { InfoProvider } from "../db/info-provider";
import { TestCaseDetails } from "../dto/testCaseDetails";
import { IdTitle } from "../dto/idTitle";
import { Configuration } from "./configuration";
import { AlluresReportAnalyzer } from "../jenkins/allure-analyze";
import { JenkinsBuild } from "../jenkins/dto";

export class IdeCommands {

    private log = makeLogger();

    constructor() {
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
    public async pullTheBuildsCmd() {
        let buildsInput = await vscode.window.showInputBox({
            placeHolder: '10, 11, 12-15',
            prompt: 'the range is inclusive'
        });
        if (!buildsInput) {
            // do nothing
            return;
        }
        let builds = parseRange(buildsInput);
        this.pullTheBuilds(builds);
    }

    public async pullNLastBuildsCmd() {
        let buildsInput = await vscode.window.showInputBox({
            prompt: 'How many builds do I want to pull?'
        });
        if (!buildsInput) {
            // do nothing
            return;
        }
        let builds;
        try {
            builds = Number.parseInt(buildsInput, 10);
        } catch (e) {
            this.log.warn(`Unable to parse ${buildsInput}`, e);
            this.error(`Please define a number, can't parse "${buildsInput}"`);
            return;
        }
        this.pullNLastBuilds(builds);
    }

    /** */
    public async pullCiBuildsCmd() {
        const pullTheBuildsOption = 'Pull exact builds (I want to specify ids)';
        const pullNLastBuildsOption = 'Pull N last builds builds';
        const command = await vscode.window.showQuickPick([pullTheBuildsOption, pullNLastBuildsOption]);
        if (command === pullTheBuildsOption) {
            return this.pullTheBuildsCmd();
        } else if (command === pullNLastBuildsOption) {
            return this.pullNLastBuildsCmd();
        }

    }
    private async pullNLastBuilds(n: number) {
        const api = this.getApi();
        const builds = await api.getLastNFinishedBuilds(n);
        this.information(`Goind to pull builds ${builds.join(',')}`);
        this.pullTheBuilds(builds);
    }

    private pullTheBuilds(buildIds: number[]) {
        let api = this.getApi();
        let db = this.getDbPopulator();
        //vscode.window.
        return buildIds.reduce((promise, id) => {
            return promise.then(() => {
                return this.pullTheBuild(id, api, db);
            });
        }, Promise.resolve()).then(() => {
            this.information(`Successfully pulled builds ${buildIds.join(',')}`);
        });
    }

    private getApi() {
        let jenkinsConfig = Configuration.commonConfig;
        return new JenkinsAPI(jenkinsConfig.jenkinsToken,
            jenkinsConfig.jenkinsUser,
            Configuration.projectConfig.jenkinsJobUrl);
    }

    private getDbPopulator() {
        return new DbPopulator();
    }

    private getDbInfoProvider() {
        return InfoProvider.instance;
    }

    public pullTheBuild(buildId: number, api: JenkinsAPI = this.getApi(), populator: DbPopulator) {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Pulling build ${buildId}`,
            cancellable: true
        }, (progress, token) => {
            let cancelled = false;
            token.onCancellationRequested(() => {
                this.log.info(`User cancelled ${buildId} build pull`);
                cancelled = true;
            });
            return api.getBuildStatus(buildId).then(build => {
                progress.report({ increment: 10, message: `Pulled build metainfo, checking the build...` });
                return api.checkBuild(build).then(() => {
                    if (cancelled) {
                        return '';
                    }
                    progress.report({ increment: 25, message: `Build is fine. Downloading the artefacts...` });
                    return api.downloadAndUnzip(build, buildId);
                }).then(dir => {
                    if (cancelled) {
                        return undefined;
                    }
                    progress.report({ increment: 80, message: `Downloaded. Parsing...` });
                    return new JenkinsBuild(
                        build,
                        new AlluresReportAnalyzer(dir).parse());
                }).then(dto => {
                    if (cancelled || !dto) {
                        return null;
                    }
                    progress.report({ increment: 90, message: `Parsed. Storing...` });
                    return populator.store(dto);
                });
            }).catch(err => {
                this.log.error(err);
                this.error(`Had an error pulling build ${buildId}:
                ${err}`);
            });
        }).then(() => {
            // casting from Thenable to a Promise for convenience
            this.log.info(`Pulled build ${buildId}`);
            return Promise.resolve();
        });
    }

    public createAWebViewFromEditor(editor: vscode.TextEditor) {
        let idTitle: IdTitle;
        this.log.info(`Generating a web view`);
        try {
            idTitle = TextUtil.fromTextDocument(editor.document).getTestCase(editor.selection);
        } catch (e) {
            this.error(`Can't parse the test file.`);
            return;
        }
        return this.createAWebViewFromIdTitle(idTitle);
    }
    public createAWebViewFromIdTitle(idTitle: IdTitle) {
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