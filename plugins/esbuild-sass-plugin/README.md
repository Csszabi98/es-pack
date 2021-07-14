### A sass plugin for esbuild written in typescript.

<p align="center">
  <img src="https://user-images.githubusercontent.com/38193720/116794320-7b15ab00-aacc-11eb-8b4f-71aafd37b5eb.png" 
    alt="espack: A build tool running on esbuild">
  <br>
  <a href="https://github.com/Csszabi98/es-pack/tree/main/apps/espack">espack</a>
</p>

# @es-pack/esbuild-sass-plugin

## Installation with esbuild

### pnpm
`pnpm add -D esbuild @es-pack/esbuild-sass-plugin`
### yarn
`yarn add -D esbuild @es-pack/esbuild-sass-plugin`
### npm
`npm install -D esbuild @es-pack/esbuild-sass-plugin`

## Installation with espack

### pnpm
`pnpm add -D esbuild @es-pack/espack @es-pack/esbuild-sass-plugin`
### yarn
`yarn add -D esbuild @es-pack/espack @es-pack/esbuild-sass-plugin`
### npm
`npm install -D esbuild @es-pack/espack @es-pack/esbuild-sass-plugin`

## How to use it?

- With esbuild, add it to the plugins array like the following: 
```javascript
import { sassPlugin } from '@es-pack/esbuild-sass-plugin';

const plugins = [sassPlugin()];
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
                './src/index.js'
            ]
        }
    ]
};
```
