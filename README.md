# Idea

Idea is to pull from jenkins status of existing tests for the current branch.

Information from the local machine:
1. Jenkins job url in config
2. credentials
3. branch
4. suites and tests

Information from the jenkins:
1. Branch
2. Suites

# Thoughts

1. Needs to be done as VSCode plugin as it would be convenient to show the info near the test
2. might require a db, to keep the history of previous runs and comments

# Feasibility

- [x] It's possible to get machine-readable info from allure
- [ ] It's possible to use db or generally call third-party program from the extension (in later case, I'd need to wrap the db).
