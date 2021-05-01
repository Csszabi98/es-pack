<p align="center">
  <img src="https://user-images.githubusercontent.com/38193720/116794320-7b15ab00-aacc-11eb-8b4f-71aafd37b5eb.png" 
    alt="espack: A build tool running on esbuild">
  <br>
  <a href="https://github.com/Csszabi98/es-pack/tree/main/apps/espack">espack</a>
</p>

# @es-pack/copy-plugin
### A plugin for espack to copy files

## Installation

### pnpm
`pnpm add -D esbuild @es-pack/espack @es-pack/copy-plugin`
### yarn
`yarn add -D esbuild @es-pack/espack @es-pack/copy-plugin`
### npm
`npm install -D esbuild @es-pack/espack @es-pack/copy-plugin`

## How to use it?
This plugin can be used under the plugins section of espack builds, like the following:

```javascript
export default {
    builds: [
        {
            plugins: [
                new EspackCopyPlugin({
                    basedir: './webassets',
                    assets: [
                        'favicon.ico',
                        'manifest.json',
                        'robots.txt'
                    ]
                }),
                new EspackCopyPlugin({
                    basedir: './public',
                    assets: [
                        '404.html'
                    ]
                }),
            ],
            scripts: [
                {
                    src: './src/index.ts'
                }
            ]
        }
    ]
};
```
The plugin can be reused any number of times.

## Options

- **basedir**: The root dir to copy assets from. Defaults to the current working directory of espack.
- **assets**: Array of assets (string paths) to copy, relative to the basedir. This entry is required.
- **outdir**: Directory to output the copied assets into relative to espack's baseDir. Defaults to 
"assets".

## Watch mode

- Watch mode is implemented for the modification of asset content.
- When renaming any of the assets this plugin will force stop espack, notifying you to update
the assets in the plugin options, to avoid future errors related to stale configuration state.
