import {GET as download} from '@/app/api/media/[id]/route';
import {runValidation} from '@/db/validation';
export const GET = (req: Request, context: {params: Promise<{id: string}>}) => runValidation(() => download(req, context));
