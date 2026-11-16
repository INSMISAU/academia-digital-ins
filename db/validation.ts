import {AsyncLocalStorage} from 'node:async_hooks';

// Only the dedicated validation routes enter this context. Request headers and
// client identifiers never grant access to the original administrative data.
const context = new AsyncLocalStorage<{admin:boolean}>();
export const inValidation = () => !!context.getStore();
export const validationAdmin = () => context.getStore()?.admin===true;
export const runValidation = <T>(handle: () => T, admin=true): T => context.run({admin}, handle);

const tables = 'academy_institutions|academy_roles|academy_resource_scopes|academy_mfa|academy_mfa_sessions|academy_accounts|academy_password_resets|academy_learning_preferences|registration_sessions|registration_mail_limits|registration_mail_checks|academy_registration_forms|academy_registration_settings|academy_entries|academy_entry_history|academy_cohort_members|academy_attendance|academy_assessment_runs|courses|lessons|questions|enrollments|progress|attempts|certificates|cohorts|media|audit|reviews|snapshots';
const tableReference = new RegExp('\\b(FROM|JOIN|INTO|UPDATE)\\s+(' + tables + ')\\b', 'gi');

// SQL is application-owned, never visitor supplied. Rewrite table references,
// preserving column names, aliases and all bound values. The same business
// rules run against separate migration-owned tables for the shared test area.
export function validationSql(sql: string) {
  return sql.replace(tableReference, (_, keyword, table) => keyword + ' validation_' + table.toLowerCase());
}

export const mediaObjectKey = (id: string) => inValidation() ? 'validation/' + id : id;
