import * as vscode from 'vscode';
import { PREFIX } from "../../extension";
import { makeLogger } from "../../utils";
import * as path from 'path';

export interface ProjecConfig {
    db: string;
    jenkinsJobUrl: string;
    /** path where test suites are suited. Default to e2e/test-suites */
    pathFromRoot: string;
    screenshotsPath: string;
}

export interface CommonConfig {
    jenkinsUser: string;
    jenkinsToken: string;
    dataRetentionPolicy: string;
    protractorPath: string;
    dataFolder: string;
}

export class Configuration {
    private static log = makeLogger();

    static instance: Configuration;
    private static onUpdateCallbacks: Function[] = [];

    private constructor(private _commonConfig: CommonConfig, private _projectConfig: ProjecConfig) {
    }

    static registerCallbackOnUpdate(fn: Function) {
        this.onUpdateCallbacks.push(fn);
    }

    static async init() {
        let config = await this.readConfiguration();
        this.instance = new Configuration(config.commonConfig, config.projectConfig);

    }

    static async onUpdate(event: vscode.ConfigurationChangeEvent) {
        this.init();
        this.onUpdateCallbacks.forEach(fn => {
            fn(event);
        });
    }

    private static async readConfiguration() {
        this.log.info('Reading configuration');
        const config = await vscode.workspace.getConfiguration(PREFIX, null);

        let commonConfig = {
            jenkinsUser: config.get('jenkinsUser', ''),
            jenkinsToken: config.get('jenkinsToken', ''),
            dataRetentionPolicy: config.get('dataRetentionPolicy', ''),
            dataFolder: config.get('dataFolder', ''),
            protractorPath: config.get('protractorPath', '')
        } as CommonConfig;

        let projectConfig = {
            db: config.get('db'),
            jenkinsJobUrl: config.get('jenkinsJob', ''),
            pathFromRoot: config.get('pathFromRoot'),
            screenshotsPath: config.get('screenshotsPath'),
        } as ProjecConfig;
        if (!projectConfig.db && commonConfig.dataFolder && vscode.workspace.workspaceFolders) {
            projectConfig.db = path.join(commonConfig.dataFolder,
                vscode.workspace.workspaceFolders[0].name,
                'the_db.db');
        }
        if (!projectConfig.screenshotsPath) {
            projectConfig.screenshotsPath = path.join(path.dirname(projectConfig.db), 'attachments');
        }


        this.log.debug(`The project config`, projectConfig);
        return {
            projectConfig, commonConfig
        };
    }

    public static get projectConfig(): ProjecConfig {
        if (!this.instance || !this.instance._projectConfig) {
            throw new Error('Define the configuration');
        }
        return this.instance._projectConfig;
    }

    public static get commonConfig(): CommonConfig {
        if (!this.instance || !this.instance._commonConfig) {
            throw new Error('Define the configuration');
        }
        return this.instance._commonConfig;
    }
}