import {GET as download, OPTIONS as preflight} from '@/app/api/certificate/[id]/route';
import {runValidation} from '@/db/validation';
export const GET = (req: Request, context: {params: Promise<{id: string}>}) => runValidation(() => download(req, context));
export const OPTIONS = preflight;
