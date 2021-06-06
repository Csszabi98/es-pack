import path from 'path';
import fs from 'fs';
import { BuildResult } from 'esbuild';

export const writeOutputFiles = ({ outputFiles }: BuildResult): void =>
    outputFiles?.forEach(outFile => {
        const dir: string = path.dirname(outFile.path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outFile.path, outFile.contents);
    });
