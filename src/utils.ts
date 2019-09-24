import * as _ from 'lodash';
import { createLogger, transports } from 'winston';

export function parseRange(input: string) {
    if (!input) {
        return [];
    }
    let parts = input.split(',');
    let arr = parts.reduce((arr, part: string) => {
        part = part.trim();
        if (!part) {
            // empty, skip
        } else if (part.indexOf('-') === -1) {
            arr.push(Number.parseInt(part));
        } else {
            let startFinish = part.split('-');
            if (startFinish.length !== 2) {
                throw new Error(`unknown format ${part}`);
            }
            let start = Number.parseInt(startFinish[0]);
            let finish = Number.parseInt(startFinish[1]);
            if (finish < start) {
                throw new Error(`unknown format ${part}`);
            }
            for (let i = start; i <= finish; i++) {
                arr.push(i);
            }
        }
        return arr;
    }, [] as number[]);
    return _.uniq(arr);
}

export function makeLogger() {
    return createLogger({
        transports: [
            new transports.Console({
                // winston has problems working with in vs code
                // https://github.com/winstonjs/winston/issues/1544
                // https://github.com/microsoft/vscode/issues/69959
                log: (info, next) => {
                    console.log(`${info.level.toUpperCase()} ${info.message}`);
                    next();
                }
            }),
        ],
    });
}