import {env} from 'cloudflare:workers';

// Explicit development setting, independent of the institutional role matrix.
// Disabling it preserves accounts and removes their automatic administration.
export function openAdministrationRegistration(){
 return (env as unknown as Record<string,string>).INS_OPEN_ADMIN_REGISTRATION==='1';
}
