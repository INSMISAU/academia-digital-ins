// Only the Pages build supplies this constant. The existing Site stays same-origin.
declare const __ACADEMY_API_ORIGIN__: string;
export const academyOrigin = typeof __ACADEMY_API_ORIGIN__ === 'string' ? __ACADEMY_API_ORIGIN__ : '';
// Keep the existing storage key to preserve visitor progress.
const storageKey = 'ins-academia-demo-session-v1';
const lifetime = 30 * 24 * 60 * 60 * 1000;
type Session = {token: string; expires: number};
let memorySession: Session | undefined;

// Works in HTTPS and in the supervised HTTP preview; request IDs do not carry
// identity or permissions. Authentication continues to use the session token.
export function academyRequestId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
}

function sessionToken() {
  let session = memorySession;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) session = JSON.parse(saved);
  } catch { /* Browsers that disable storage can still test in this tab. */ }
  if (!session || !/^[a-f0-9]{64}$/.test(session.token) || !Number.isFinite(session.expires) || session.expires <= Date.now()) {
    session = {
      token: Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''),
      expires: Date.now() + lifetime,
    };
    try { localStorage.setItem(storageKey, JSON.stringify(session)); } catch { /* Use memory below. */ }
  }
  memorySession = session;
  return session.token;
}

// Keep participant sessions confined to this tab, including on shared equipment.
const participantKey=()=>academyValidation()?'ins-ficha-participante-teste-v1':'ins-ficha-participante-v1';
let activeParticipant:Session|undefined;
function currentParticipant(){
 try{const text=sessionStorage.getItem(participantKey());if(text)activeParticipant=JSON.parse(text);}catch{}
 if(!activeParticipant||!/^([a-f0-9]{64})$/.test(activeParticipant.token))return '';
 if(activeParticipant.expires<=Date.now()&&!activeParticipant.token.startsWith('a0ce5510ade0'))return beginParticipant();
 return activeParticipant.token;
}
export function setParticipantSession(token:string){
 if(!/^[a-f0-9]{64}$/.test(token))throw Error('Sessão inválida.');
 activeParticipant={token,expires:Date.now()+(token.startsWith('a0ce5510ade0')?8*3600000:lifetime)};
 try{sessionStorage.setItem(participantKey(),JSON.stringify(activeParticipant));}catch{}
}
let managementInstitution='';
export function setManagementInstitution(id:string){managementInstitution=id;}
export function beginParticipant(){
 if(typeof sessionStorage!=='undefined')for(let i=sessionStorage.length-1;i>=0;i--){const key=sessionStorage.key(i);if(key?.startsWith('ins-offline-course:'))sessionStorage.removeItem(key);}
 setManagementInstitution('');
 const token=academyRequestId()+academyRequestId();
 // New tabs must not recover the previous participant through the legacy browser-wide token.
 if(!academyValidation()){
  memorySession={token:academyRequestId()+academyRequestId(),expires:Date.now()+lifetime};
  try{localStorage.setItem(storageKey,JSON.stringify(memorySession));}catch{}
 }
 setParticipantSession(token);return token;
}
export const hasExternalSession=()=>currentParticipant().startsWith('a0ce5510ade0');
export const participantScope=()=>currentParticipant();

