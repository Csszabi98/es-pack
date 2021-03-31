# espack: A nice api around esbuild

# DISCLAIMER:
This package is under development, it will try to evolve with esbuild itself as 
it is also under work. As the additional features this package provides are written
in javascript, this package will not be as fast as executing esbuild by itself, but
it provides a ton of features, and since every js related process is done via esbuild
the performance hits should be irrelevant in the long run.

## Main features:
- Client build (react) with bundling and script/style injection into html
- Standard build for any other script
- Easily configurable
- Sass support

## Future goals:
- 0 setup just provide the entry point(s)
- Well tested
- Typescript configuration (remove json config)
- custom esbuild plugin collection for common usecases (in this repo with rush)
- configurable plugins
- expose everything that esbuild provides
- build hashes
- make sass optional (pluginify)
- add configuration guide
- build an SPA documentation site for this package using the package itself as a build tool

## This project will not aim to do the following
- Transpile to ES5 unless esbuild will directly support it in the future

## Peer dependencies:

As currently there is no way to bundle the html-minifier and sass dependencies these have
to be provided as peer dependencies to the product.

## How does it work?

Take a look at the build.json file and src/build.constants.ts for the json schema.
Further explanation will not be written here, as json configuration will be replaced with
typescript/javascript configuration files in the future.

The product will naturally look for a build.json in the root of the project, and builds
the target scripts.
