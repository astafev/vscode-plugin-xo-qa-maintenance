import * as vscode from 'vscode';
import { PREFIX } from "../../extension";
import { makeLogger } from "../../utils";
import { InfoProvider } from "../db/info-provider";
import * as path from 'path';

export interface ProjecConfig {
    db: string;
    jenkinsJobUrl: string;
    /** path where test suites are suited. Default to e2e/test-suites */
    pathFromRoot: string;
}

export interface CommonConfig {
    jenkinsUser: string;
    jenkinsToken: string;
}

export class Configuration {
    private static log = makeLogger();

    static instance: Configuration;
    private static onUpdateCallbacks: Function[];

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
        this.onUpdateCallbacks.forEach(fn=>{
            fn(event);
        });
    }

    private static async readConfiguration() {
        this.log.info('Reading configuration');
        const config = await vscode.workspace.getConfiguration(PREFIX, null);
        let projectConfig = {
            db: config.get('db', ''),
            jenkinsJobUrl: config.get('jenkinsJob', ''),
            pathFromRoot: config.get('pathFromRoot', path.join('e2e', 'test-suites'))
        };

        let commonConfig = {
            jenkinsUser: config.get('jenkinsUser', ''),
            jenkinsToken: config.get('jenkinsToken', '')
        };
        this.log.debug(`The project config`, projectConfig);
        return {
            projectConfig, commonConfig
        };
    }

    public static get projectConfig(): ProjecConfig {
        if (!this.instance  || !this.instance._projectConfig) {
            throw new Error('Define the configuration');
        }
        return this.instance._projectConfig;
    }

    public static get commonConfig(): CommonConfig {
        if (!this.instance  || !this.instance._commonConfig) {
            throw new Error('Define the configuration');
        }
        return this.instance._commonConfig;
    }
}