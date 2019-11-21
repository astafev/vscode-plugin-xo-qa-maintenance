Components
=================

Test View
--------------
The plugin submits another view to the vs code (another button on the left panel).
This panel in some sense resembles Explorer (the main view that shows files), but also helps with navigation to individual tests, shows their status and helps to run a specific test case/file/folder.

CI Component
-------------
Set of functions that helps to retrieve the CI job result from the server. At the moment, Jenkins is the only available thing.

DB
-----------
Stores the information from the CI server. At the moment, SQLite is used, no data retention policy, so the db will keep growing until you manuall clean it up.