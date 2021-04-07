var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};

// lib/index.ts
__markAsModule(exports);
__export(exports, {
  Asset: () => Asset,
  BuildLifecycles: () => BuildLifecycles,
  DefaultBuildProfiles: () => DefaultBuildProfiles,
  EspackPlugin: () => EspackPlugin,
  ImportFormat: () => ImportFormat,
  Platforms: () => Platforms,
  StringToDefaultBuildProfiles: () => StringToDefaultBuildProfiles
});

// lib/build/build.model.ts
var Asset;
(function(Asset2) {
  Asset2["HTML"] = "html";
  Asset2["CSS"] = "css";
  Asset2["JS"] = "js";
  Asset2["JSX"] = "jsx";
  Asset2["TS"] = "ts";
  Asset2["TSX"] = "tsx";
  Asset2["PNG"] = "png";
  Asset2["ICO"] = "ico";
  Asset2["MANIFEST"] = "webmanifest";
})(Asset || (Asset = {}));
var Platforms;
(function(Platforms2) {
  Platforms2["NODE"] = "node";
  Platforms2["BROWSER"] = "browser";
  Platforms2["NEUTRAL"] = "neutral";
})(Platforms || (Platforms = {}));
var ImportFormat;
(function(ImportFormat2) {
  ImportFormat2["IIFE"] = "iife";
  ImportFormat2["COMMON_JS"] = "cjs";
  ImportFormat2["ESM"] = "esm";
})(ImportFormat || (ImportFormat = {}));
var DefaultBuildProfiles;
(function(DefaultBuildProfiles2) {
  DefaultBuildProfiles2["DEV"] = "development";
  DefaultBuildProfiles2["PROD"] = "production";
})(DefaultBuildProfiles || (DefaultBuildProfiles = {}));
var StringToDefaultBuildProfiles = {
  [DefaultBuildProfiles.DEV]: DefaultBuildProfiles.DEV,
  [DefaultBuildProfiles.PROD]: DefaultBuildProfiles.PROD
};

// lib/build/build.plugin.ts
var BuildLifecycles;
(function(BuildLifecycles2) {
  BuildLifecycles2["BEFORE_RESOURCE_CHECK"] = "beforeResourceCheck";
  BuildLifecycles2["RESOURCE_CHECK"] = "onResourceCheck";
  BuildLifecycles2["AFTER_RESOURCE_CHECK"] = "afterResourceCheck";
  BuildLifecycles2["BEFORE_BUILD"] = "beforeBuild";
  BuildLifecycles2["BUILD"] = "onBuild";
  BuildLifecycles2["AFTER_BUILD"] = "afterBuild";
  BuildLifecycles2["WATCH"] = "onWatch";
  BuildLifecycles2["CLEANUP"] = "onCleanup";
})(BuildLifecycles || (BuildLifecycles = {}));
var EspackPlugin = class {
  constructor(name, hookInto) {
    this.name = name;
    this.hookInto = hookInto;
    console.log(`Using plugin ${this.name}`);
    this.errorPrefix = `[Plugin ${this.name} error]:`;
  }
  notImplementedErrorFactory(lifecycle) {
    return new Error(`${this.errorPrefix} ${lifecycle} is not implemented!`);
  }
  hookEnabled(lifecycle) {
    return this.hookInto.includes(lifecycle);
  }
  beforeResourceCheck(context) {
    throw this.notImplementedErrorFactory(BuildLifecycles.BEFORE_RESOURCE_CHECK);
  }
  onResourceCheck(context) {
    throw this.notImplementedErrorFactory(BuildLifecycles.RESOURCE_CHECK);
  }
  afterResourceCheck(context) {
    throw this.notImplementedErrorFactory(BuildLifecycles.AFTER_RESOURCE_CHECK);
  }
  beforeBuild(context) {
    throw this.notImplementedErrorFactory(BuildLifecycles.BEFORE_BUILD);
  }
  onBuild(context) {
    throw this.notImplementedErrorFactory(BuildLifecycles.BUILD);
  }
  afterBuild(context) {
    throw this.notImplementedErrorFactory(BuildLifecycles.AFTER_BUILD);
  }
  onWatch(context) {
    throw this.notImplementedErrorFactory(BuildLifecycles.WATCH);
  }
  onCleanup(context) {
    throw this.notImplementedErrorFactory(BuildLifecycles.CLEANUP);
  }
  getName() {
    return this.name;
  }
};
