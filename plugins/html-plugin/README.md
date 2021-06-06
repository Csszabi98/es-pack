### A plugin to inject stylesheets and scripts into a html file

<p align="center">
  <img src="https://user-images.githubusercontent.com/38193720/116794320-7b15ab00-aacc-11eb-8b4f-71aafd37b5eb.png" 
    alt="espack: A build tool running on esbuild">
  <br>
  <a href="https://github.com/Csszabi98/es-pack/tree/main/apps/espack">espack</a>
</p>

# @es-pack/html-plugin

## Installation

### pnpm
`pnpm add -D esbuild @es-pack/espack @es-pack/html-plugin`
### yarn
`yarn add -D esbuild @es-pack/espack @es-pack/html-plugin`
### npm
`npm install -D esbuild @es-pack/espack @es-pack/html-plugin`

## How to use it?
This plugin can be used under the plugins section of espack builds, like the following:

```javascript
export default {
    builds: [
        {
            plugins: [
                espackHtmlPluginFactory({
                    inputFile: './public/index.html',
                    outputFile: './dist/index.html',
                    minify: process.env.NODE_ENV === 'production',
                })
            ],
            scripts: [
                './src/index.ts'
            ]
        }
    ]
};
```
- The plugin can be reused any number of times.
- The results of the index.ts build will be injected into the resulting dist/index.html file with their
respective script and link tags. 
- When the target format of the script build is **esm**, the resulting script tags will receive the **type="module"** 
attribute.

## Options

- **outputFile**: The path to output the resulting html file into relative to the buildsDir of espack. Defaults to index.html.
(so when omitted the resulting file will be under ./dist/index.html)
- **injectionSeparator**: The separator character(s) between the injected script and link tags. Defaults to an empty string
in production mode and to a new line character in development.
- **injectionPrefix**: The character(s) to put before each injected script and link tags. This is mainly used to maintain
proper indentation in the resulting html. Defaults to empty string in production mode and to 4 spaces in development. 
- **define**: A record object defining variables to be made available inside the result html file, achieving a certain level of
templating. These variables can be accessed inside the html input file by putting them between % characters like so:
%PUBLIC_URL%. Every occurrence will be replaced.
    - PUBLIC_URL is defined by default with a default value referencing the @es-pack/copy-plugin's default output path: 'assets',
      inside the buildDir of espack.
    - Example:
    ```json5
    {  
        "define": {
            "PUBLIC_URL": "ui/assets", // Override the default PUBLIC_URL template variable.
            "VERSION": "0.0.1" // Read the version from the package.json version tag prior to definition
        }
    }
    ```
- **inputFile**: Path to the input html template to be used relative to espack's current working directory. If omitted
the plugin assumes a basic html template to be used as input.
- **inject**: Array of paths of input scripts to be injected into the resulting html file. This basically enables the injection
for certain scripts if defined. When not present, the plugin will inject every script result under the scripts tag into the html
if the platform is 'browser', otherwise it will not inject anything by default. These values can be supplied in two formats:
using their basename like "index.js", or their full path within the baseDir of espack output like the following: "./ui/index.js".
The hash of the output files is ignored when comparing if the **hashSeparator** option is specified.
- **injectStyle**: The same behavior is true to this entry as described above, just for css stylesheets.
- **minify**: Enables minification of the resulting html file. The supplied value can be a simple boolean like true or false or 
an object of **html-minifier** options to describe the exact minification process. If provided value is true, the following options
will be used: removeComments, collapseWhitespace. For the available options see the 
[html-minifier](https://github.com/kangax/html-minifier#options-quick-reference) documentation.
- **hashSeparator**: Fine-tunes the hash ignoring mechanism of the above two options. Use your output file's template separator here.
For example if the output file name pattern is the following: "[dir]/[name]-[hash]" then the value of "-" should be used.
- **injectHtml**: An object describing html to inject into the resulting html file at certain entry points. This for example
enables conditional inclusion of cdn scripts (i.e.: react, react-dom) depending on the build profile.
    - Structure:
    ```json5
    {
        "afterHeadStart": "", // Injects the html string after the <head> element.
        "beforeHeadEnd": "", // Injects the html string before the </head> element.
        "afterBodyStart": "", // Injects the html string after the <body> element.
        "beforeBodyEnd": "" // Injects the html string before the </body> element.
    }
    ```
    - All options are optional, so you can use only the ones that you require.
    - After the html strings are injected it is not checked if the result html is still valid,
    so be careful with what you inject and where.


## Watch mode

- Watch mode is implemented for the modification of asset content.
- When renaming any of the assets this plugin will force stop espack, notifying you to update
  the assets in the plugin options, to avoid future errors related to stale configuration state.
