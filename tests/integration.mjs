import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {Miniflare}=await import(require.resolve('miniflare',{paths:[require.resolve('wrangler')]}));
const adminHeaders={'oai-authenticated-user-id':'test-owner-identity','oai-authenticated-user-email':'perciliamuianga@gmail.com'};
const mf=new Miniflare({modules:[{type:'ESModule',path:'dist/server/index.js'},...fs.readdirSync('dist/server',{recursive:true}).filter(p=>p.endsWith('.js')&&p!=='index.js').map(p=>({type:'ESModule',path:'dist/server/'+p}))],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['BUCKET'],cf:false});
let count=0;
async function api(body,path='/api/academy',expected=200){const r=await mf.dispatchFetch('http://academy.test'+path,body?{method:'POST',headers:{...adminHeaders,'Content-Type':'application/json','Origin':'http://academy.test'},body:JSON.stringify(body)}:{headers:adminHeaders});const d=await r.json();assert.equal(r.status,expected,JSON.stringify(d));count++;return d;}
try{
const db=await mf.getD1Database('DB');for(const migration of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())for(const sql of fs.readFileSync('drizzle/'+migration,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
await api({action:'seed'});const initial=await api();assert.equal(initial.courses.length,4);
const course=await api(null,'/api/academy?course=orientacao');assert.equal(course.lessons.length,3);assert.equal(course.questions.length,5);assert(!JSON.stringify(course).includes('"answer"'));
const e=await api({action:'enroll',courseId:'orientacao',participant:'Teste — QA',province:'Maputo Cidade'});
await api({action:'certificate',enrollmentId:e.id},'/api/academy',400);
await api({action:'complete',enrollmentId:e.id,lessonId:'unknown'},'/api/academy',400);
const attempt='qa-attempt-1';await api({action:'submit',enrollmentId:e.id,answers:{Q1:0,Q2:1,Q3:1,Q4:2,Q5:1},requestId:attempt});
await api({action:'certificate',enrollmentId:e.id},'/api/academy',400);
await api({action:'submit',enrollmentId:e.id,answers:{Q1:0,Q2:1,Q3:1,Q4:2,Q5:1},requestId:attempt});
for(const l of course.lessons)await api({action:'complete',enrollmentId:e.id,lessonId:l.id});
await api({action:'complete',enrollmentId:e.id,lessonId:'L1'});
const state=await api();assert.equal(state.enrollments[0].done,3);assert.equal(state.enrollments[0].attempts.length,1);assert.equal(state.enrollments[0].best,100);assert.equal(state.enrollments[0].eligible,true);
const cert=await api({action:'certificate',enrollmentId:e.id});const cert2=await api({action:'certificate',enrollmentId:e.id});assert.equal(cert.id,cert2.id);
const pdf=await mf.dispatchFetch('http://academy.test/api/certificate/'+cert.id,{headers:adminHeaders});assert.equal(pdf.status,200);const bytes=new Uint8Array(await pdf.arrayBuffer());assert(new TextDecoder().decode(bytes.slice(0,4))==='%PDF');fs.writeFileSync(path.join(os.tmpdir(),'academy-test-certificate.pdf'),bytes);count++;
const verify=await mf.dispatchFetch('http://academy.test/verify/'+cert.code);assert.equal(verify.status,200);assert((await verify.text()).includes('Registo de conclusão válido'));count++;
await api({action:'revoke',id:cert.id,reason:'Teste de revogação'});
const revoked=await mf.dispatchFetch('http://academy.test/verify/'+cert.code);assert((await revoked.text()).includes('Certificado revogado'));count++;
const c=await api({action:'course',title:'Curso de teste editorial',summary:'Objectivo de teste',category:'Formação',hours:2,pass:80});
// Structured content uses the existing API contract: save, reload, snapshot and
// version copy must preserve every field without a schema/backend change.
const richSummary='INS_ACADEMY_COURSE_V1\n'+JSON.stringify({summary:'Resumo QA',objectives:'Objectivo QA',audience:'Equipa QA',prerequisites:'',modality:'Online'});
const richBody='INS_ACADEMY_LESSON_V1\n'+JSON.stringify({align:'justify',blocks:[{id:'qa-text',type:'text',text:'Texto QA',url:'',title:'',alt:'',source:''},{id:'qa-pdf',type:'pdf',text:'Nota QA',url:'https://example.test/manual.pdf',title:'PDF QA',alt:'',source:'Fonte QA'}]});
await api({action:'course',id:c.id,title:'Curso de teste editorial',summary:richSummary,category:'Formação',hours:2,pass:80});
await api({action:'transition',id:c.id,status:'publicado',comment:'Inválido'},'/api/academy',400);
await api({action:'transition',id:c.id,status:'em_revisao',comment:'Sem aulas'},'/api/academy',400);
await api({action:'lesson',courseId:c.id,module:'Módulo 1',title:'Aula de teste',body:richBody});
const savedContent=await api(null,'/api/academy?course='+c.id);assert.equal(savedContent.course.summary,richSummary);assert.equal(savedContent.lessons[0].body,richBody);
await api({action:'question',courseId:c.id,prompt:'Questão de teste',options:['A','B'],answer:0,explanation:'Resposta A'});
for(const status of ['em_revisao','aprovado','publicado'])await api({action:'transition',id:c.id,status,comment:'Decisão controlada de teste'});
await api({action:'course',id:c.id,title:'Não deve alterar',summary:'Teste',category:'Teste',hours:1,pass:80},'/api/academy',400);
const copy=await api({action:'duplicate',id:c.id});const copyData=await api(null,'/api/academy?course='+copy.id);assert.equal(copyData.lessons.length,1);assert.equal(copyData.course.status,'rascunho');
assert.equal(copyData.course.summary,richSummary);assert.equal(copyData.lessons[0].body,richBody);
const snapshot=JSON.parse((await db.prepare('SELECT content FROM snapshots WHERE courseId=?').bind(c.id).first()).content);assert.equal(snapshot.course.summary,richSummary);assert.equal(snapshot.lessons[0].body,richBody);
await api({action:'cohort',courseId:c.id,title:'Turma de teste',trainer:'Formador de teste',starts:'2026-10-01',ends:'2026-10-10',capacity:25});
const fd=new FormData();fd.append('file',new File([bytes],'certificado-teste.pdf',{type:'application/pdf'}));const encoded=new Request('http://academy.test/api/media',{method:'POST',body:fd});const upload=await mf.dispatchFetch(encoded.url,{method:'POST',headers:{...adminHeaders,Origin:'http://academy.test','Content-Type':encoded.headers.get('content-type')},body:await encoded.arrayBuffer()});const media=await upload.json();assert.equal(upload.status,200,JSON.stringify(media));const file=await mf.dispatchFetch('http://academy.test/api/media/'+media.id,{headers:adminHeaders});assert.equal(file.status,200);assert.equal((await file.arrayBuffer()).byteLength,bytes.length);count+=2;
// Anonymous visitors: full learning path, isolation, admin denials and CSRF.
async function guest(body=null,cookie='',route='/api/academy',expected=200,headers={}){
 const r=await mf.dispatchFetch('http://academy.test'+route,{...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{...(body?{'Content-Type':'application/json',Origin:'http://academy.test'}:{}),...(cookie?{Cookie:cookie}:{}),...headers}});
 const text=await r.text();assert.equal(r.status,expected,text);count++;let d;try{d=JSON.parse(text);}catch{}return {d,cookie:r.headers.get('set-cookie')?.split(';')[0],text};
}
const pub=await guest();assert.equal(pub.d.isAdmin,false);assert(pub.d.courses.every(c=>c.status==='publicado'));assert.equal(pub.d.enrollments.length,0);assert.equal(pub.d.audit.length,0);assert.equal(pub.d.media.length,0);assert.equal(pub.d.certificates.length,0);
await guest(null,'','/api/academy?course=biosseguranca',404);
for(const action of ['seed','course','lesson','question','transition','duplicate','revoke','cohort'])await guest({action},'','/api/academy',403);
await guest({action:'seed'},'','/api/academy',403,{'oai-authenticated-user-email':'perciliamuianga@gmail.com'});
await guest({action:'seed'},'','/api/academy',403,{'oai-authenticated-user-id':'other','oai-authenticated-user-email':'other@example.test'});
const ga=await guest({action:'enroll',courseId:'orientacao'});assert(ga.cookie);assert(ga.cookie.startsWith('__Host-academy-demo='));
const gb=await guest({action:'enroll',courseId:'orientacao'});assert(gb.cookie&&gb.cookie!==ga.cookie);assert.notEqual(ga.d.id,gb.d.id);
const ra=await guest(null,ga.cookie);assert.equal(ra.d.enrollments.length,1);assert.equal(ra.d.enrollments[0].id,ga.d.id);assert(!ra.text.includes('visitorKey'));assert(!ra.text.includes(gb.d.id));
assert.equal((await guest({action:'enroll',courseId:'orientacao'},ga.cookie)).d.id,ga.d.id);
for(const action of ['complete','submit','certificate'])await guest({action,enrollmentId:ga.d.id,lessonId:'L1'},gb.cookie,'/api/academy',403);
await guest({action:'complete',enrollmentId:e.id,lessonId:'L1'},ga.cookie,'/api/academy',403);
await guest({action:'complete',enrollmentId:ga.d.id,lessonId:'L1'},ga.cookie,'/api/academy',403,{Origin:'http://attacker.test'});
for(const l of course.lessons)await guest({action:'complete',enrollmentId:ga.d.id,lessonId:l.id},ga.cookie);
await guest({action:'submit',enrollmentId:ga.d.id,answers:{Q1:0,Q2:1,Q3:1,Q4:2,Q5:1},requestId:'guest-a-attempt'},ga.cookie);
const gc=await guest({action:'certificate',enrollmentId:ga.d.id},ga.cookie);
const gp=await mf.dispatchFetch('http://academy.test/api/certificate/'+gc.d.id,{headers:{Cookie:ga.cookie}});assert.equal(gp.status,200);assert((await gp.text()).startsWith('%PDF'));count++;
await guest(null,gb.cookie,'/api/certificate/'+gc.d.id,404);
await guest(null,'','/api/certificate/'+cert.id,404);
await guest(null,ga.cookie,'/api/media/'+media.id,403);
await guest({file:'invalid'},ga.cookie,'/api/media',403);
assert.equal((await guest(null,gb.cookie)).d.certificates.length,0);
// GitHub Pages: anonymous bearer sessions without cross-site cookies.
const pagesOrigin='https://insmisau.github.io';
const paToken='a'.repeat(64),pbToken='b'.repeat(64);
async function pages(body=null,token=paToken,route='/api/academy',expected=200,extra={}){
 const response=await mf.dispatchFetch('http://academy.test'+route,{
  ...(body?{method:'POST',body:JSON.stringify(body)}:{}),
  headers:{Origin:pagesOrigin,Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{}),...extra}
 });
 assert.equal(response.status,expected,await response.clone().text());
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),pagesOrigin);
 assert.equal(response.headers.get('Access-Control-Allow-Credentials'),null);
 assert.equal(response.headers.get('Set-Cookie'),null);
 count++;
 return response;
}
const preflight=await mf.dispatchFetch('http://academy.test/api/academy',{method:'OPTIONS',headers:{Origin:pagesOrigin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),pagesOrigin);count++;
for(const headers of [{Origin:'https://other.example'},{Origin:pagesOrigin,'Access-Control-Request-Headers':'oai-authenticated-user-email'},{Origin:pagesOrigin,'Access-Control-Request-Method':'DELETE'}]){
 const denied=await mf.dispatchFetch('http://academy.test/api/academy',{method:'OPTIONS',headers:{Origin:pagesOrigin,'Access-Control-Request-Method':'POST',...headers}});assert.equal(denied.status,403);count++;
}
const publicPages=await (await pages()).json();assert.equal(publicPages.isAdmin,false);assert.equal(publicPages.enrollments.length,0);
const cookieOnly=await mf.dispatchFetch('http://academy.test/api/academy',{headers:{Origin:pagesOrigin,Cookie:ga.cookie,...adminHeaders}});assert.equal(cookieOnly.status,401);count++;
const badToken=await pages(null,'invalid','/api/academy',401);
assert.equal((await (await pages(null,paToken,'/api/academy',200,{...adminHeaders,Cookie:ga.cookie})).json()).isAdmin,false);
await pages({action:'seed'},paToken,'/api/academy',403,adminHeaders);
const pa=await (await pages({action:'enroll',courseId:'orientacao'})).json();
const pb=await (await pages({action:'enroll',courseId:'orientacao'},pbToken)).json();assert.notEqual(pa.id,pb.id);
assert.equal((await (await pages({action:'enroll',courseId:'orientacao'})).json()).id,pa.id);
const resumed=await (await pages()).json();assert.equal(resumed.enrollments.length,1);assert.equal(resumed.enrollments[0].id,pa.id);assert(!JSON.stringify(resumed).includes('visitorKey'));
for(const action of ['complete','submit','certificate'])await pages({action,enrollmentId:pa.id,lessonId:'L1'},pbToken,'/api/academy',403);
for(const lesson of course.lessons)await pages({action:'complete',enrollmentId:pa.id,lessonId:lesson.id});
await pages({action:'submit',enrollmentId:pa.id,answers:{Q1:0,Q2:1,Q3:1,Q4:2,Q5:1},requestId:'pages-a-attempt'});
const pc=await (await pages({action:'certificate',enrollmentId:pa.id})).json();
const pp=await pages(null,paToken,'/api/certificate/'+pc.id);assert.equal(pp.headers.get('Content-Type'),'application/pdf');assert((await pp.text()).startsWith('%PDF'));
await pages(null,pbToken,'/api/certificate/'+pc.id,404);
const pdfPreflight=await mf.dispatchFetch('http://academy.test/api/certificate/'+pc.id,{method:'OPTIONS',headers:{Origin:pagesOrigin,'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization'}});assert.equal(pdfPreflight.status,204);count++;
const otherOrigin=await mf.dispatchFetch('http://academy.test/api/academy',{method:'POST',headers:{Origin:'https://other.example',Authorization:'Bearer '+paToken,'Content-Type':'application/json'},body:JSON.stringify({action:'enroll',courseId:'orientacao'})});assert.equal(otherOrigin.status,403);assert.equal(otherOrigin.headers.get('Access-Control-Allow-Origin'),null);count++;
// Existing cookie users retain their original records after the Pages addition.
const originalSession=await guest(null,ga.cookie);assert.equal(originalSession.d.enrollments[0].id,ga.d.id);assert.equal(originalSession.d.certificates[0].id,gc.d.id);
const root=await mf.dispatchFetch('http://academy.test/');assert.equal(root.status,200);assert((await root.text()).includes('Academia Digital'));count++;
// Shared administrative validation: no owner login, durable test-only tables.
const tableNames=['courses','lessons','questions','enrollments','progress','attempts','certificates','cohorts','media','audit','reviews','snapshots'];
async function originalRecords(){const out={};for(const table of tableNames)out[table]=(await db.prepare('SELECT * FROM '+table+' ORDER BY rowid').all()).results;return JSON.stringify(out);}
const beforeValidation=await originalRecords();
async function validation(body=null,token=paToken,route='/api/validation/academy',expected=200){return pages(body,token,route,expected);}
const emptyValidation=await (await validation()).json();assert.equal(emptyValidation.isAdmin,true);assert.equal(emptyValidation.validation,true);assert.equal(emptyValidation.courses.length,0);
await validation({action:'seed'});
const validationA=await (await validation()).json();const validationB=await (await validation(null,pbToken)).json();
assert.equal(validationA.courses.length,1);assert.deepEqual(validationA,validationB);assert.equal(validationA.courses[0].title,'Percurso de teste da Academia');
assert.equal(validationA.courses[0].hours,0);assert.equal(validationA.enrollments.length,0);assert.equal(validationA.certificates.length,0);assert.equal(validationA.media.length,0);
const sharedCourse=await (await validation({action:'course',title:'Teste — Equipa A',summary:'Ficha fictícia para validação',category:'Teste',hours:0,pass:80})).json();
const seenByB=await (await validation(null,pbToken,'/api/validation/academy?course='+sharedCourse.id)).json();assert.equal(seenByB.course.title,'Teste — Equipa A');
await validation({action:'lesson',courseId:sharedCourse.id,module:'Módulo de teste',title:'Aula de teste partilhada',body:richBody},pbToken);
await validation({action:'question',courseId:sharedCourse.id,prompt:'Questão de teste partilhada',options:['Sim','Não'],answer:0,explanation:'Explicação de teste'});
for(const status of ['em_revisao','aprovado','publicado'])await validation({action:'transition',id:sharedCourse.id,status,comment:'Decisão de teste da equipa'},pbToken);
await validation({action:'course',id:sharedCourse.id,title:'Alteração inválida',summary:'Teste',category:'Teste',hours:0,pass:80},paToken,'/api/validation/academy',400);
const sharedCopy=await (await validation({action:'duplicate',id:sharedCourse.id},pbToken)).json();const sharedCopyData=await (await validation(null,paToken,'/api/validation/academy?course='+sharedCopy.id)).json();assert.equal(sharedCopyData.course.status,'rascunho');assert.equal(sharedCopyData.lessons[0].body,richBody);
const vs=await (await validation(null,paToken,'/api/validation/academy?course=orientacao')).json();assert.equal(vs.lessons.length,3);
const ve=await (await validation({action:'enroll',courseId:'orientacao',participant:'Teste — Dispositivo A',province:'Maputo Cidade'})).json();
await validation({action:'enroll',courseId:'orientacao',participant:'Teste — Dispositivo A',province:'Maputo Cidade'},pbToken,'/api/validation/academy',400);
for(const lesson of vs.lessons)await validation({action:'complete',enrollmentId:ve.id,lessonId:lesson.id},pbToken);
await validation({action:'submit',enrollmentId:ve.id,answers:{Q1:0,Q2:1,Q3:1,Q4:2,Q5:1},requestId:'validation-attempt'},pbToken);
const vc=await (await validation({action:'certificate',enrollmentId:ve.id})).json();
const vp=await validation(null,pbToken,'/api/validation/certificate/'+vc.id);assert.equal(vp.headers.get('Content-Type'),'application/pdf');assert((await vp.text()).startsWith('%PDF'));
const vv=await mf.dispatchFetch('http://academy.test/validation/verify/'+vc.code);assert.equal(vv.status,200);assert((await vv.text()).includes('Registo de demonstração válido'));count++;
const publicVerify=await mf.dispatchFetch('http://academy.test/verify/'+vc.code);assert(!(await publicVerify.text()).includes('Registo de demonstração válido'));count++;
await validation({action:'revoke',id:vc.id,reason:'Revogação de teste'},pbToken);
const vr=await mf.dispatchFetch('http://academy.test/validation/verify/'+vc.code);assert((await vr.text()).includes('Certificado revogado'));count++;
await validation({action:'cohort',courseId:sharedCourse.id,title:'Turma de teste partilhada',trainer:'Formador de teste',starts:'2026-10-23',ends:'2026-10-24',capacity:25},pbToken);
const validationForm=new FormData();validationForm.append('file',new File([bytes],'material-partilhado-teste.pdf',{type:'application/pdf'}));const uploadRequest=new Request('http://academy.test/api/validation/media',{method:'POST',body:validationForm});
const validationUpload=await mf.dispatchFetch(uploadRequest.url,{method:'POST',headers:{Origin:pagesOrigin,Authorization:'Bearer '+paToken,'Content-Type':uploadRequest.headers.get('Content-Type')},body:await uploadRequest.arrayBuffer()});assert.equal(validationUpload.status,200,await validationUpload.clone().text());assert.equal(validationUpload.headers.get('Access-Control-Allow-Origin'),pagesOrigin);const vm=await validationUpload.json();count++;
const sharedFile=await mf.dispatchFetch('http://academy.test/api/validation/media/'+vm.id);assert.equal(sharedFile.status,200);assert.equal((await sharedFile.arrayBuffer()).byteLength,bytes.length);count++;
const bucket=await mf.getR2Bucket('BUCKET');assert(await bucket.get('validation/'+vm.id));assert.equal(await bucket.get(vm.id),null);assert(await bucket.get(media.id));count++;
const cannotReadOriginal=await mf.dispatchFetch('http://academy.test/api/validation/media/'+media.id);assert.equal(cannotReadOriginal.status,404);count++;
const cannotReadTest=await mf.dispatchFetch('http://academy.test/api/media/'+vm.id,{headers:adminHeaders});assert.equal(cannotReadTest.status,404);count++;
await validation(null,paToken,'/api/validation/academy?course='+c.id,503); // production-only ID never becomes visible here
await validation({action:'transition',id:c.id,status:'arquivado',comment:'Must stay isolated'},paToken,'/api/validation/academy',400);
await validation(null,paToken,'/api/validation/certificate/'+cert.id,404);
await pages(null,paToken,'/api/certificate/'+vc.id,404);
const stillShared=await (await validation(null,pbToken)).json();assert.equal(stillShared.enrollments[0].done,3);assert.equal(stillShared.enrollments[0].best,100);assert.equal(stillShared.certificates[0].status,'revogado');assert.equal(stillShared.cohorts.length,1);assert.equal(stillShared.media[0].id,vm.id);assert(stillShared.audit.length>0);
// Interleave shared-test and original requests with identical primary keys.
await Promise.all(Array.from({length:12},async(_,i)=>{
 const route=i%2?'/api/validation/academy?course=orientacao':'/api/academy?course=orientacao';
 const response=await mf.dispatchFetch('http://academy.test'+route,{headers:{Origin:pagesOrigin,Authorization:'Bearer '+(i%3?paToken:pbToken)}});
 assert.equal(response.status,200);const d=await response.json();assert.equal(d.course.title,i%2?'Percurso de teste da Academia':'Introdução à Academia Digital');count++;
}));
for(const route of ['/api/validation/academy','/api/validation/media','/api/validation/certificate/'+vc.id]){
 const cors=await mf.dispatchFetch('http://academy.test'+route,{method:'OPTIONS',headers:{Origin:pagesOrigin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});assert.equal(cors.status,204);count++;
 const denied=await mf.dispatchFetch('http://academy.test'+route,{method:route.includes('/certificate/')?'GET':'POST',headers:{Origin:'https://outside.test','Content-Type':'application/json'},...(route.includes('/certificate/')?{}:{body:JSON.stringify({action:'seed'})})});assert.equal(denied.status,403);count++;
}
// An ordinary browser can use the validation entry without any identity headers.
const noIdentity=await mf.dispatchFetch('http://academy.test/api/validation/academy');assert.equal(noIdentity.status,200);assert.equal((await noIdentity.json()).validation,true);count++;
await guest({action:'seed'},'','/api/academy',403,{'X-Academy-Validation':'1'});
assert.equal(await originalRecords(),beforeValidation,'Every original record must remain byte-for-byte identical');count++;

// The actual administration shares the public Academy catalogue, without an account wall.
async function administration(body=null,token=paToken,route='/api/administration/academy',expected=200){return pages(body,token,route,expected);}
const liveAdmin=await (await administration()).json();assert.equal(liveAdmin.isAdmin,true);assert.equal(liveAdmin.validation,false);assert(liveAdmin.courses.some(x=>x.id===c.id));
const managed=await (await administration({action:'course',title:'Curso QA da Academia',summary:richSummary,category:'Verificação local',hours:0,pass:80})).json();
await administration({action:'lesson',courseId:managed.id,module:'Módulo QA',title:'Aula QA',body:richBody},pbToken);
await administration({action:'question',courseId:managed.id,prompt:'Escolha a opção correcta',options:['Opção A','Opção B'],answer:0,explanation:'Resposta correcta: A.'});
for(const status of ['em_revisao','aprovado','publicado'])await administration({action:'transition',id:managed.id,status,comment:'Revisão da equipa'},pbToken);
const catalogueAfterPublication=await (await pages()).json();assert(catalogueAfterPublication.courses.some(x=>x.id===managed.id),'Published course must appear in the actual public catalogue');
const anotherAdmin=await (await administration(null,pbToken)).json();assert(anotherAdmin.courses.some(x=>x.id===managed.id));
const registration=await (await administration({action:'enroll',courseId:managed.id,participant:'Participante QA',province:'Maputo Cidade'})).json();
const managedDetail=await (await administration(null,pbToken,'/api/administration/academy?course='+managed.id)).json();
await administration({action:'complete',enrollmentId:registration.id,lessonId:managedDetail.lessons[0].id},pbToken);
await administration({action:'submit',enrollmentId:registration.id,answers:{[managedDetail.questions[0].id]:0},requestId:'administration-qa-attempt'},pbToken);
const actualCertificate=await (await administration({action:'certificate',enrollmentId:registration.id})).json();assert(actualCertificate.code.startsWith('ACAD-'));
const actualPdf=await administration(null,pbToken,'/api/administration/certificate/'+actualCertificate.id);assert((await actualPdf.text()).startsWith('%PDF'));
const actualVerification=await mf.dispatchFetch('http://academy.test/verify/'+actualCertificate.code);const actualVerificationText=await actualVerification.text();assert(actualVerificationText.includes('Registo de conclusão válido'));assert(!actualVerificationText.includes('demonstração'));count++;
await administration({action:'revoke',id:actualCertificate.id,reason:'Verificação local'},pbToken);
const actualForm=new FormData();actualForm.append('file',new File([bytes],'material-qa.pdf',{type:'application/pdf'}));const actualRequest=new Request('http://academy.test/api/administration/media',{method:'POST',body:actualForm});
const actualUpload=await mf.dispatchFetch(actualRequest.url,{method:'POST',headers:{Origin:pagesOrigin,Authorization:'Bearer '+pbToken,'Content-Type':actualRequest.headers.get('Content-Type')},body:await actualRequest.arrayBuffer()});assert.equal(actualUpload.status,200);assert.equal(actualUpload.headers.get('Access-Control-Allow-Origin'),pagesOrigin);const actualFile=await actualUpload.json();count++;
const actualDownload=await mf.dispatchFetch('http://academy.test/api/administration/media/'+actualFile.id);assert.equal(actualDownload.status,200);assert.equal((await actualDownload.arrayBuffer()).byteLength,bytes.length);count++;
assert(await bucket.get(actualFile.id));assert.equal(await bucket.get('validation/'+actualFile.id),null);count++;
for(const route of ['/api/administration/academy','/api/administration/media','/api/administration/certificate/'+actualCertificate.id]){
 const preflight=await mf.dispatchFetch('http://academy.test'+route,{method:'OPTIONS',headers:{Origin:pagesOrigin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});assert.equal(preflight.status,204);count++;
}
const mainStillPublic=await (await pages()).json();assert.equal(mainStillPublic.isAdmin,false);assert.equal(mainStillPublic.audit.length,0);assert.equal(mainStillPublic.media.length,0);
const noAccount=await mf.dispatchFetch('http://academy.test/api/administration/academy');assert.equal(noAccount.status,200);assert.equal((await noAccount.json()).isAdmin,true);count++;
const invalidOrigin=await mf.dispatchFetch('http://academy.test/api/administration/academy',{method:'POST',headers:{Origin:'https://outside.test','Content-Type':'application/json'},body:JSON.stringify({action:'course'})});assert.equal(invalidOrigin.status,403);count++;

console.log(JSON.stringify({passed:count,checks:['seed','no answer keys','completion gate','idempotency','server grading','certificate PDF and QR','verification','revocation','editorial workflow','published immutability','version copy','cohorts','upload/download','SSR','Pages CORS/preflight','Pages learning and PDF','bearer session isolation','cookie continuity','cross-origin administration denied','shared administrative validation without accounts','same business rules in isolated tables','cross-device shared test records','validation PDF, verification and revocation','test upload isolation','concurrent request isolation','original records unchanged in legacy validation','actual administration without accounts','publication visible in actual catalogue','actual course, enrollment, certificate and materials']},null,2));
}finally{await mf.dispose();}
