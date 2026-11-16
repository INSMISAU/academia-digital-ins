import {GET as readAcademy, POST as writeAcademy, OPTIONS as preflight} from '@/app/api/academy/route';
import {withTeam} from '@/lib/team-access';
export const dynamic = 'force-dynamic';
export const GET = (req: Request) => withTeam(req,()=>readAcademy(req),true);
export const POST = (req: Request) => withTeam(req,()=>writeAcademy(req),true);
export const OPTIONS = preflight;
