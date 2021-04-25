# Espack jest config

###To use the common shared settings follow these steps:
1. Add the following to the package.json file (keep this in sync with the package's package.json!):
```json
{
  "devDependencies": {
    "@espack/jest-config": "workspace:*",
    "@types/jest": "26.0.22",
    "esbuild": "0.11.11",
    "esbuild-jest": "0.5.0",
    "jest": "26.6.3" 
  },
  "scrips": {
    "test": "jest --coverage --watch --collectCoverageOnlyFrom",
    "test:ci": "jest --all --coverage"
  }
}
```
2. Create a jest.config.ts file with the following content:
```typescript
import { nodeConfig } from '@espack/jest-config/src/node-config';

export default nodeConfig;
```

