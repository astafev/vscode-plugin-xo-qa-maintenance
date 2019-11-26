import { TestCaseDetails } from "../dto/testCaseDetails";
import * as _ from "lodash";
import { AbstractWebView } from "./abstract-web-view";
import humanizeDuration = require("humanize-duration");
import { makeLogger } from "../../utils";
import * as vscode from 'vscode';
import * as path from 'path';
import { TestCaseRun } from "../dto/testCaseRun";
import { ATTACHMENT_SECTION_START, ATTACHMENT_SECTION_END, Attachment } from "../jenkins/allure-analyze";
import { Configuration } from "../vscode/configuration";
let htmlencode = require('htmlencode').htmlEncode;

export class RunDetailsWebView extends AbstractWebView {
    private log = makeLogger();
    constructor(private details: TestCaseDetails, private error?: string) {
        super();
    }

    private importAttachment(attachmentUid: string, run: TestCaseRun, webview: vscode.Webview) {
        const attachment = run.attachments.find(a => {
            return a.uid === attachmentUid;
        });
        if (!attachment) {
            this.log.error(`Error: can't find an attachment ${attachmentUid} in run ${JSON.stringify(run)}`);
            return '';
        }
        const onDiskPath = vscode.Uri.file(path.join(Configuration.projectConfig.screenshotsPath, attachment.source));
        const url = webview.asWebviewUri(onDiskPath);
        return `\n\n${attachment.name}:\n<img src="${url}" alt="${attachment.name}">`;
    }

    private printLog(run: TestCaseRun, webview: vscode.Webview) {
        let processedLog = '';
        let currentIdx = 0;

        const log = run.console;
        let startIdx = -1;
        while ((startIdx = log.indexOf(ATTACHMENT_SECTION_START, currentIdx)) !== -1) {
            const endIdx = log.indexOf(ATTACHMENT_SECTION_END, startIdx + ATTACHMENT_SECTION_START.length);
            const id = log.substring(startIdx + ATTACHMENT_SECTION_START.length, endIdx);
            processedLog += htmlencode(log.substring(currentIdx, startIdx)) + this.importAttachment(id, run, webview);
            currentIdx = endIdx + ATTACHMENT_SECTION_END.length;
        }
        processedLog += htmlencode(log.substring(currentIdx));
        return processedLog;
    }

    public generateHtml(webview: vscode.Webview) {
        if (this.error !== undefined) {
            return this.fallBack(this.error);
        }
        if (_.isEmpty(this.details) || _.isEmpty(this.details.runs)) {
            return this.fallBack(`No builds pulled from the CI found.`);
        }
        const lastRun = this.details.runs[0];
        const nonce = this.getNonce();
        this.log.info(`Showing details view for ${this.details.id}`);
        // this.log.debug(JSON.stringify(this.details));
        // TODO set up CSP. The config suggested in the documentation makes styles not working
        return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.details.id}."${this.details.title}"</title>
</head>

<body>
    <h1>${this.details.title}</h1>

    <textarea id="commentInput" placeholder="Comment..." 
    style="min-width: 50%; min-height: 100px"
    >${htmlencode(this.details.lastComment || '')}</textarea>
    <p>
        <button onclick="saveComment()">Update comment</button>    
        <span id="successMsg" style="color: limegreen; display: none;">Successfully saved</span>
        <span id="errorMsg" style="color: red; display: none;">Error!</span>
        <span id="inProcessMsg" style="display: none;">Saving...</span>
    </p>
    <hr>
    <h2>Build <a href="http://jenkins.aureacentral.com/job/ResponseTek/job/eng-qa-integration/job/common-pipeline/${lastRun.ci_run_id}/">#${lastRun.ci_run_id}</a>.
    Status: <a href="http://jenkins.aureacentral.com/job/ResponseTek/job/eng-qa-integration/job/common-pipeline/${lastRun.ci_run_id}/allure/#testresult/${lastRun.uid}/"><span style="color: ${lastRun.result === 'passed' ? 'limegreen' : 'red'};">${htmlencode(lastRun.result)}</span></a></h2>

    <p>
        Duration: ${humanizeDuration(lastRun.duration)}
    </p>
    <p>
        <h3>Execution log</h3>
        <pre>${this.printLog(lastRun, webview)}</pre>
    </p>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
    
        function updateComment_after(result) {
            document.getElementById('inProcessMsg').style.display = 'none';
            let el;
            if (result) {
                el = document.getElementById('successMsg');
            } else {
                el = document.getElementById('errorMsg');
            }
            el.style.display = 'inline';
            setTimeout(() => {
                el.style.display = 'none';
            }, 1500);
        }
        function saveComment() {
            let comment = document.getElementById('commentInput').value;
            document.getElementById('inProcessMsg').style.display = 'inline';
            try{
                let result = vscode.postMessage({ command: 'commentUpdate', text: comment.trim(), uid: '${lastRun.uid}' });
                updateComment_after(true);
            } catch(e) {
                updateComment_after(false);
            }
        }
    </script>
</body>

</html>`;
    }

}