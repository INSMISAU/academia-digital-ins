import {sql} from 'drizzle-orm';
import { sqliteTable, text, integer, primaryKey, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const courses=sqliteTable('courses',{id:text().primaryKey(),title:text().notNull(),summary:text().notNull(),category:text().notNull(),status:text().notNull().default('rascunho'),hours:integer().notNull().default(1),pass:integer().notNull().default(80),version:integer().notNull().default(1),external:text(),updated:text().notNull()});
export const lessons=sqliteTable('lessons',{id:text().primaryKey(),courseId:text().notNull().references(()=>courses.id),module:text().notNull(),title:text().notNull(),body:text().notNull(),position:integer().notNull()});
export const questions=sqliteTable('questions',{id:text().primaryKey(),courseId:text().notNull().references(()=>courses.id),prompt:text().notNull(),options:text().notNull(),answer:integer().notNull(),explanation:text().notNull()});
export const enrollments=sqliteTable('enrollments',{id:text().primaryKey(),courseId:text().notNull().references(()=>courses.id),participant:text().notNull(),province:text().notNull(),institution:text().notNull(),visitorKey:text(),created:text().notNull()},t=>[uniqueIndex('enrollment_participant_course').on(t.participant,t.courseId),index('enrollment_visitor').on(t.visitorKey)]);
export const progress=sqliteTable('progress',{enrollmentId:text().notNull().references(()=>enrollments.id),lessonId:text().notNull().references(()=>lessons.id),completed:text().notNull()},t=>[primaryKey({columns:[t.enrollmentId,t.lessonId]})]);
export const attempts=sqliteTable('attempts',{id:text().primaryKey(),enrollmentId:text().notNull().references(()=>enrollments.id),score:integer().notNull(),answers:text().notNull(),created:text().notNull()});
export const certificates=sqliteTable('certificates',{id:text().primaryKey(),enrollmentId:text().notNull().unique().references(()=>enrollments.id),code:text().notNull().unique(),status:text().notNull().default('valido'),version:integer().notNull(),created:text().notNull()});
export const cohorts=sqliteTable('cohorts',{id:text().primaryKey(),courseId:text().notNull().references(()=>courses.id),title:text().notNull(),trainer:text().notNull(),starts:text().notNull(),ends:text().notNull(),capacity:integer().notNull()});
export const media=sqliteTable('media',{id:text().primaryKey(),name:text().notNull(),type:text().notNull(),size:integer().notNull(),created:text().notNull()});
export const audit=sqliteTable('audit',{actor:text().notNull().default(''),institution:text().notNull().default(''),result:text().notNull().default('permitido'),id:text().primaryKey(),action:text().notNull(),entity:text().notNull(),detail:text().notNull(),created:text().notNull()});
export const reviews=sqliteTable('reviews',{id:text().primaryKey(),courseId:text().notNull().references(()=>courses.id),comment:text().notNull(),decision:text().notNull(),created:text().notNull()});
export const snapshots=sqliteTable('snapshots',{id:text().primaryKey(),courseId:text().notNull().references(()=>courses.id),version:integer().notNull(),content:text().notNull(),created:text().notNull()});

// Shared validation records have their own tables and foreign keys.
export const validationCourses=sqliteTable('validation_courses',{id:text().primaryKey(),title:text().notNull(),summary:text().notNull(),category:text().notNull(),status:text().notNull().default('rascunho'),hours:integer().notNull().default(1),pass:integer().notNull().default(80),version:integer().notNull().default(1),external:text(),updated:text().notNull()});
export const validationLessons=sqliteTable('validation_lessons',{id:text().primaryKey(),courseId:text().notNull().references(()=>validationCourses.id),module:text().notNull(),title:text().notNull(),body:text().notNull(),position:integer().notNull()});
export const validationQuestions=sqliteTable('validation_questions',{id:text().primaryKey(),courseId:text().notNull().references(()=>validationCourses.id),prompt:text().notNull(),options:text().notNull(),answer:integer().notNull(),explanation:text().notNull()});
export const validationEnrollments=sqliteTable('validation_enrollments',{id:text().primaryKey(),courseId:text().notNull().references(()=>validationCourses.id),participant:text().notNull(),province:text().notNull(),institution:text().notNull(),visitorKey:text(),created:text().notNull()},t=>[uniqueIndex('validation_enrollment_participant_course').on(t.participant,t.courseId),index('validation_enrollment_visitor').on(t.visitorKey)]);
export const validationProgress=sqliteTable('validation_progress',{enrollmentId:text().notNull().references(()=>validationEnrollments.id),lessonId:text().notNull().references(()=>validationLessons.id),completed:text().notNull()},t=>[primaryKey({columns:[t.enrollmentId,t.lessonId]})]);
export const validationAttempts=sqliteTable('validation_attempts',{id:text().primaryKey(),enrollmentId:text().notNull().references(()=>validationEnrollments.id),score:integer().notNull(),answers:text().notNull(),created:text().notNull()});
export const validationCertificates=sqliteTable('validation_certificates',{id:text().primaryKey(),enrollmentId:text().notNull().unique().references(()=>validationEnrollments.id),code:text().notNull().unique(),status:text().notNull().default('valido'),version:integer().notNull(),created:text().notNull()});
export const validationCohorts=sqliteTable('validation_cohorts',{id:text().primaryKey(),courseId:text().notNull().references(()=>validationCourses.id),title:text().notNull(),trainer:text().notNull(),starts:text().notNull(),ends:text().notNull(),capacity:integer().notNull()});
export const validationMedia=sqliteTable('validation_media',{id:text().primaryKey(),name:text().notNull(),type:text().notNull(),size:integer().notNull(),created:text().notNull()});
export const validationAudit=sqliteTable('validation_audit',{actor:text().notNull().default(''),institution:text().notNull().default(''),result:text().notNull().default('permitido'),id:text().primaryKey(),action:text().notNull(),entity:text().notNull(),detail:text().notNull(),created:text().notNull()});
export const validationReviews=sqliteTable('validation_reviews',{id:text().primaryKey(),courseId:text().notNull().references(()=>validationCourses.id),comment:text().notNull(),decision:text().notNull(),created:text().notNull()});
export const validationSnapshots=sqliteTable('validation_snapshots',{id:text().primaryKey(),courseId:text().notNull().references(()=>validationCourses.id),version:integer().notNull(),content:text().notNull(),created:text().notNull()});

export const academyEntries=sqliteTable('academy_entries',{id:text().primaryKey(),kind:text().notNull(),title:text().notNull(),status:text().notNull().default('rascunho'),payload:text().notNull(),revision:integer().notNull().default(1),created:text().notNull(),updated:text().notNull()},t=>[index('academy_entries_kind_status').on(t.kind,t.status)]);
export const academyEntryHistory=sqliteTable('academy_entry_history',{entryId:text().notNull(),revision:integer().notNull(),payload:text().notNull(),created:text().notNull()},t=>[primaryKey({columns:[t.entryId,t.revision]})]);
export const academyCohortMembers=sqliteTable('academy_cohort_members',{cohortId:text().notNull().references(()=>cohorts.id),enrollmentId:text().notNull().references(()=>enrollments.id),created:text().notNull()},t=>[primaryKey({columns:[t.cohortId,t.enrollmentId]})]);
export const academyAttendance=sqliteTable('academy_attendance',{cohortId:text().notNull().references(()=>cohorts.id),enrollmentId:text().notNull().references(()=>enrollments.id),sessionDate:text().notNull(),state:text().notNull(),updated:text().notNull()},t=>[primaryKey({columns:[t.cohortId,t.enrollmentId,t.sessionDate]})]);
export const academyAssessmentRuns=sqliteTable('academy_assessment_runs',{id:text().primaryKey(),enrollmentId:text().notNull().references(()=>enrollments.id),assessmentId:text().notNull(),stage:text().notNull(),state:text().notNull(),started:text().notNull(),deadline:text(),snapshot:text().notNull(),answers:text(),review:text(),score:integer(),submitted:text()},t=>[index('academy_assessment_runs_enrollment').on(t.enrollmentId,t.assessmentId,t.started),uniqueIndex('academy_assessment_one_active').on(t.enrollmentId,t.assessmentId).where(sql`state = 'active'`)]);

export const validationAcademyEntries=sqliteTable('validation_academy_entries',{id:text().primaryKey(),kind:text().notNull(),title:text().notNull(),status:text().notNull().default('rascunho'),payload:text().notNull(),revision:integer().notNull().default(1),created:text().notNull(),updated:text().notNull()},t=>[index('validation_academy_entries_kind_status').on(t.kind,t.status)]);
export const validationAcademyEntryHistory=sqliteTable('validation_academy_entry_history',{entryId:text().notNull(),revision:integer().notNull(),payload:text().notNull(),created:text().notNull()},t=>[primaryKey({columns:[t.entryId,t.revision]})]);
export const validationAcademyCohortMembers=sqliteTable('validation_academy_cohort_members',{cohortId:text().notNull().references(()=>validationCohorts.id),enrollmentId:text().notNull().references(()=>validationEnrollments.id),created:text().notNull()},t=>[primaryKey({columns:[t.cohortId,t.enrollmentId]})]);
export const validationAcademyAttendance=sqliteTable('validation_academy_attendance',{cohortId:text().notNull().references(()=>validationCohorts.id),enrollmentId:text().notNull().references(()=>validationEnrollments.id),sessionDate:text().notNull(),state:text().notNull(),updated:text().notNull()},t=>[primaryKey({columns:[t.cohortId,t.enrollmentId,t.sessionDate]})]);
export const validationAcademyAssessmentRuns=sqliteTable('validation_academy_assessment_runs',{id:text().primaryKey(),enrollmentId:text().notNull().references(()=>validationEnrollments.id),assessmentId:text().notNull(),stage:text().notNull(),state:text().notNull(),started:text().notNull(),deadline:text(),snapshot:text().notNull(),answers:text(),review:text(),score:integer(),submitted:text()},t=>[index('validation_academy_assessment_runs_enrollment').on(t.enrollmentId,t.assessmentId,t.started),uniqueIndex('validation_academy_assessment_one_active').on(t.enrollmentId,t.assessmentId).where(sql`state = 'active'`)]);

// Fichas pessoais não integram as listagens públicas ou administrativas existentes.
export const registrationSettings=sqliteTable('academy_registration_settings',{
 id:integer().primaryKey(),enabled:integer().notNull().default(0),notice:text().notNull().default(''),privacy:text(),
});
export const registrationForms=sqliteTable('academy_registration_forms',{
 reference:text().primaryKey(),courseId:text().notNull().references(()=>courses.id),owner:text().notNull(),emailKey:text().notNull(),
 payload:text().notNull(),certificateName:text().notNull(),notice:text().notNull(),created:text().notNull(),verifiedContact:text(),
},t=>[uniqueIndex('registration_owner_course').on(t.owner,t.courseId),uniqueIndex('registration_email_course').on(t.emailKey,t.courseId)]);

// Short-lived sign-in transactions. Store no provider password or access/refresh token.
export const registrationIdentityFlows=sqliteTable('registration_identity_flows',{
 state:text().primaryKey(),ticket:text().notNull().unique(),owner:text().notNull(),origin:text().notNull(),provider:text().notNull(),
 nonce:text().notNull(),verifier:text().notNull(),browser:text(),phase:text().notNull(),expires:integer().notNull(),
 account:text(),name:text(),email:text(),trusted:integer().notNull().default(0),
});
export const registrationSessions=sqliteTable('registration_sessions',{
 token:text().primaryKey(),account:text().notNull(),name:text().notNull(),email:text().notNull(),trusted:integer().notNull(),expires:integer().notNull(),
});
export const registrationMailChecks=sqliteTable('registration_mail_checks',{
 account:text().primaryKey(),email:text().notNull(),digest:text().notNull(),tries:integer().notNull(),expires:integer().notNull(),confirmed:integer().notNull().default(0),
});
export const registrationMailLimits=sqliteTable('registration_mail_limits',{
 bucket:text().primaryKey(),until:integer().notNull(),count:integer().notNull(),
});

// Internal registration tests use separate records and settings.
export const validationRegistrationSettings=sqliteTable('validation_academy_registration_settings',{
 id:integer().primaryKey(),enabled:integer().notNull().default(0),notice:text().notNull().default(''),privacy:text(),
});
export const validationRegistrationForms=sqliteTable('validation_academy_registration_forms',{
 reference:text().primaryKey(),courseId:text().notNull().references(()=>validationCourses.id),owner:text().notNull(),emailKey:text().notNull(),
 payload:text().notNull(),certificateName:text().notNull(),notice:text().notNull(),created:text().notNull(),verifiedContact:text(),
},t=>[uniqueIndex('validation_registration_owner_course').on(t.owner,t.courseId),uniqueIndex('validation_registration_email_course').on(t.emailKey,t.courseId)]);

export const academyAccounts=sqliteTable('academy_accounts',{id:text().primaryKey(),email:text().notNull().unique(),name:text().notNull(),password:text().notNull(),verified:integer().notNull().default(0),created:text().notNull()});
export const academyPasswordResets=sqliteTable('academy_password_resets',{account:text().primaryKey(),digest:text().notNull(),expires:integer().notNull(),tries:integer().notNull()});
export const academyLearningPreferences=sqliteTable('academy_learning_preferences',{enrollmentId:text().primaryKey().references(()=>enrollments.id),lastLesson:text(),visited:text(),archived:integer().notNull().default(0)});

export const validationAcademyAccounts=sqliteTable('validation_academy_accounts',{id:text().primaryKey(),email:text().notNull().unique(),name:text().notNull(),password:text().notNull(),verified:integer().notNull().default(0),created:text().notNull()});
export const validationAcademyPasswordResets=sqliteTable('validation_academy_password_resets',{account:text().primaryKey(),digest:text().notNull(),expires:integer().notNull(),tries:integer().notNull()});
export const validationAcademyLearningPreferences=sqliteTable('validation_academy_learning_preferences',{enrollmentId:text().primaryKey().references(()=>validationEnrollments.id),lastLesson:text(),visited:text(),archived:integer().notNull().default(0)});
export const validationRegistrationSessions=sqliteTable('validation_registration_sessions',{token:text().primaryKey(),account:text().notNull(),name:text().notNull(),email:text().notNull(),trusted:integer().notNull(),expires:integer().notNull()});
export const validationRegistrationMailLimits=sqliteTable('validation_registration_mail_limits',{bucket:text().primaryKey(),until:integer().notNull(),count:integer().notNull()});
export const validationRegistrationMailChecks=sqliteTable('validation_registration_mail_checks',{account:text().primaryKey(),email:text().notNull(),digest:text().notNull(),tries:integer().notNull(),expires:integer().notNull(),confirmed:integer().notNull().default(0)});

// Access is granted explicitly. Legacy records keep no inferred institution.
export const academyInstitutions=sqliteTable('academy_institutions',{id:text().primaryKey(),name:text().notNull(),created:text().notNull()});
export const academyRoles=sqliteTable('academy_roles',{id:text().primaryKey(),account:text().notNull(),role:text().notNull(),institutionId:text().notNull().default(''),courseId:text().notNull().default(''),cohortId:text().notNull().default(''),canPublish:integer().notNull().default(0),created:text().notNull(),actor:text().notNull()},t=>[index('academy_roles_account').on(t.account)]);
export const academyResourceScopes=sqliteTable('academy_resource_scopes',{kind:text().notNull(),resourceId:text().notNull(),institutionId:text().notNull().default(''),ownerAccount:text().notNull().default(''),courseId:text().notNull().default('')},t=>[primaryKey({columns:[t.kind,t.resourceId]})]);
export const academyMfa=sqliteTable('academy_mfa',{account:text().primaryKey(),cipher:text().notNull(),enabled:integer().notNull().default(0),lastStep:integer().notNull().default(-1),expires:integer().notNull()});
export const academyMfaSessions=sqliteTable('academy_mfa_sessions',{token:text().primaryKey(),account:text().notNull(),expires:integer().notNull()});

// Access is granted explicitly. Legacy records keep no inferred institution.
export const validationAcademyInstitutions=sqliteTable('validation_academy_institutions',{id:text().primaryKey(),name:text().notNull(),created:text().notNull()});
export const validationAcademyRoles=sqliteTable('validation_academy_roles',{id:text().primaryKey(),account:text().notNull(),role:text().notNull(),institutionId:text().notNull().default(''),courseId:text().notNull().default(''),cohortId:text().notNull().default(''),canPublish:integer().notNull().default(0),created:text().notNull(),actor:text().notNull()},t=>[index('validation_academy_roles_account').on(t.account)]);
export const validationAcademyResourceScopes=sqliteTable('validation_academy_resource_scopes',{kind:text().notNull(),resourceId:text().notNull(),institutionId:text().notNull().default(''),ownerAccount:text().notNull().default(''),courseId:text().notNull().default('')},t=>[primaryKey({columns:[t.kind,t.resourceId]})]);
export const validationAcademyMfa=sqliteTable('validation_academy_mfa',{account:text().primaryKey(),cipher:text().notNull(),enabled:integer().notNull().default(0),lastStep:integer().notNull().default(-1),expires:integer().notNull()});
export const validationAcademyMfaSessions=sqliteTable('validation_academy_mfa_sessions',{token:text().primaryKey(),account:text().notNull(),expires:integer().notNull()});
