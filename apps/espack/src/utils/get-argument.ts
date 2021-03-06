export const getArgument = (arg: string): string => {
    const argumentIndex: number = process.argv.findIndex(argv => argv === `--${arg}`);
    if (argumentIndex === -1 || argumentIndex === process.argv.length - 1 || process.argv.length === 1) {
        return '';
    }

    const argumentValue: string = process.argv[argumentIndex + 1];
    if (argumentValue.startsWith('--')) {
        return '';
    }
    return argumentValue;
};
