import * as rm from 'typed-rest-client/RestClient';
import { BasicCredentialHandler } from 'typed-rest-client/Handlers';
import { IJenkinsBuild } from 'jenkins-api-ts-typings';
import * as fs from 'fs';
import * as tmp from 'tmp';
import * as unzip from 'unzipper';
import { promisify } from 'util';
import { AlluresReportAnalyzer } from './allure-analyze';

export class JenkinsAPI {
    private static readonly ALLURE_REPORT_NAME = 'allure-report.zip';

    readonly rest: rm.RestClient;

    constructor(private readonly token: string,
        private readonly user: string,
        private readonly prefix: string
    ) {
        this.rest = new rm.RestClient(
            'qa-maint-bot',
            prefix,
            [new BasicCredentialHandler(user, token)]
        );
    }

    public async getBuildStatus(buildId: string | number): Promise<IJenkinsBuild> {
        let res: rm.IRestResponse<IJenkinsBuild> = await this.rest.get<IJenkinsBuild>(
            buildId + '/api/json');

        if (res.statusCode !== 200) {
            console.error(res.statusCode);
            console.error(res.result);
            throw new Error('Error!');
        }

        if (res.result === null) {
            console.log(res.result);
            throw new Error('Unknown result');
        }
        return res.result;
    }

    public async checkBuild(build: IJenkinsBuild) {
        if (!build.result) {
            throw new Error(`The build ${build.url} has not finished`);

        }
        if (build.artifacts.length !== 1
            && build.artifacts[0].fileName[0] !== JenkinsAPI.ALLURE_REPORT_NAME) {
            throw new Error(`Unknown format of the artifacts array. ${build.url}
            ${JSON.stringify(build.artifacts)}`);
        }
        console.log(`Checked build ${build.id}. It's ok`);
    }

    public async pullAllureReport(buildId: number) {
        let build = await this.getBuildStatus(buildId);
        this.checkBuild(build);
        let dir = await this.downloadAndUnzip(`${this.prefix}${buildId}/artifact/${JenkinsAPI.ALLURE_REPORT_NAME}`);
        return {
            build: build,
            report: new AlluresReportAnalyzer(dir).parse(),
        };
    }

    private downloadAndUnzip(address: string): Promise<string> {
        const client = this.rest.client;
        return new Promise((resolve, reject) => {
            tmp.dir(async (err, dir) => {
                if (err) {
                    reject(err);
                }

                console.log('Directory: ', dir);
                console.log(`Requesting ${address}`);

                let stream = (await client.get(address)).message
                    .pipe(
                        unzip.Extract({ path: dir })
                    );


                stream.on('finish', () => {
                    resolve(dir);
                });
                stream.on('error', reject);
            });
        });
    }
}
