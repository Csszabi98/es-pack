# Change Log - @es-pack/espack

This log was last generated on Mon, 06 Dec 2021 23:38:15 GMT and should not be manually modified.

## 3.0.1
Mon, 06 Dec 2021 23:38:15 GMT

### Patches

- Enable define parameters to be of other types than string literals

## 3.0.0
Wed, 27 Oct 2021 21:57:58 GMT

### Breaking changes

- Update esbuild version to 0.13.X, patch vm2 vulnerability with vm2 version 3.9.5
- Renamed certain interfaces: IBuilds -> IEspackBuilds, IBuild -> IEspackBuild, IEspackBuilds now have the esbuild build result under the esbuildBuildResult property rather than the buildResult. Exposed the builder function to be able to run espack programmatically.

### Minor changes

- Scripts in the configs now can be provided as simple string entries if no build profiles is defined by their side.

## 2.1.0
Thu, 03 Jun 2021 21:17:58 GMT

### Minor changes

- Changed outdir to not include the buildsDir, added buildProfiles, and current buildProfile to the BasePluginContext, fixed plugin contexts not being properly passed to the plugins issue.

## 2.0.0
Tue, 01 Jun 2021 22:48:46 GMT

### Breaking changes

- Rewritten using the new classless plugin api. Added the afterWrite lifecycle.

## 1.0.2
Sat, 15 May 2021 13:58:17 GMT

### Patches

- Add .npmignore, to only publish necessary files to npm

