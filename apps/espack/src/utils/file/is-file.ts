export enum FileExtensions {
    JAVASCRIPT = 'js',
    TYPESCRIPT = 'ts',
    JSX = 'jsx',
    TSX = 'tsx',
    CSS = 'css'
}

export const isFile = (fileName: string, ...allowedExtensions: FileExtensions[]): boolean =>
    allowedExtensions.length ? new RegExp(`.*[^.]+.(${allowedExtensions.join('|')})$`).test(fileName) : false;
