import { FileExtensions, isFile } from './file/is-file';
import { checkAssetsExist } from './asset/check-assets-exist';
import {
    ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE,
    NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE
} from '../constants/error-message.constants';
import { IEntryAsset } from '../model';

export const checkScripts = (entries: IEntryAsset[]): Promise<void> => {
    const allowedEntryPointExtensions: FileExtensions[] = [
        FileExtensions.JAVASCRIPT,
        FileExtensions.TYPESCRIPT,
        FileExtensions.JSX,
        FileExtensions.TSX
    ];
    const nonEntryPoints: IEntryAsset[] = entries.filter(
        entryPoint => !isFile(typeof entryPoint === 'string' ? entryPoint : entryPoint.src, ...allowedEntryPointExtensions)
    );
    if (nonEntryPoints.length) {
        console.error('Some of your provided entry points have incorrect extensions:');
        nonEntryPoints.forEach(console.log);
        throw new Error('An entry point must have either one of the following file extensions: .js .jsx .ts .tsx');
    }
    return checkAssetsExist(
        entries.map(entry => (typeof entry === 'string' ? entry : entry.src)),
        ENTRY_POINT_NOT_EXISTS_ERROR_MESSAGE,
        NON_EXISTENT_ENTRY_POINTS_ANNOUNCEMENT_MESSAGE
    );
};
