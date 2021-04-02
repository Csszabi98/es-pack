import esbuild from 'esbuild';
import { sassPlugin } from '../plugins/sass.plugin';

export const mapEnvironmentVariables = (environmentVariables: Record<string, string>) =>
	Object.entries(environmentVariables).reduce(
		(acc, [key, value]) => ({
			//TODO: Warning | Error for duplicate keys
			...acc,
			[`process.env.${key}`]: `"${value}"`,
		}),
		{}
	);

export const defaultBuildOptionsFactory = (watch: boolean): esbuild.BuildOptions => ({
	watch,
	target: ['chrome58', 'firefox57', 'safari11', 'edge16', 'node10'],
	outdir: 'dist',
	loader: {
		'.ts': 'ts',
		'.tsx': 'tsx',
		'.js': 'js',
		'.css': 'css',
	},
	plugins: [sassPlugin()],
});
