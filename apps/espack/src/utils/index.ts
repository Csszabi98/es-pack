/*
    Export commonly usable utility logic to other packages.

    As this logic is core to espack, the only options for sharing
    would be to create a package for it and not bundle it
    with espack to avoid the cycling dependencies
    (which would defeat the purpose of this repo).
 */
export * from './asset/check-assets-exist';
export * from './file/is-file';
