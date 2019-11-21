Configuration
====================

To change the configuration, go to workspace settings (`Ctrl+Shift+P -> Open Workspace Settings`), there go to `Extensions -> Crossover QA Maintenance Extension`.


Setttings list:
----------------
Currently the plugin requries 4 parameters: jenkins url, jenkins credentials and local db address.


Introducing a new property
==========================
1. In package.json go to contributes->configuration->properties and add a property with description. Use common prefix "xoQAMaintCIJobAnalyzer.".
2. Go to configuration.ts and add logic for reading the property