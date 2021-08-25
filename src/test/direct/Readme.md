# Direct Tests

These tests are called locally via the typescript command, they are use to try out more complex stuff

Use the default build task, the transpiled files are in `out/src/test/direct/*`

Or, if this doesnt work, the following task: 

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

Use the command `node out/src/test/direct/replace-variables-in-string.js`

Debugging via sourcemaps not supported yet. 