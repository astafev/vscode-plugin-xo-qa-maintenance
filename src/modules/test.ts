import { JenkinsAPI } from "./jenkins/jenkins";
import { DbPopulator } from "./db/populator";

const commonConfig = {
    jenkinsAuth: {
        token: '11e511b2463afa1d7ec883db743dad6ea9',
        user: 'eastafev'
    }
};

const projectSpecificConfig = {
    db: 'F:/data/vscode-extension-maintenance/responsetek.db',
    jenkinsJob: 'http://jenkins.aureacentral.com/job/ResponseTek/job/eng-qa-integration/job/common-pipeline/'
};

let jenkins = new JenkinsAPI(commonConfig.jenkinsAuth.token, commonConfig.jenkinsAuth.user,
    projectSpecificConfig.jenkinsJob);

let result = jenkins.pullAllureReport(2342);
result.then(result1=>{
    let db = new DbPopulator(projectSpecificConfig.db);
    db.store(result1);
});
