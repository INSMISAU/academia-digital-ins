import {db} from '@/db/store';
// Aggregate only the selected enrolments; role authorisation precedes this query.
export async function reportData(ids:string[],filters:Record<string,string>={}){
 const selected=JSON.stringify(ids),inIds='IN (SELECT value FROM json_each(?))';
 const result=await db().batch([
  db().prepare(`SELECT e.*,c.title,c.hours,c.pass,(SELECT COUNT(*) FROM lessons l WHERE l.courseId=e.courseId) total,(SELECT COUNT(*) FROM progress p JOIN lessons l ON l.id=p.lessonId WHERE p.enrollmentId=e.id AND l.courseId=e.courseId) done,(SELECT MAX(score) FROM attempts a WHERE a.enrollmentId=e.id) best,(SELECT COUNT(*) FROM attempts a WHERE a.enrollmentId=e.id) attemptCount,(SELECT COALESCE(SUM(seconds),0) FROM academy_study_time s WHERE s.enrollmentId=e.id) studySeconds,(SELECT MAX(lastSeen) FROM academy_study_time s WHERE s.enrollmentId=e.id) lastStudy,(SELECT MAX(completed) FROM progress p WHERE p.enrollmentId=e.id) lastProgress,(SELECT MAX(created) FROM attempts a WHERE a.enrollmentId=e.id) lastAttempt,(SELECT visited FROM academy_learning_preferences p WHERE p.enrollmentId=e.id) visited,(SELECT MAX(created) FROM academy_submissions s WHERE s.enrollmentId=e.id) lastSubmission,(SELECT MAX(COALESCE(submitted,started)) FROM academy_assessment_runs r WHERE r.enrollmentId=e.id) lastAssessment FROM enrollments e JOIN courses c ON c.id=e.courseId WHERE e.id ${inIds}`).bind(selected),
  db().prepare(`SELECT id,payload FROM academy_entries WHERE kind='curso' AND id IN (SELECT courseId FROM enrollments WHERE id ${inIds})`).bind(selected),
  db().prepare(`SELECT id,payload FROM academy_entries WHERE kind='tarefa' AND status='publicado' AND json_extract(payload,'$.courseId') IN (SELECT courseId FROM enrollments WHERE id ${inIds})`).bind(selected),
  db().prepare(`SELECT enrollmentId,assignmentId,state,score FROM academy_submissions WHERE enrollmentId ${inIds}`).bind(selected),
  db().prepare(`SELECT enrollmentId,approved FROM academy_course_approvals WHERE enrollmentId ${inIds}`).bind(selected),
  db().prepare(`SELECT enrollmentId,COUNT(*) n,SUM(CASE WHEN state='presente' THEN 1 ELSE 0 END) present FROM academy_attendance WHERE enrollmentId ${inIds} GROUP BY enrollmentId`).bind(selected),
 ]);
 const members=filters.cohort?(await db().prepare('SELECT enrollmentId FROM academy_cohort_members WHERE cohortId=? AND enrollmentId '+inIds).bind(filters.cohort,selected).all()).results as any[]:[];
 const [enrollments,configs,tasks,submissions,approvals,attendance]=result.map(r=>r.results as any[]),config=new Map(configs.map(r=>[r.id,JSON.parse(r.payload)])),byId=new Map(enrollments.map(e=>[e.id,e]));
 const tasksByCourse=new Map<string,any[]>();for(const task of tasks){const body=JSON.parse(task.payload);const list=tasksByCourse.get(body.courseId)||[];list.push({id:task.id,...body});tasksByCourse.set(body.courseId,list);}const submissionMap=new Map(submissions.map(s=>[JSON.stringify([s.enrollmentId,s.assignmentId]),s])),approved=new Set(approvals.filter(a=>a.approved===1).map(a=>a.enrollmentId)),attendanceMap=new Map(attendance.map(a=>[a.enrollmentId,a]));
 if(enrollments.length!==ids.length)throw Error('A selecção mudou. Actualize os dados antes de exportar.');
 return ids.map(id=>{const e=byId.get(id)!,setup=config.get(e.courseId)||{},pending:string[]=[];
  if(filters.course&&e.courseId!==filters.course||filters.province&&e.province!==filters.province||filters.institution&&e.institution!==filters.institution||filters.from&&e.created.slice(0,10)<filters.from||filters.to&&e.created.slice(0,10)>filters.to||filters.program&&setup.programId!==filters.program||filters.teacher&&!(setup.teacherIds||[]).includes(filters.teacher)||filters.cohort&&!members.some(m=>m.enrollmentId===e.id))throw Error('A selecção mudou. Actualize os dados antes de exportar.');
  for(const task of tasksByCourse.get(e.courseId)||[]){if(!task.required)continue;const s=submissionMap.get(JSON.stringify([e.id,task.id]));if(!s||s.state!=='avaliado'||s.score<task.pass)pending.push(task.id);}
  if(setup.minStudyMinutes&&e.studySeconds<setup.minStudyMinutes*60)pending.push('study');
  if(setup.requireTrainerApproval&&!approved.has(id))pending.push('approval');
  if(setup.minAttendance){const a=attendanceMap.get(id);if(!a?.n||a.present/a.n*100<setup.minAttendance)pending.push('attendance');}
  const lastActivity=Math.max(Date.parse(e.created)||0,Date.parse(e.visited)||0,Date.parse(e.lastProgress)||0,Date.parse(e.lastAttempt)||0,Number(e.lastStudy)||0,Date.parse(e.lastSubmission)||0,Date.parse(e.lastAssessment)||0);
  return {id:e.id,participant:e.participant,province:e.province,institution:e.institution,created:e.created,courseId:e.courseId,done:e.done,total:e.total,best:e.best,attemptCount:e.attemptCount,studySeconds:e.studySeconds,lastActivity,eligible:!pending.length&&e.total>0&&e.done===e.total&&e.best!==null&&e.best>=e.pass,c:{title:e.title,pass:e.pass,hours:e.hours}};
 });
}
