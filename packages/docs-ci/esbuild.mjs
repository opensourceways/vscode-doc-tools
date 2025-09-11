import esbuild from 'esbuild';
import fs from 'fs';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

function cleanCache() {
  if (fs.existsSync('../../dist/')) {
    fs.rmSync('../../dist/', { recursive: true, force: true, retryDelay: 300 });
  }
}

async function main() {
  cleanCache();

  const ctx = await esbuild.context({
    entryPoints: ['src/docs-ci.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: '../../dist/docs-ci.js',
    logLevel: 'silent',
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
