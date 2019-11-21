import * as rm from 'typed-rest-client/RestClient';
import { BasicCredentialHandler } from 'typed-rest-client/Handlers';
import { IJenkinsBuild } from 'jenkins-api-ts-typings';
import * as tmp from 'tmp';
import * as unzip from 'unzipper';
import { AlluresReportAnalyzer } from './allure-analyze';
import { makeLogger } from '../../utils';
import { CIBuild, JenkinsBuild } from './dto';

export class JenkinsAPI {
    private static instance: JenkinsAPI;
    private static readonly ALLURE_REPORT_NAME = 'allure-report.zip';

    readonly rest: rm.RestClient;

    private readonly log = makeLogger();

    constructor(token: string,
        user: string,
        private readonly prefix: string
    ) {
        this.rest = new rm.RestClient(
            'qa-maint-bot',
            prefix,
            [new BasicCredentialHandler(user, token)]
        );
        JenkinsAPI.instance = this;
    }

    public static getInstance(): JenkinsAPI {
        return JenkinsAPI.instance;
    }

    public async getBuildStatus(buildId: string | number): Promise<IJenkinsBuild> {
        let res: rm.IRestResponse<IJenkinsBuild> = await this.rest.get<IJenkinsBuild>(
            buildId + '/api/json');

        if (res.statusCode !== 200) {
            this.log.error(`Error getting build ${this.prefix}${buildId}`);
            this.log.error(`${res.statusCode}: ${res.result}`);
            if (res.statusCode === 404) {
                throw new Error(`The build ${buildId} was not found.`);
            } else {
                throw new Error(`Error downloading build ${buildId}! Status: ${res.statusCode}`);
            }
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
        this.log.info(`Checked build ${build.id}. It's ok`);
    }

    public async pullCiBuild(buildId: number): Promise<CIBuild> {
        let build = await this.getBuildStatus(buildId);
        this.checkBuild(build);
        let dir = await this._downloadAndUnzip(`${this.prefix}${buildId}/artifact/${JenkinsAPI.ALLURE_REPORT_NAME}`);
        return new JenkinsBuild(
            build,
            new AlluresReportAnalyzer(dir).parse());
    }

    public downloadAndUnzip(build: IJenkinsBuild, buildId: number): Promise<string> {
        return this._downloadAndUnzip(`${this.prefix}${buildId}/artifact/${JenkinsAPI.ALLURE_REPORT_NAME}`);
    }

    private _downloadAndUnzip(address: string): Promise<string> {
        const client = this.rest.client;
        return new Promise((resolve, reject) => {
            tmp.dir(async (err, dir) => {
                if (err) {
                    reject(err);
                }

                this.log.info('Directory: ', dir);
                this.log.info(`Requesting ${address}`);

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

    private async getAsString(address: string): Promise<string> {
        this.log.debug(`Getting ${address}`);
        const client = this.rest.client;

        let response = (await client.get(address));
        return response.readBody();
    }

    public getConsoleFull(buildId: number) {
        return this.getAsString(`${this.prefix}${buildId}/timestamps/?appendLog`);
    }
}
