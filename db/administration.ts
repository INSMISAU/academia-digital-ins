import {AsyncLocalStorage} from 'node:async_hooks';

// Project instruction, 23/10/2026: administrative functions remain accessible
// during development. Individual accounts and roles are the final stage.
// This context uses the Academy's existing records, not the validation tables.
const context = new AsyncLocalStorage<boolean>();
export const inAdministration = () => context.getStore() === true;
export const runAdministration = <T>(handle: () => T): T => context.run(true, handle);
