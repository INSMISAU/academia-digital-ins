import {build} from 'vite';
import {copyFile, mkdir, readdir, writeFile, readFile} from 'node:fs/promises';
import path from 'node:path';

await build({configFile: path.resolve('vite.pages.config.ts')});
// Keep prior bundles available for saved links and preserve the project history.
await mkdir('assets', {recursive: true});
for (const name of await readdir('dist-pages/assets')) {
  await copyFile(path.join('dist-pages/assets', name), path.join('assets', name));
}
await writeFile('index.html',(await readFile('dist-pages/index.html','utf8')).replace(/\r+/g,''));
await copyFile('dist-pages/favicon.svg', 'favicon.svg');
await copyFile('dist-pages/logo_ins.png', 'logo_ins.png');
for(const name of ['sw.js','manifest.webmanifest'])await copyFile(path.join('dist-pages',name),name);
await writeFile('.nojekyll', '');
console.log('GitHub Pages pronto: index.html, favicon.svg, assets/ e .nojekyll.');
