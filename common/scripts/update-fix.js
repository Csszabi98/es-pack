const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'apps', 'espack');
const distDir = path.join(baseDir, 'dist');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

const binFile = path.join(distDir, 'espack.js');

const fixScript =
`#!/usr/bin/env node

// Run pnpm or rush build to build this package, this file was generated as a workaround for the following issue:
// https://github.com/microsoft/rushstack/issues/2400

throw new Error('The espack package has to be built first!');`

if (!fs.existsSync(binFile)) {
    fs.writeFileSync(binFile, fixScript);
}


