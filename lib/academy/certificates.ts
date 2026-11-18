import {one,now,courseEntry,fail} from './core';
import {registrationCertificateName} from '@/lib/registration-service';
import {db} from '@/db/store';
export async function certificateSnapshot(e:any,c:any,grade:number){const setup=await courseEntry(c.id),config=setup.certificate||{},name=await registrationCertificateName(db(),e.id,e.visitorKey||'');return {participant:name||e.participant,title:c.title,hours:c.hours,grade,version:setup.semanticVersion||c.version,institution:config.institution||'',signatureId:config.signatureId||'',templateId:config.templateId||'',issued:now(),expires:config.validityDays?new Date(Date.now()+config.validityDays*86400000).toISOString():''};}
