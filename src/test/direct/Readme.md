# Direct Tests

These tests are called locally via the typescript command, they are use to try out more complex stuff

Use the default build task, the transpiled files are in `out/src/test/direct/*`

Or, if this doesnt work, add the following task configuration

```
        {
            "type": "typescript",
            "tsconfig": "tsconfig.json",
            "problemMatcher": [
                "$tsc"
            ],
            "group": "build"
        }

```

Use the command `node out/src/test/direct/replace-variables-in-string.js` (debugging via sourcemaps not supported here) 

Or add the following launch configuration with the name of the test in the program. This will support debugging. 

```
       {
            
            "type": "node",
            "request": "launch",
            "name": "Launch direct tests",
            "program": "${workspaceFolder}/src/test/direct/path-parse-with-date.ts",
            "preLaunchTask": "${defaultBuildTask}",
            "outFiles": [
				"${workspaceFolder}/out/**/*.js"
			],
          }
```
