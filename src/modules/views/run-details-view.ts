import { TestCaseDetails } from "../dto/testCaseDetails";
import * as _ from "lodash";
import { AbstractWebView } from "./abstract-view";
import humanizeDuration = require("humanize-duration");
import { makeLogger } from "../../utils";
import * as vscode from 'vscode';
let htmlencode = require('htmlencode').htmlEncode;

export class RunDetailsWebView extends AbstractWebView {
    private log = makeLogger();
    constructor(private details: TestCaseDetails, private error?: string) {
        super();
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
    </p>
    <hr>
    <h2>Build <a href="http://jenkins.aureacentral.com/job/ResponseTek/job/eng-qa-integration/job/common-pipeline/${lastRun.ci_run_id}/">#${lastRun.ci_run_id}</a>.
    Status: <a href="http://jenkins.aureacentral.com/job/ResponseTek/job/eng-qa-integration/job/common-pipeline/${lastRun.ci_run_id}/allure/#testresult/${lastRun.uid}/"><span style="color: ${lastRun.result === 'passed' ? 'limegreen' : 'red'};">${htmlencode(lastRun.result)}</span></a></h2>

    <p>
        Duration: ${humanizeDuration(lastRun.duration)}
    </p>
    <p>
        <h3>Execution log</h3>
        <pre>${htmlencode(htmlencode(lastRun.console))}</pre>
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