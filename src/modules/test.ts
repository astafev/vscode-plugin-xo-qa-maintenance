import { JenkinsAPI } from "./jenkins/jenkins";

console.log('heelo world3');
let jenkins = new JenkinsAPI('11e511b2463afa1d7ec883db743dad6ea9', 'eastafev',
    'http://jenkins.aureacentral.com/job/ResponseTek/job/eng-qa-integration/job/common-pipeline/');

jenkins.pullAllureReport(2344);