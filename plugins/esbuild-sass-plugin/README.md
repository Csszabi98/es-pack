![espack](./assets/espack.png)

# @es-pack/esbuild-sass-plugin
### A sass plugin for esbuild written in typescript.

## Installation with esbuild

### pnpm
`pnpm add -D esbuild @es-pack/html-plugin`
### yarn
`yarn add -D esbuild @es-pack/html-plugin`
### npm
`npm install -D esbuild @es-pack/html-plugin`

## Installation with espack

### pnpm
`pnpm add -D esbuild @es-pack/espack @es-pack/html-plugin`
### yarn
`yarn add -D esbuild @es-pack/espack @es-pack/html-plugin`
### npm
`npm install -D esbuild @es-pack/espack @es-pack/html-plugin`

## How to use it?

- With esbuild, add it to the plugins array like the following: 
```javascript
import { sassPlugin } from '@es-pack/esbuild-sass-plugin';

const plugins = [sassPluin()];
// ...
```
- With espack add it the build options plugins array like the following:
```javascript
import { createBuildProfiles } from '@es-pack/espack';
import { sassPlugin } from '@es-pack/esbuild-sass-plugin';

export default {
    defaultBuildProfiles: createBuildProfiles(
        {
            platform: Platforms.BROWSER,
            format: ImportFormat.IIFE,
            plugins: [
                sassPlugin()
            ]
        },
    ),
    builds: [
        {
            scripts: [
                {
                    src: './src/index.js'
                }
            ]
        }
    ]
};
```
