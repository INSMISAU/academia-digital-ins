import {env} from 'cloudflare:workers';
import {runJobs} from '@/lib/academy/jobs';
export async function POST(req:Request){const expected=(env as any).INS_SCHEDULER_SECRET;if(!expected||expected.length<32||req.headers.get('Authorization')!=='Bearer '+expected)return new Response('Não autorizado',{status:401});return Response.json(await runJobs());}
