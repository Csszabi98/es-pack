const entryPointRegex = new RegExp('.*[^.]+.(tsx?|jsx?)$');

export const isEntryPoint = (entryPointCandidate: string): boolean => entryPointRegex.test(entryPointCandidate);
