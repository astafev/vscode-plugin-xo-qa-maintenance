## Features

1. Provides a convenient way to start and debug individual tests.
2. You can pull an allure report from Jenkins, store it in local DB (SQLite is being used)
3. You can assign a comment for specific test cases (when you want to leave a note for yourself).
4. You can navigate and see statuses of the tests in tree view.

![IDE View](./Capture.png)

![Demo](./demo1.gif)

![Pulling a build](./demo2.gif)

## Usage pattern

1. Install.
2. Define jenkins user/token if you're going to connect it.
3. define dataFolder in user settings.
4. you might need to redefine protractorPath (on my local computer it is set as `C:\Users\astaf\AppData\Roaming\npm\node_modules\protractor\bin\protractor`)
For the project if you're using jenkins:
1. Define jenkins job;
2. pull one or more last builds;
3. Up to you to redefine db path, screenshots path, path from root, etc.



## Known Issues

https://github.com/astafev/vscode-plugin-xo-qa-maintenance/issues

## Release Notes

### 0.0.1

Initial release

### 0.0.2

Add demo, some polishing.