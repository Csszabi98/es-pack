import { OutputFile } from 'esbuild';
import fs from 'fs';

export const unlinkOld = (staleFiles: OutputFile[]): void =>
    staleFiles.forEach(outFile => {
        if (fs.existsSync(outFile.path)) {
            fs.unlinkSync(outFile.path);
        }
    });
