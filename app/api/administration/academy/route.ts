import {GET as read, POST as write, OPTIONS as preflight} from '@/app/api/academy/route';
import {runAdministration} from '@/db/administration';
export const dynamic = 'force-dynamic';
export const GET = (req: Request) => runAdministration(() => read(req));
export const POST = (req: Request) => runAdministration(() => write(req));
export const OPTIONS = preflight;
