import {POST as upload, OPTIONS as preflight} from '@/app/api/media/route';
import {runValidation} from '@/db/validation';
export const POST = (req: Request) => runValidation(() => upload(req));
export const OPTIONS = preflight;
