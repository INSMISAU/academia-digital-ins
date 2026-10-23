import {AsyncLocalStorage} from 'node:async_hooks';

// Only the dedicated validation routes enter this context. Request headers and
// client identifiers never grant access to the original administrative data.
const context = new AsyncLocalStorage<boolean>();
export const inValidation = () => context.getStore() === true;
export const runValidation = <T>(handle: () => T): T => context.run(true, handle);

const tables = 'courses|lessons|questions|enrollments|progress|attempts|certificates|cohorts|media|audit|reviews|snapshots';
const tableReference = new RegExp('\\b(FROM|JOIN|INTO|UPDATE)\\s+(' + tables + ')\\b', 'gi');

// SQL is application-owned, never visitor supplied. Rewrite table references,
// preserving column names, aliases and all bound values. The same business
// rules run against separate migration-owned tables for the shared test area.
export function validationSql(sql: string) {
  return sql.replace(tableReference, (_, keyword, table) => keyword + ' validation_' + table.toLowerCase());
}

export const mediaObjectKey = (id: string) => inValidation() ? 'validation/' + id : id;
