import { TestCaseRun } from "./testCaseRun";

/**
 * Used to form a case details view.
 */
export interface TestCaseDetails {
    id: number;
    title: string;
    lastComment: string;
    runs: TestCaseRun[];
}
