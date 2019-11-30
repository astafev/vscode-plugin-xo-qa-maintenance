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

    private tabs(runs: TestCaseRun[]): string {
        return runs.map(run => {
            return `<div id="tab${run.uid}" onclick="switchToBuild('${run.uid}')">${run.ci_run_id}: ${this.statusFomatted(run)}</div>`;
        }).join('');
    }

    private statusFomatted(run: TestCaseRun) {
        return `<span style="color: ${run.result === 'passed' ? 'limegreen' : 'red'};">${htmlencode(run.result)}</span>`;
    }

    private content(run: TestCaseRun, webview: vscode.Webview) {
        return `<h2>Build <a href="${Configuration.projectConfig.jenkinsJobUrl}/${run.ci_run_id}/">#${run.ci_run_id}</a>.
        Status: <a href="${Configuration.projectConfig.jenkinsJobUrl}/${run.ci_run_id}/allure/#testresult/${run.uid}/">${this.statusFomatted(run)}</a></h2>
    
        <p>
            Duration: ${humanizeDuration(run.duration)}
        </p>
        <p>
            <h3>Execution log</h3>
            <pre>${this.printLog(run, webview)}</pre>
        </p>`;
    }

    private allContent(runs: TestCaseRun[], webview: vscode.Webview): string {
        return runs.map(run => {
            return `<div class="content" id="content${run.uid}">${this.content(run, webview)}</div>`;
        }).join('');
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
        let content = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.details.id}."${this.details.title}"</title>
    <style type="text/css">
      .tabs>div {
        display: inline-block;
        padding: 15px 25px;
        text-align: center;
        border: 1px solid #ddd;
      }
      .tabs>div.active {
        font-weight: bold;
      }
      div.content {
        display: none;
      }
      div.content.active {
        display: block;
      }
    </style>
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
    <div class="tabs">
	    ${this.tabs(this.details.runs)}
	</div>
    <hr>
    ${this.allContent(this.details.runs, webview)}

    <script nonce="${nonce}">
        var activeBuild = undefined;
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
                let result = vscode.postMessage({ command: 'commentUpdate', text: comment.trim(), uid: activeBuild });
                updateComment_after(true);
            } catch(e) {
                updateComment_after(false);
            }
        }
		function switchToBuild(uid) {
		    if (uid === activeBuild) {
			    return;
			}
		    document.getElementById('tab' + uid).classList.add('active');
            document.getElementById('content' + uid).classList.add('active');
            if (activeBuild) {
                document.getElementById('tab' + activeBuild).classList.remove('active');
			    document.getElementById('content' + activeBuild).classList.remove('active');
			}
			activeBuild = uid;
		}
		switchToBuild('${lastRun.uid}');
    </script>
</body>

</html>`;
        return content;
    }

}