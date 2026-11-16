import {GET as download} from '@/app/api/media/[id]/route';
import {withTeam} from '@/lib/team-access';
export const GET = (req: Request, context: {params: Promise<{id: string}>}) => withTeam(req,()=>download(req, context));

export {pagesPreflight as OPTIONS} from '@/lib/academy-cors';
