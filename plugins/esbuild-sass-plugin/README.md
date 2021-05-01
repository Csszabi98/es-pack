![espack](./assets/espack.png)

# @espack/esbuild-sass-plugin
### A sass plugin for esbuild written in typescript.

## Installation with esbuild

### pnpm
`pnpm add -D esbuild @espack/html-plugin`
### yarn
`yarn add -D esbuild @espack/html-plugin`
### npm
`npm install -D esbuild @espack/html-plugin`

## Installation with espack

### pnpm
`pnpm add -D esbuild @espack/espack @espack/html-plugin`
### yarn
`yarn add -D esbuild @espack/espack @espack/html-plugin`
### npm
`npm install -D esbuild @espack/espack @espack/html-plugin`

## How to use it?

- With esbuild, add it to the plugins array like the following: 
```javascript
import { sassPlugin } from '@espack/esbuild-sass-plugin';

const plugins = [sassPluin()];
// ...
```
- With espack add it the build options plugins array like the following:
```javascript
import { createBuildProfiles } from '@espack/espack';
import { sassPlugin } from '@espack/esbuild-sass-plugin';

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
