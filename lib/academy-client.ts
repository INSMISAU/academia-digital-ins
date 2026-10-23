// Only the Pages build supplies this constant. The existing Site stays same-origin.
declare const __ACADEMY_API_ORIGIN__: string;
export const academyOrigin = typeof __ACADEMY_API_ORIGIN__ === 'string' ? __ACADEMY_API_ORIGIN__ : '';
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

export function academyValidation() {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).get('validacao') === '1';
}
export function academyUrl(path: string) {
  if (academyValidation()) {
    if (path.startsWith('/api/')) path = '/api/validation/' + path.slice(5);
    else if (path.startsWith('/verify/')) path = '/validation' + path;
  }
  return academyOrigin + path;
}

export const academyPublicUrl = 'https://insmisau.github.io/academia-digital-ins/';

// Validation stays on the Academy entry point. It has its own server records;
// this flag never changes authorization on the original administration API.
export function academyAdministrationUrl(_isAdmin?: boolean) {
  return '?validacao=1#gestao';
}

export function academyFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (academyOrigin) headers.set('Authorization', 'Bearer ' + sessionToken());
  return fetch(academyUrl(path), {
    ...init, headers, credentials: academyOrigin ? 'omit' : 'same-origin',
  });
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
