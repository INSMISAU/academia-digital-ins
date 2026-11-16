import {POST as upload, OPTIONS as preflight} from '@/app/api/media/route';
import {withTeam} from '@/lib/team-access';
export const POST = (req: Request) => withTeam(req,()=>upload(req),true);
export const OPTIONS = preflight;
