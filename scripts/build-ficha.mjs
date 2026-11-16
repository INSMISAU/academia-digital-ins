import {build} from 'vite';
import {copyFile, mkdir, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

await build({configFile: path.resolve('vite.pages.config.ts')});
// Keep prior bundles available for saved links and preserve the project history.
await mkdir('assets', {recursive: true});
for (const name of await readdir('dist-pages/assets')) {
  await copyFile(path.join('dist-pages/assets', name), path.join('assets', name));
}
await copyFile('dist-pages/index.html', 'index.html');
await copyFile('dist-pages/favicon.svg', 'favicon.svg');
await copyFile('dist-pages/logo_ins.png', 'logo_ins.png');
await writeFile('.nojekyll', '');
console.log('GitHub Pages pronto: index.html, favicon.svg, assets/ e .nojekyll.');

// Keep the published portal styling when rebuilding the registration-only release.
// The original stylesheet is retained in Git; the form has its own scoped CSS.
const {readFile}=await import('node:fs/promises');
const {createHash}=await import('node:crypto');
const original='index-CVCftgiB.css';
await readFile(path.join('assets',original)); // refuse to emit a broken entry point
const form=Buffer.concat([await readFile('components/academy/registration.css'),Buffer.from('\n'),await readFile('components/academy/account.css')]);
const fragment='ficha-inscricao-'+createHash('sha256').update(form).digest('hex').slice(0,12)+'.css';
const doc=await readFile('dist-pages/index.html','utf8');
const match=/<link rel="stylesheet" crossorigin href="([^"]+\/assets\/)index-[^"]+\.css">/;
if(!match.test(doc))throw Error('Não foi localizada a folha de estilos da página.');
const markup=doc.replace(match,(_tag,base)=>'<link rel="stylesheet" crossorigin href="'+base+original+'">\n    <link rel="stylesheet" href="'+base+fragment+'">');
await writeFile(path.join('assets',fragment),form);
await copyFile(path.join('assets',original),path.join('dist-pages','assets',original));
await writeFile(path.join('dist-pages','assets',fragment),form);
await writeFile('index.html',markup);
await writeFile('dist-pages/index.html',markup);
