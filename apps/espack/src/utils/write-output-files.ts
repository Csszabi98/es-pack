import path from 'path';
import fs from 'fs';
import { IEspackBuildResult } from '../model';

export const writeOutputFiles = ({ esbuildBuildResult }: IEspackBuildResult): void =>
    esbuildBuildResult.outputFiles?.forEach(outFile => {
        const dir: string = path.dirname(outFile.path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outFile.path, outFile.contents);
    });
