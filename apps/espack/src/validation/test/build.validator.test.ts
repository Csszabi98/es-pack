import { buildsSchema } from '../build.validator';

describe('Espack/BuildValidator', () => {
    describe('BuildsSchema', () => {
        it('should not accept unknown properties', () => {
            const testInput = {
                builds: [
                    {
                        scripts: [
                            {
                                src: 'test'
                            }
                        ]
                    }
                ]
            };
            expect(buildsSchema.validate(testInput).error).toBeFalsy();
        });
    });
});
