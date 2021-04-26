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
            - for defining your own espack plugins see the How to define espack plugins? section //TODO
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
## Webstorm

When using webstorm the "Backup files before saving" (previously "Safe Write") can interfere
with the watch mode, so it is recommended to disable this option.
