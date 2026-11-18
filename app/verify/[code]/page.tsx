import {inValidation} from '@/db/validation';
import {one} from '@/db/store';
import {CertificateVerification} from '@/components/academy/verification';
export const dynamic='force-dynamic';
export default async function Verify({params}:{params:Promise<{code:string}>}){const {code}=await params;const legacy=code.startsWith('DEMO-');let c:any;try{c=await one('SELECT ct.code,ct.status,ct.created,c.title,meta.expires FROM certificates ct JOIN enrollments e ON e.id=ct.enrollmentId JOIN courses c ON c.id=e.courseId LEFT JOIN academy_certificate_metadata meta ON meta.certificateId=ct.id WHERE ct.code=?',code);if(c?.status==='valido'&&c.expires&&c.expires<new Date().toISOString())c.status='expirado';}catch{}return <CertificateVerification certificate={c?{status:c.status,title:c.title,code:c.code,created:c.created}:null} legacy={legacy} home={inValidation()?'/?validacao=1#certificados':'/'}/>;}
