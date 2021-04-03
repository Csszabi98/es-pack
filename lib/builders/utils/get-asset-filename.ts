export const getAssetFileName = (asset: string): string => {
    const parts = asset.split(/[\\/]/);
    return parts[parts.length - 1];
};
