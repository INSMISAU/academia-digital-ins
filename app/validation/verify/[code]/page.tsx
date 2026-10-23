import Verify from '@/app/verify/[code]/page';
import {runValidation} from '@/db/validation';
export const dynamic = 'force-dynamic';
export default function VerifyValidation(context: {params: Promise<{code: string}>}) {
  return runValidation(() => Verify(context));
}
