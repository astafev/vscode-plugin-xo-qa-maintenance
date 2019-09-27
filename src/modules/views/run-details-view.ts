import { TestCaseDetails } from "../dto/testCaseDetails";
import * as _ from "lodash";
import { AbstractWebView } from "./abstract-view";
import humanizeDuration = require("humanize-duration");

export class RunDetailsWebView extends AbstractWebView {
    constructor(private details: TestCaseDetails) {
        super();
    }

    public generateHtml() {
        if (_.isEmpty(this.details.runs)) {
            return this.fallBack(`No builds pulled from the CI found.`);
        }
        const lastRun = this.details.runs[0];
        return `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${this.details.id}."${this.details.title}"</title>
        </head>
        
        <body>
            <h1>${this.details.title}</h1>
        
            <textarea name="comment" placeholder="Comment..." style="min-width: 50%; min-height: 100px">
                ${!this.details.lastComment ? '' : this.details.lastComment}
            </textarea>
            <p>
                Duration: ${humanizeDuration(lastRun.duration)}
            </p>
            <p>
                <h3>Execution log</h3>
                <pre style="margin-left: 3%">
                ${lastRun.console}
                </pre>
            </p>
        </body>
        
        </html>`;
    }

}