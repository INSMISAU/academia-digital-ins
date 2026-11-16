import {GET as download, OPTIONS as preflight} from '@/app/api/certificate/[id]/route';
import {withTeam} from '@/lib/team-access';
export const GET = (req: Request, context: {params: Promise<{id: string}>}) => withTeam(req,()=>download(req, context),true);
export const OPTIONS = preflight;
