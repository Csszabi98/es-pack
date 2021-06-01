## A build tool running on [esbuild](https://github.com/evanw/esbuild)

<p align="center">
  <img src="https://user-images.githubusercontent.com/38193720/116794320-7b15ab00-aacc-11eb-8b4f-71aafd37b5eb.png" 
    alt="espack: A build tool running on esbuild">
  <br>
  <a href="https://github.com/Csszabi98/es-pack/tree/main/plugins">Plugins</a>
</p>

# espack

Espack on its own is just a nice wrapper api around esbuild, with an easy single file configuration for
any number of builds.

However once you start using espack plugins it shows its true power!

With pre-written plugins such as [EspackHtmlPlugin](https://github.com/Csszabi98/es-pack/tree/main/plugins/html-plugin) and 
[EspackCopyPlugin](https://github.com/Csszabi98/es-pack/tree/main/plugins/html-plugin/copy-plugin) it's super easy to throw together a 
production ready web development setup in no time! (see [templates](https://github.com/Csszabi98/es-pack/tree/main/templates))

## Installation

### pnpm
`pnpm add -D esbuild @es-pack/espack`
### yarn
`yarn add -D esbuild @es-pack/espack`
### npm
`npm install -D esbuild @es-pack/espack`

## Main features:
- easy configuration with a single typescript or javascript file
- execute any number of builds simultaneously
- written in 100% typescript
- easy to hook into plugin api
- exposing all of esbuild's features while building on them

## Future goals:
- Raising the test coverage
- Creating documentation website
- Writing more plugins
- Warn about possible overwrite of output files when it might happen. 
    - Explanation:
        - Currently, you need to make sure yourself that your output scripts are not overwriting each other.
        As this is a really rare case and easy to diagnose, but can be complicated to implement, it has been
        delayed to future releases.

## Running espack:
You can use either npx or pnpx (or anything capable of running bin scripts) to run the pre included espack
binary.
```shell
npx espack
```

## CLI options:
- **profile**: The current build profile. There are two pre included build profiles: development/production. 
Defaults to production.
```shell
pnpx espack --profile production
```
- **config**: The path to the config to use. Defaults to espack.config.ts/espack.config.js if not present.
The priority order is as follows for config resolution: custom config > espack.config.ts > espack.config.js
```shell
pnpx espack --config ./configs/espack-node.config.ts
```
- **watch**: Triggers watch mode for builds. If this flag is provided espack will not terminate on its own after
the builds have completed. It will stay active and watch for code changes (plugins also implement their own watch).
```shell
pnpx espack --watch
```
- The above defined CLI options can all be used together in any order.

## Configuration options:
- **buildsDir**: Output base directory of espack (defaults to dist)
- **defaultBuildProfiles**: This entry allows you to describe any custom build profile to be used by 
esbuild, and also an option to override the default build profile options for every build.
    - **Defining your own build profiles**:
        ```json5
        {
            defaultBuildProfiles: {
                "my-custom-build-profile": {
                    //Options come inside here
                }
            }
        }
    - **Overriding default build profile options**:
        ```json5
        {
            defaultBuildProfiles: {
                development: {
                    minify: true // Minify by default when using the development profile
                }
            }
        }
        ```
    - Overriding these options can get tedious and verbose, so espack provides a helper
    function to make this process easier and more readable: 
        ```javascript
        createBuildProfiles(commonOptions, profileOverrides, disableDefaultProfileExtension)
        ```
        - **commonOptions**: Object defining esbuild options to spread into either the default profiles
        - **profileOverrides**: Record whose properties either define profile names or override
          the default ones (development, production)
        - **disableDefaultProfileExtension**: Boolean, if true the profileOverrides will be used for profile creation rather than
          for overriding the default espack profile options.
        - Examples:
            - Overriding default options:
            ```javascript
            import { DefaultBuildProfiles, ImportFormat, Platforms, createBuildProfiles } from '@es-pack/espack';
            import { dependencies } from './package.json';
          
            const buildProfiles = createBuildProfiles(
                {
                    platform: Platforms.NODE, // Set platfrom to node
                    format: ImportFormat.COMMON_JS, // Set the import format to commonjs
                    external: Object.keys(dependencies) // Mark all packages under the dependencies external
                }, // These options are spread into both development and production profiles
                {
                    [DefaultBuildProfiles.PROD]: {
                        minify: false // Disable minification for just the production profile
                    }
                }
            );
            ```
            - Define your own profiles:
            ```javascript
            import { ImportFormat, Platforms, createBuildProfiles } from '@es-pack/espack';
          
            const buildProfiles = createBuildProfiles(
                {
                    platform: Platforms.NODE,
                    format: ImportFormat.COMMON_JS,
                    minify: false
                },
                {
                    'my-own-profile': {},
                    'my-second-profile': {}
                }, // Espack will spread the above defined common options into both of these profiles
                true // Flags espack to not override the default build profiles
            );
            ```
    - While defining your own profiles you don't have to fine tune every single option esbuild provides,
    you just have to define the ones you care about and any missing option will be filled up with the espack
    production profile options by default.
- **Build profile options**:
    - These options are being passed directly into esbuild by espack
    - Any esbuild option can be used from the build api except for the following:
        - watch, entryPoints, write, outfile, stdin
        - These options have been disabled because espack sets them by itself automatically, or
        they would interfere with the way espack works.
    - For all the possible options see [esbuild](https://esbuild.github.io/api/#build-api)
- **builds**:
    - An array of builds to be executed
    - A build is an object of the following structure:
        - buildProfiles
            - same functionalities as defaultBuildProfiles
            - provides override of buildProfile options a per-build basis
        - plugins:
            - An array of espack plugins to be used by all the builds
            - espack plugins extend on the features of espack
            - for example using the following plugin:
            ```javascript
            plugins: [
                new EspackHtmlPlugin()
            ]
            ```
            - will result in injecting all your generated files let them be javascript or css into a html
            template and generate the output file under dist/index.html
            - **espack plugins work on a per build bases rather than a per script one!**
            - This is really important as any functionality which would require a per script execution
            should be written as an esbuild plugin rather than an espack plugin and used accordingly.
            - esbuild plugins go under the buildProfile option definitions and any of them can be hooked up
            just like with using esbuild by itself.
            - for defining your own espack plugins see the How to define espack plugins? section
            - for defining esbuild plugins see [esbuild](https://esbuild.github.io/plugins/)
        - scripts
            - A collection of entry points of the build
            - Object of the following structure:
            ```json5
            {
                src: "./src/index.ts", // Entry point of the build
                buildProfiles: { // Optional build profile overrides on a per entry point basis
                    //...
                }
            }
            ```
## Example espack configs
- javascript: 
```javascript
import { createBuildProfiles, ImportFormat, Platforms } from '@es-pack/espack';

export default {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS
        },
        { production: { minify: false } }
    ),
    builds: [
        {
            scripts: [
                {
                    src: './src/index.ts'
                }
            ]
        }
    ]
};
```
- typescript:
```typescript
import { createBuildProfiles, IBuilds, ImportFormat, Platforms } from '@es-pack/espack';

const builds: IBuilds = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS
        },
        { production: { minify: false } }
    ),
    builds: [
        {
            scripts: [
                {
                    src: './src/index.ts'
                }
            ]
        }
    ]
};

