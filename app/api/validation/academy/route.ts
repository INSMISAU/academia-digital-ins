import {GET as readAcademy, POST as writeAcademy, OPTIONS as preflight} from '@/app/api/academy/route';
import {runValidation} from '@/db/validation';
export const dynamic = 'force-dynamic';
export const GET = (req: Request) => runValidation(() => readAcademy(req));
export const POST = (req: Request) => runValidation(() => writeAcademy(req));
export const OPTIONS = preflight;
