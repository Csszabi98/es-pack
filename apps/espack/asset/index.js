var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = target => __defProp(target, '__esModule', { value: true });
var __export = (target, all) => {
    for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __exportStar = (target, module2, desc) => {
    if ((module2 && typeof module2 === 'object') || typeof module2 === 'function') {
        for (let key of __getOwnPropNames(module2))
            if (!__hasOwnProp.call(target, key) && key !== 'default')
                __defProp(target, key, {
                    get: () => module2[key],
                    enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable
                });
    }
    return target;
};
var __toModule = module2 => {
    if (module2 && module2.__esModule) return module2;
    return __exportStar(
        __markAsModule(
            __defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, 'default', {
                value: module2,
                enumerable: true
            })
        ),
        module2
    );
};

// src/utils/index.ts
__markAsModule(exports);
__export(exports, {
    FileExtensions: () => FileExtensions,
    NonExistentAssetsError: () => NonExistentAssetsError,
    checkAssetsExist: () => checkAssetsExist,
    checkAssetsExistSync: () => checkAssetsExistSync,
    getAssetFileName: () => getAssetFileName,
    isFile: () => isFile
});

// src/utils/asset/check-assets-exist.ts
var import_fs = __toModule(require('fs'));
var defaultErrorMessage = 'Could not find the following assets, check if all the assets you provided do exist!';
var defaultNonExistentAssetsAnnouncementMessage = 'The following assets are non existent:';
var NonExistentAssetsError = new Error('There are some assets which does not exist!');
var checkAssetsExistSync = (
    assets,
    errorMessage = defaultErrorMessage,
    nonExistentAssetsAnnouncementMessage = defaultNonExistentAssetsAnnouncementMessage
) => {
    const nonExistentAssets = assets == null ? void 0 : assets.filter(asset => !import_fs.default.existsSync(asset));
    if (nonExistentAssets == null ? void 0 : nonExistentAssets.length) {
        console.error(errorMessage);
        console.error(nonExistentAssetsAnnouncementMessage);
        nonExistentAssets.forEach(console.error);
        throw NonExistentAssetsError;
    }
};
var checkAssetsExist = (assets, errorMessage, nonExistentAssetsAnnouncementMessage) =>
    new Promise((resolve, reject) => {
        try {
            checkAssetsExistSync(assets, errorMessage, nonExistentAssetsAnnouncementMessage);
            resolve(void 0);
        } catch (e) {
            reject(e);
        }
    });

// src/utils/asset/get-asset-filename.ts
var getAssetFileName = asset => {
    const parts = asset.split(/[\\/]/);
    return parts[parts.length - 1];
};

// src/utils/file/is-file.ts
var FileExtensions;
(function (FileExtensions2) {
    FileExtensions2['JAVASCRIPT'] = 'js';
    FileExtensions2['TYPESCRIPT'] = 'ts';
    FileExtensions2['JSX'] = 'jsx';
    FileExtensions2['TSX'] = 'tsx';
})(FileExtensions || (FileExtensions = {}));
var isFile = (fileName, ...allowedExtensions) =>
    allowedExtensions.length ? new RegExp(`.*[^.]+.(${allowedExtensions.join('|')})$`).test(fileName) : false;