export default builds;
```
- Using cjs:
```javascript
const { createBuildProfiles, IBuilds, ImportFormat, Platforms } = require('@es-pack/espack');

exports.default = {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.NODE,
            format: ImportFormat.COMMON_JS
        },
        { production: { minify: false } }
    ),
    builds: [
        {
            scripts: [
                {
                    src: './src/index.ts'
                }
            ]
        }
    ]
};
```
- for espack configs on common templates like web development see [templates](https://github.com/Csszabi98/es-pack/tree/main/templates)  


## How to define espack plugins?

- Every espack plugin must be an object with name property (string)
- You can choose which lifecycles of the build process you want to
hook into with your plugin by providing the enabled lifecycles to the
object as properties.
- Espack currently lets you hook into the following lifecycles of the build process:
    - **beforeResourceCheck**: Executed by esbuild before checking for build resource 
      accessibility. Context available in this lifecycle: buildsDir, scripts, defaultBuildProfiles
    - **onResourceCheck**: Executed parallel to espack's own resource checking mechanisms.
      You can check for any required resources by your plugin, espack will wait for every plugin
      to complete before proceeding onward. Context available in this lifecycle: buildsDir, scripts, defaultBuildProfiles
    - **afterResourceCheck**: Executed after the resource check process has been done. You can do 
      any additional modifications you wish to make to the context before the scripts are processed in the next cycle.
      Context available in this lifecycle: buildsDir, scripts, defaultBuildProfiles
    - **beforeBuild**: Executed right before the build process begins with esbuild. The input scripts and build 
      profiles have been processed by this point, into a digestible format by esbuild.
      Context available in this lifecycle: buildsDir, scripts, defaultBuildProfiles, buildReadyScripts
        - buildReadyScripts structure:
        ```json5
        {
            "src": "./entry-point.js",
            "buildProfile": {
                // esbuild build options...
            }
        }  
        ```
    - **onBuild**: The buildReadyScripts are grouped together based on their build options, if possible. Espack runs
      esbuild on these grouped options with the previously determined options. You can define your own
      resource heavy build operation here, which will be executed parallel to the esbuild build. The result of your 
      build operation will be passed into your plugin in the next lifecycle, so there is no need for you to save it's 
      result.
      Context available in this lifecycle: buildsDir, scripts, defaultBuildProfiles, buildReadyScripts
    - **afterBuild**: This lifecycle is run after esbuild has finished, or in watch mode after every rebuild. The results
      of esbuild and plugin build (only esbuild result in watch mode) are passed onto the plugin. Espack will write the
      results of esbuild after this lifecycle to the disk, so you can modify the esbuild results if you want to, though
      this is generally not recommended! (such operations should be done through esbuild plugins!)
      Context available in this lifecycle: buildsDir, scripts, defaultBuildProfiles, buildReadyScripts, buildResults, 
      pluginBuildResult (if any, also generic)
        - **buildResults** structure:
        ```json5
        {
            "buildId": "build_0", // Unique identifier of this build
            "build": {
                "buildProfile": {
                    // esbuild options
                },
                "builds": [ // Array of entry points for the build
                    {
                        "src": './index.js'
                    }
                ]
            },
            "buildResult": { // The actual esbuild result, straight from esbuild itself
                "warnings": [
                    {
                        text: "",
                        location: {
                            file: "",
                            namespace: "",
                            line: 1, // 1-based
                            column: 0, // 0-based, in bytes
                            length: 0, // in bytes
                            lineText: "",
                            suggestion: ""
                        },
                        notes: [
                            {
                                "text": "",
                                "location": {} // same as above
                            }
                        ],
                        // Optional user-specified data that is passed through unmodified. You can
                        // use this to stash the original error, for example.
                        detail: {} // any
                    }
                ], // Array of warnings
                "outputFiles": [
                    {
                        "path": "", // Output path
                        "contents": "",// Build result as bytes
                        "text": "" // Build result as string
                    }
                ], // Only when "write: false"
                "rebuild": {}, // function to trigger a rebuild
                "stop": {}, // function to stop esbuild watch
                "metafile": {} // Only when "metafile: true", see esbuild for detailed structure
            }
        }
        ```
        - most of this structure has been copied over from esbuild, so this is subject to change, for
        the latest structure see the esbuild documentation.
    - **afterWrite**: This lifecycle is run after espack has finished writing the build results to the disk, 
      or in watch mode on every rebuild after writing to the disk. 
      Context available in this lifecycle: The results of esbuild and plugin build (only esbuild result in watch mode)
      are passed onto the plugin.
    - **registerCustomWatcher**: This lifecycle lets you register your custom watcher functions. You need to return
    a cleanup function which frees up your resources if watch is cancelled.
    Context available in this lifecycle: buildsDir, scripts, defaultBuildProfiles, buildReadyScripts, buildResults,
    pluginBuildResult
    - **onCleanup**: This lifecycle is executed along with the espack shutdown process. Free up any resources you want
    here.
    Context available in this lifecycle: buildsDir, scripts, defaultBuildProfiles, buildReadyScripts, buildResults,
    pluginBuildResult
- When any lifecycle is provided on the plugin object as a property the plugin execution for that lifecycle
will be automatically enabled. So if you don't want your plugin to run on certain lifecycles simply don't provide a method
for them.
- Example plugin to console.log every output file's path:
```javascript
const espackReportPluginFactory = () => {
    const afterBuild = (context) => {
        const { buildResults } = context;
        buildResults.forEach(
            ({ buildResult }) =>
                buildResult.outputFiles && console.log(buildResult.outputFiles.map(outputFile => outputFile.path))
        );
    };
    
    return {
        name: '@es-pack/report-plugin',
        afterBuild
    };
}
```

## Webstorm

When using webstorm the "Backup files before saving" (previously "Safe Write") can interfere
with the watch mode, so it is recommended to disable this option.
