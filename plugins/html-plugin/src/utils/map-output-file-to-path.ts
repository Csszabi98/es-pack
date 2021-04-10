import { OutputFile } from 'esbuild';

export const mapOutputFileToPath = (file: OutputFile): string => file.path;
