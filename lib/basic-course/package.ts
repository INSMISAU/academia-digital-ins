import {zipSync,strToU8} from 'fflate';
import originalWorker from './offline.json';
import {validateCourse} from './model';
const hash=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as BufferSource)),b=>b.toString(16).padStart(2,'0')).join('');
export async function coursePackage(value:unknown,revision:number,workerSource=originalWorker){
 const data=validateCourse(value);
 const content=strToU8('/* Conteúdo publicado pelo gestor do Curso Básico. */\nwindow.INS_CURSO = '+JSON.stringify(data,null,2)+';\n');
 const pattern=/\/\* OFFLINE_FILES_START \*\/ ([\s\S]*?) \/\* OFFLINE_FILES_END \*\//;
 const match=workerSource.match(pattern);if(!match)throw Error('Manifesto offline indisponível.');
 const files=JSON.parse(match[1]),entry=files.find((e:any)=>e.path==='formacao-dados.js');
 if(!entry)throw Error('Conteúdo não consta do manifesto offline.');
 entry.bytes=content.length;entry.sha256=await hash(content);
 const id=(await hash(strToU8(JSON.stringify(files)))).slice(0,16);
 const worker=workerSource.replace(pattern,'/* OFFLINE_FILES_START */ '+JSON.stringify(files,null,2)+' /* OFFLINE_FILES_END */').replace(/\/\* OFFLINE_ID_START \*\/ .*? \/\* OFFLINE_ID_END \*\//,'/* OFFLINE_ID_START */ '+JSON.stringify(id)+' /* OFFLINE_ID_END */');
 return zipSync({'formacao-dados.js':content,'sw.js':strToU8(worker)});
}
