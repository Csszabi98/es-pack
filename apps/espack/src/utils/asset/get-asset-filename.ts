export const getAssetFileName = (asset: string): string => {
    const parts: string[] = asset.split(/[\\/]/);
    return parts[parts.length - 1];
};
