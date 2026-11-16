import {AsyncLocalStorage} from 'node:async_hooks';

// Entered only after the route validates a private technical-team capability.
// This context uses the Academy's existing records, not the validation tables.
const context = new AsyncLocalStorage<boolean>();
export const inAdministration = () => context.getStore() === true;
export const runAdministration = <T>(handle: () => T): T => context.run(true, handle);
