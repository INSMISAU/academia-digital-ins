import {GET as download, OPTIONS as preflight} from '@/app/api/certificate/[id]/route';
import {runAdministration} from '@/db/administration';
export const GET = (req: Request, context: {params: Promise<{id: string}>}) => runAdministration(() => download(req, context));
export const OPTIONS = preflight;
