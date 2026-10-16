export const pagesOrigin = 'https://insmisau.github.io';

export function permittedOrigin(req: Request) {
  const origin = req.headers.get('Origin');
  return origin === new URL(req.url).origin || origin === pagesOrigin;
}

export async function withPagesCors(req: Request, handle: () => Promise<Response>) {
  const origin = req.headers.get('Origin');
  if (origin && !permittedOrigin(req)) return Response.json({error: 'Origem não autorizada.'}, {status: 403});
  if (origin === pagesOrigin && !/^Bearer [a-f0-9]{64}$/.test(req.headers.get('Authorization') || '')) {
    return corsHeaders(Response.json({error: 'Não foi possível recuperar esta sessão de teste. Recarregue a página.'}, {status: 401}));
  }
  const response = await handle();
  return origin === pagesOrigin ? corsHeaders(response) : response;
}

function corsHeaders(response: Response) {
  response.headers.set('Access-Control-Allow-Origin', pagesOrigin);
  response.headers.append('Vary', 'Origin');
  // No cross-site cookies or administration credentials are accepted.
  response.headers.delete('Set-Cookie');
  return response;
}

export function pagesPreflight(req: Request) {
  if (req.headers.get('Origin') !== pagesOrigin) return new Response(null, {status: 403});
  const method = req.headers.get('Access-Control-Request-Method');
  const headers = (req.headers.get('Access-Control-Request-Headers') || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
  if (!['GET', 'POST'].includes(method || '') || headers.some(h => !['authorization', 'content-type'].includes(h))) return new Response(null, {status: 403});
  return new Response(null, {status: 204, headers: {
    'Access-Control-Allow-Origin': pagesOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
    'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
  }});
}
