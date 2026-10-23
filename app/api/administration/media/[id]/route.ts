import {GET as download} from '@/app/api/media/[id]/route';
import {runAdministration} from '@/db/administration';
export const GET = (req: Request, context: {params: Promise<{id: string}>}) => runAdministration(() => download(req, context));
