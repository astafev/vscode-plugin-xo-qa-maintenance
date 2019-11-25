/**
 * TODO write documentation somewhere
 */
import { SqlUtil } from "./util";
import * as fs from 'fs';
import { Configuration } from "../vscode/configuration";
import { makeLogger } from "../../utils";

enum DataRetentionPolicyType {
    REMOVE_OLDER_THAN
}

abstract class DataRetentionPolicy {
    public abstract parse(policyConfig: string): string;
}

class RemoveOlderThanDataRetentionPolicy extends DataRetentionPolicy {
    private duration : number | undefined;

    public parse(policy: string) {
        let result = new RegExp('(REMOVE|DELETE|CLEAN|CLEAN UP)([_ ]EVERYTHING)?[_ ]OLDER[_ ](THAN)? (.+);?', 'ui').exec(policy);
        if (result === null) {
            return '';
        }

        this.duration = require('parse-duration')(result[result.length - 1]);

        return result[0];
    }
}

export class CleanUpUtils extends SqlUtil {
    // everything can be static as well as configuration is static
    private static readonly policies: DataRetentionPolicy[] = [new RemoveOlderThanDataRetentionPolicy()]
    
    private static log = makeLogger();

    public static cleanUp() {
        this.parseConfiguration();
    }

    private static parseConfiguration() {
        let config = Configuration.commonConfig.dataRetentionPolicy;
        this.policies.forEach((policy) => {
            let thisPolicy = policy.parse(config);
            config = config.replace(thisPolicy, '').trim();
        });
        if (config.trim()) {
            this.log.warn(`Unknown config for data retention policy: ${config}`);
        }
    }
}
