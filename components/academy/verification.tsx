'use client';
import {LanguageSelector,tr,getLocale,useLanguage} from './complete/language';
export function CertificateVerification({certificate:c,legacy,home}:{certificate:{status:string;title:string;code:string;created:string}|null;legacy:boolean;home:string}){
 useLanguage();
 return <main className="verify"><LanguageSelector/><a href={home}>{tr('Academia Digital do INS')}</a><h1>{tr('Verificação de certificado')}</h1>{legacy&&<p className="notice">{tr('Registo anterior de demonstração · sem validade oficial')}</p>}{c?<><h2>{tr(c.status==='valido'?(legacy?'Registo de demonstração válido':'Registo de conclusão válido'):c.status==='expirado'?'Certificado expirado':'Certificado revogado')}</h2><p>{tr(c.title)}</p><p>{tr('Código:')} <strong>{c.code}</strong></p><p>{tr('Emitido em')} {new Date(c.created).toLocaleDateString(getLocale())}</p><p>{tr(legacy?'Este registo corresponde a um percurso de demonstração.':'Este registo confirma a conclusão do curso na Academia.')} {tr('Não apresenta dados pessoais do participante.')}</p></>:<p>{tr('Código não encontrado ou serviço temporariamente indisponível. Confirme o código e tente novamente.')}</p>}</main>;
}
