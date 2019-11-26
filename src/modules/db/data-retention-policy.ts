/**
 * TODO write documentation somewhere
 */
import { SqlUtil } from "./util";
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import { Configuration } from "../vscode/configuration";
import { makeLogger } from "../../utils";

const log = makeLogger();

abstract class DataRetentionPolicy extends SqlUtil {
    public abstract parse(policyConfig: string): string;
    public abstract pullSqlIds(): Items4Deletion;
}

class RemoveOlderThanDataRetentionPolicy extends DataRetentionPolicy {
    private duration: number | undefined;

    public parse(policy: string) {
        let result = new RegExp('(REMOVE|DELETE|CLEAN|CLEAN UP)([_ ]EVERYTHING)?[_ ]OLDER[_ ](THAN)? (.+);?', 'ui').exec(policy);
        if (result === null) {
            return '';
        }

        this.duration = require('parse-duration')(result[result.length - 1]);

        return result[0];
    }

    public pullSqlIds(): Items4Deletion {
        if (!this.duration) {
            return { ciRuns: [], individualTestResults: [] };
        }
        let result = this.db.prepare(`SELECT id FROM ci_run WHERE start_time < ?`)
            .pluck().all(new Date().getTime() - this.duration);

        return {
            ciRuns: result as number[],
            individualTestResults: []
        };
    }
}

interface Items4Deletion {
    ciRuns: number[];
    individualTestResults: string[];
}
class CleanUpUtilsSql extends SqlUtil {


    constructor(private items4Deletion: Items4Deletion) {
        super();
    }


    public cleanUp() {
        this.cleanUpAttachments();
        this.cleanUpTheDb();
    }

    private get ciRunsQuestionMarks() {
        return '?,'.repeat(this.items4Deletion.ciRuns.length).slice(0, -1);
    }
    private get testResultsQuestionMarks() {
        return '?,'.repeat(this.items4Deletion.individualTestResults.length).slice(0, -1);
    }

    private cleanUpTheDb() {
        if (!_.isEmpty(this.items4Deletion.ciRuns)) {
            let result = this.db.prepare(`DELETE FROM ci_run where id in (${this.ciRunsQuestionMarks})`).run(this.items4Deletion.ciRuns);
            log.info(`Removed ${result.changes} ci runs`);
        }
        if (!_.isEmpty(this.items4Deletion.individualTestResults)) {
            let result = this.db.prepare(`DELETE FROM test_result where uid in (${this.testResultsQuestionMarks})`).run(this.items4Deletion.individualTestResults);
            log.info(`Removed ${result.changes} testResults`);
        }
    }

    private getAttachmentSources() {
        let where1 = !_.isEmpty(this.items4Deletion.ciRuns) ? `cr.id in (${this.ciRunsQuestionMarks})` : '';
        let where2 = !_.isEmpty(this.items4Deletion.individualTestResults) ? `tr.uid in (${this.testResultsQuestionMarks})` : '';
        let sources = this.db.prepare(`SELECT source FROM attachments a
        JOIN test_result tr ON tr.uid = a.test_result_uid
        JOIN ci_run cr on cr.id = tr.ci_run_id
        WHERE ${where1} ${(where1 && where2) ? 'OR' : ''} ${where2}`)
            .pluck()
            .all(
                _.concat(this.items4Deletion.ciRuns as any[], this.items4Deletion.individualTestResults)
            );
        return sources as string[];
    }

    private cleanUpAttachments() {
        const sources = this.getAttachmentSources();

        log.info(`Cleaning up the following attachments: ${sources}`);
        const screenshotsPath = Configuration.projectConfig.screenshotsPath;
        sources.forEach(source => {
            fs.unlink(path.join(screenshotsPath, source), (err) => {
                if (err) {
                    log.warn(`Failed to delete ${source}. ${err}`);
                } else {
                    log.debug(`Sucessfully removed ${source}`);
                }
            });
        });
    }
}

export class CleanUpUtils {
    // need to be inited when configuration is available
    private static _policies: DataRetentionPolicy[];

    private static get policies() {
        if (!this._policies) {
            this._policies = [new RemoveOlderThanDataRetentionPolicy()];
        }
        return this._policies;
    }

    public static cleanUp() {
        try {
            if (!Configuration.projectConfig.db) {
                // the configuration is not defined
                return;
            }
            CleanUpUtils.parseConfiguration();
        } catch (e) {
            log.warn(`Error parsing configuration: ${e}`);
            return;
        }
        try {
            const toDelete = CleanUpUtils.pullItemsForDeletion();
            if (_.isEmpty(toDelete.individualTestResults) && _.isEmpty(toDelete.ciRuns)) {
                log.debug(`Not cleaning up anything yet. ${JSON.stringify(this.policies)}`);
                return;
            } else {
                log.info(`Going to clean up the following: ${JSON.stringify(toDelete)}`);
            }
            new CleanUpUtilsSql(toDelete).cleanUp();
        } catch(e) {
            // TODO happens when the db does not exist, it can be checked
            log.warn(`Error performing clean up ${e}`);
        }
    }

    private static pullItemsForDeletion(): Items4Deletion {
        let toDelete: Items4Deletion = this.policies.reduce((obj, policy) => {
            let newObj = policy.pullSqlIds();
            return {
                ciRuns: _.concat(obj.ciRuns, newObj.ciRuns) as number[],
                individualTestResults: _.concat(obj.individualTestResults, newObj.individualTestResults || []) as string[],
            };
        }, {
            ciRuns: [] as number[],
            individualTestResults: [] as string[]
        } as Items4Deletion);
        return toDelete;
    }

    private static parseConfiguration() {
        let config = Configuration.commonConfig.dataRetentionPolicy;
        this.policies.forEach((policy) => {
            let thisPolicy = policy.parse(config);
            config = config.replace(thisPolicy, '').trim();
        });
        if (config.trim()) {
            log.warn(`Unknown config for data retention policy: ${config}`);
        }
    }
}