export function academyAdministration() {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).get('administracao')==='1';
}
export function academyManagement(){return typeof location!=='undefined'&&new URLSearchParams(location.search).get('gestao')==='1';}
export function academyValidation(){return typeof location!=='undefined'&&new URLSearchParams(location.search).get('validacao')==='1';}
export function academyParticipantTest(){return academyValidation()&&new URLSearchParams(location.search).get('perfil')==='participante';}
const teamKey='ins-ologatecnica-access-v1';
const administratorKey='ins-academia-administration-session-v1';
export function setAdministrationSession(token:string,expires:number){
 if(!/^[a-f0-9]{64}$/.test(token)||!Number.isFinite(expires)||expires<=Date.now())throw Error('Sessão inválida.');
 sessionStorage.setItem(administratorKey,JSON.stringify({token,expires}));
 sessionStorage.removeItem(teamKey);
}
export function forgetAdministrationSession(){sessionStorage.removeItem(administratorKey);}
export function setTeamAccess(value:string){
  const text=value.trim(),key=text.includes('#ologakey=')?text.slice(text.indexOf('#ologakey=')+10):text;
  if(!/^[a-f0-9]{64}$/.test(key))throw Error('Introduza um código de acesso válido.');
  sessionStorage.setItem(teamKey,key);
}
export function hasTeamAccess(){return !!teamToken();}
export async function clearTeamAccess(){
 try{await academyFetch('/api/administration-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});}
 finally{forgetAdministrationSession();sessionStorage.removeItem(teamKey);beginParticipant();location.assign(location.pathname);}
}
function teamToken(){try{const saved=sessionStorage.getItem(administratorKey);if(saved){const session=JSON.parse(saved);return session.expires>Date.now()&&/^[a-f0-9]{64}$/.test(session.token)?session.token:'';}return sessionStorage.getItem(teamKey)||'';}catch{return '';}}
export function academyUrl(path: string) {
  if (path.startsWith('/api/')&&!path.startsWith('/api/team-access')&&!path.startsWith('/api/administration-session')) {
    if(academyManagement()&&(/^\/api\/(academy|workspace|completion|media|certificate|resource|export)(\/|\?|$)/.test(path)||path.startsWith('/api/registration/settings')))path='/api/management/'+path.slice(5);
    if(academyValidation())path='/api/validation/'+path.slice(5);
    else if(academyAdministration())path='/api/administration/'+path.slice(5);
  }
  return academyOrigin + path;
}

export const academyPublicUrl = 'https://insmisau.github.io/academia-digital-ins/';

// Keep the technical access in the same tab and origin as its private capability.
export function academyAdministrationUrl(_isAdmin?: boolean) {
  return academyManagement()?(academyValidation()?'?validacao=1&perfil=participante&gestao=1#gestao':'?gestao=1#gestao'):academyValidation()?'?validacao=1#painel':'?administracao=1#painel';
}

export function academyFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if(academyManagement()&&typeof init.body==='string'&&headers.get('Content-Type')?.includes('application/json')){if(managementInstitution){const body=JSON.parse(init.body);if(!body.institutionId)init={...init,body:JSON.stringify({...body,institutionId:managementInstitution})};}}
  const active=academyAdministration()&&path!=='/api/account'?'':currentParticipant();
  if (active||academyOrigin||academyValidation()) headers.set('Authorization', 'Bearer ' + (active||sessionToken()));
  if(path.startsWith('/api/team-access')||path.startsWith('/api/administration-session')||academyAdministration()||academyValidation()){
    const token=teamToken();if(token)headers.set('X-Academy-Team',token);
    if(academyParticipantTest())headers.set('X-Academy-Mode','participant');
  }
  return fetch(academyUrl(path), {
    ...init, headers, credentials: academyOrigin ? 'omit' : 'same-origin',
  });
}

// Bound read requests, including the response body. Writes keep their existing
// behaviour and are never retried automatically.
export async function academyReadJson(path: string, timeoutMs = 20_000) {
  if(typeof navigator!=='undefined'&&!navigator.onLine){const {offlineResponse}=await import('./academy-offline');const offline=offlineResponse(path);if(offline)return offline;}
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('O servidor demorou a responder. Tente novamente.'));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      (async () => {
        const response = await academyFetch(path, {cache: 'no-store', signal: controller.signal});
        let data: any;
        try { data = await response.json(); }
        catch { throw new Error('Não foi possível ler a resposta do servidor. Tente novamente.'); }
        if (!response.ok) throw Object.assign(new Error(data?.error || 'Não foi possível carregar os dados. Tente novamente.'), {status: response.status});
        return data;
      })(),
      timeout,
    ]);
  } catch (error) {
    if (error instanceof TypeError) throw new Error('Não foi possível ligar ao servidor. Verifique a ligação e tente novamente.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadCertificate(id: string, code: string) {
  const response = await academyFetch('/api/certificate/' + encodeURIComponent(id), {cache: 'no-store'});
  if (!response.ok) throw Error('Não foi possível descarregar o certificado. Tente novamente.');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = code.replace(/[^A-Za-z0-9-]/g, '') + '.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadMaterial(id:string,name:string){
 const response=await academyFetch('/api/media/'+encodeURIComponent(id),{cache:'no-store'});
 if(!response.ok)throw Error('Não foi possível descarregar o material.');
 const url=URL.createObjectURL(await response.blob()),link=document.createElement('a');
 link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
