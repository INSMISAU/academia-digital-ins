import {build} from 'vite';
import {copyFile, mkdir, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';

await build({configFile: path.resolve('vite.pages.config.ts')});
// Keep the source project intact and publish only browser assets at main / root.
await rm('assets', {recursive: true, force: true});
await mkdir('assets', {recursive: true});
for (const name of await readdir('dist-pages/assets')) {
  await copyFile(path.join('dist-pages/assets', name), path.join('assets', name));
}
await copyFile('dist-pages/index.html', 'index.html');
await copyFile('dist-pages/favicon.svg', 'favicon.svg');
await copyFile('dist-pages/logo_ins.png', 'logo_ins.png');
await writeFile('.nojekyll', '');
console.log('GitHub Pages pronto: index.html, favicon.svg, assets/ e .nojekyll.');
