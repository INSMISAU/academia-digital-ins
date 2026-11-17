import {importPackage,packageList,packageAction} from '@/lib/academy/packages';
import {withPagesCors,pagesPreflight,permittedOrigin} from '@/lib/academy-cors';
import {AcademyError,body,admin,isAdmin,principal,db,one,all,response,fail,text,integer,now,uid,audit} from '@/lib/academy/core';
import {editorialAction} from '@/lib/academy/editorial';
import {eventRead,eventAction,calendar} from '@/lib/academy/events';
import {learningRead,learningAction} from '@/lib/academy/learning';
import {uploadImage,serveImage,uploadAssignment,serveAssignment} from '@/lib/academy/images';
import {integrationStatus,runJobs} from '@/lib/academy/jobs';
import {checkout} from '@/lib/academy/payments';
import {ownsEnrollment} from '@/db/access';
export const dynamic='force-dynamic';
async function handle(req:Request){try{const u=new URL(req.url);if(req.method==='GET'){
 if(u.searchParams.has('packages'))return response(await packageList(req,text(u.searchParams.get('packages'),100,true)));
 if(u.searchParams.has('image'))return await serveImage(req,text(u.searchParams.get('image'),100,true),integer(u.searchParams.get('width'),0,2000));
 if(u.searchParams.has('file'))return await serveAssignment(req,text(u.searchParams.get('file'),100,true));
 if(u.searchParams.has('calendar'))return await calendar(text(u.searchParams.get('calendar'),100,true));
 if(u.searchParams.has('event'))return response(await eventRead(req,text(u.searchParams.get('event'),100,true)));
 if(u.searchParams.has('course'))return response(await learningRead(req,text(u.searchParams.get('course'),100,true)));
 if(u.searchParams.has('trash')){admin(req);return response({courses:await all('SELECT courseId,payload,created FROM academy_course_trash')});}
 if(u.searchParams.has('manual')){admin(req);const rows=await all("SELECT r.*,e.participant FROM academy_assessment_runs r JOIN enrollments e ON e.id=r.enrollmentId WHERE r.state='pending' AND e.courseId=?",text(u.searchParams.get('manual'),100,true));return response({runs:rows.map(r=>({...r,...JSON.parse(r.snapshot),answers:JSON.parse(r.answers)}))});}
 if(u.searchParams.has('integrations')){admin(req);return response({integrations:integrationStatus(),mail:await all('SELECT state,COUNT(*) count FROM academy_mail_queue GROUP BY state'),jobs:await one("SELECT created,detail FROM audit WHERE action='Executar tarefas agendadas' ORDER BY created DESC LIMIT 1")});}
 const p=await principal(req);return response({notifications:await all('SELECT * FROM academy_notifications WHERE account=? ORDER BY created DESC LIMIT 100',p.id),events:await all('SELECT r.*,e.title FROM academy_event_registrations r JOIN academy_entries e ON e.id=r.eventId WHERE r.account=? ORDER BY r.created DESC',p.id)});
 }
 if(!permittedOrigin(req))fail('Origem inválida.',403);
 if(req.headers.get('Content-Type')?.startsWith('multipart/form-data'))return response(u.searchParams.get('upload')==='package'?await importPackage(req):u.searchParams.get('upload')==='image'?await uploadImage(req):await uploadAssignment(req));
 const b=await body(req),a=text(b.action,80,true);
 if(a.startsWith('event_'))return response(await eventAction(req,b));
 if(a.startsWith('editorial_')){admin(req);return response(await editorialAction(b));}
 if(a==='course_trash'||a==='course_trash_restore'){admin(req);const id=text(b.id,100,true),c=await one('SELECT * FROM courses WHERE id=?',id);if(!c)fail('Curso não encontrado.',404);if(a==='course_trash'){if(c.status!=='rascunho'||await one('SELECT 1 FROM snapshots WHERE courseId=?',id)||await one('SELECT 1 FROM enrollments WHERE courseId=?',id))fail('Só é possível retirar rascunhos nunca publicados e sem inscrições.');await db().batch([db().prepare('INSERT OR IGNORE INTO academy_course_trash(courseId,payload,created,actor) VALUES(?,?,?,?)').bind(id,JSON.stringify(c),now(),(await import('@/lib/academy/core')).actor()),db().prepare("UPDATE courses SET status='lixo' WHERE id=? AND status='rascunho'").bind(id)]);}else{await db().batch([db().prepare("UPDATE courses SET status='rascunho' WHERE id=? AND status='lixo'").bind(id),db().prepare('DELETE FROM academy_course_trash WHERE courseId=?').bind(id)]);}await audit('Lixeira de cursos',id,a);return response({ok:true});}
 if(a.startsWith('package_'))return response(await packageAction(req,b));
 if(a==='checkout')return response(await checkout(req,b));
 if(a==='run_jobs'){admin(req);return response(await runJobs());}
 if(a==='exam_event'){const run=await one('SELECT * FROM academy_assessment_runs WHERE id=?',text(b.runId,100,true));if(!run||!await ownsEnrollment(req,run.enrollmentId))fail('Tentativa indisponível.',403);if(!JSON.parse(run.snapshot).examMode||run.state!=='active')return response({ok:true});if(!['blur','hidden','fullscreen_exit','copy','paste','contextmenu'].includes(b.kind))fail('Evento inválido.');const count=await one('SELECT COUNT(*) n FROM academy_exam_events WHERE runId=?',run.id);if(count.n<500)await db().prepare('INSERT INTO academy_exam_events(id,runId,kind,created) VALUES(?,?,?,?)').bind(uid(),run.id,b.kind,now()).run();return response({ok:true});}
 if(a==='assessment_grade'){admin(req);const run=await one("SELECT * FROM academy_assessment_runs WHERE id=? AND state='pending'",text(b.id,100,true));if(!run)fail('Avaliação não está pendente.',409);const snap=JSON.parse(run.snapshot),review=JSON.parse(run.review);for(const q of review.questions)if(q.type==='longa'){if(b.marks?.[q.id]===undefined)fail('Atribua uma nota a todas as respostas longas.');q.manualScore=integer(b.marks[q.id],0,100);q.feedback=text(b.feedback?.[q.id],3000);}const score=Math.round(review.questions.reduce((sum:number,q:any)=>sum+(q.type==='longa'?q.manualScore:q.correct?100:0),0)/review.questions.length);await db().batch([db().prepare("UPDATE academy_assessment_runs SET score=?,review=?,state='submitted' WHERE id=? AND state='pending'").bind(score,JSON.stringify(review),run.id),...(run.stage==='pos'?[db().prepare("INSERT OR IGNORE INTO attempts(id,enrollmentId,score,answers,created) SELECT id,enrollmentId,score,answers,submitted FROM academy_assessment_runs WHERE id=? AND state='submitted'").bind(run.id)]:[])]);await audit('Corrigir avaliação',run.id,score+'%');return response({ok:true});}
 return response(await learningAction(req,b));
 }catch(e:any){if(!(e instanceof AcademyError))console.error(e);return response({error:e instanceof AcademyError?e.message:'Não foi possível concluir a operação.'},e instanceof AcademyError?e.status:503);}}
export const GET=(req:Request)=>withPagesCors(req,()=>handle(req));
export const POST=(req:Request)=>withPagesCors(req,()=>handle(req));
export const OPTIONS=pagesPreflight;
