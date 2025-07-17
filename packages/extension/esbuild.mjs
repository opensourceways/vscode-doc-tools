import esbuild from 'esbuild';
import fs from 'fs';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

function cleanCache() {
  if (fs.existsSync('../../dist/')) {
    fs.rmSync('../../dist/', { recursive: true, force: true, retryDelay: 300 });
  }

  fs.readdirSync('../../').forEach(name => {
    if (name.endsWith('.vsix')) {
      fs.rmSync(`../../${name}`, { force: true, retryDelay: 300 });
    }
  })
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

async function main() {
  cleanCache();

  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: '../../dist/extension.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
