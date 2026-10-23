import {POST as upload, OPTIONS as preflight} from '@/app/api/media/route';
import {runAdministration} from '@/db/administration';
export const POST = (req: Request) => runAdministration(() => upload(req));
export const OPTIONS = preflight;
