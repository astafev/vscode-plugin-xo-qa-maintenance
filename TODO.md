Done:
- [x] fix issue with sqlite
- [x] make configurable
- [x] save console output

next:
- [ ] analyze the source code
- [ ] view "detailed": test case results - last console, + 5 last builds with comments, + last not empty comment
- [ ] save screenshots
- [ ] view "detailed": add screenshots to the detailed view.
- [ ] view: modify default code view to include test case status (failing, flaky, successful)
- [~] log correctly. Check https://getpino.io/#/?

later:
- [ ] bundle
- [ ] db creation logic
- [ ] data retention policy
- [ ] idea: view for recent CI builds
- [ ] idea: command "pull X recent builds"
- [ ] idea: watch a build, pull when it's done
- [ ] add support for TeamCity
- [ ] status view: show the internal information like ci_run table

possible bugs (not important at the moment):
- [ ] check that the tmp directory is deleted fine
- [ ] check that saving a large build won't cause any problems because of keeping full log in memory for a long time.