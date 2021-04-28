# espack: A nice api around esbuild

# DISCLAIMER:
This package is under development, it will try to evolve with esbuild itself as 
it is also under work. As the additional features this package provides are written
in javascript, this package will not be as fast as executing esbuild by itself, but
it provides a ton of features, and since every js related process is done via esbuild
the performance hits should be irrelevant in the long run.

## Main features:
- expose all of esbuild's features while building on some of them
- easy configuration via a single config file for any number of builds
- typescript configuration file support
- written in 100% typescript
- easy to hook into plugin api

## Future goals:
- Raising the test coverage

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
            import { DefaultBuildProfiles, ImportFormat, Platforms, createBuildProfiles } from '@espack/espack';
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
            import { ImportFormat, Platforms, createBuildProfiles } from '@espack/espack';
          
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
import { createBuildProfiles, ImportFormat, Platforms } from '@espack/espack';

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
import { createBuildProfiles, IBuilds, ImportFormat, Platforms } from '@espack/espack';

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
- for espack configs on common templates like web development see [templates](../../templates)  


## How to define espack plugins?

- Every espack plugin must extend the EspackPlugin base class
- You can choose which lifecycles of the build process you want to
hook into with your plugin by providing the enabled lifecycles to the
super class's constructor after the name.
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
    - **registerCustomWatcher**: This lifecycle lets you register your custom watcher functions. You need to return
    a cleanup function which frees up your resources if watch is cancelled.
    Context available in this lifecycle: buildsDir, scripts, defaultBuildProfiles, buildReadyScripts, buildResults,
    pluginBuildResult
    - **onCleanup**: This lifecycle is executed along with the espack shutdown process. Free up any resources you want
    here.
    Context available in this lifecycle: buildsDir, scripts, defaultBuildProfiles, buildReadyScripts, buildResults,
    pluginBuildResult
- Example plugin to console.log every output file's path:
```javascript
class EspackReportPlugin extends EspackPlugin {
    constructor() {
        const enabledLifecycles = [ BuildLifecycles.AFTER_BUILD ];
        super('@espack/report-plugin', enabledLifecycles);
    }

    afterBuild(context) {
        const { buildResults } = context;
        buildResults.forEach(
            ({ buildResult }) =>
                buildResult.outputFiles && console.log(buildResult.outputFiles.map(outputFile => outputFile.path))
        );
    }
}

```

## Webstorm

When using webstorm the "Backup files before saving" (previously "Safe Write") can interfere
with the watch mode, so it is recommended to disable this option.
