'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo,lessonInfo,lessonTitle,lessonRecord,getLanguage} from '@/components/academy/complete/language';
import {tableRows,galleryItems} from '@/lib/academy-content';
import { BookOpen, ExternalLink, FileText } from 'lucide-react';
import { courseSetup, courseModules, type Workspace } from '@/lib/academy-workspace';
import { courseOverview, lessonContent, safeResourceUrl, videoEmbed, blockLabels, moduleGroups, lessonExcerpt } from '@/lib/academy-content';
export function CourseOverview({ summary }: {
    summary: string;
}) {
    const info = courseInfo(summary);
    return <section className="course-overview">
    <div className="course-summary"><p>{tr(info.summary)}</p></div>
    {tr(info.modality && <p className="course-modality"><BookOpen size={16} aria-hidden="true"/>{tr(info.modality)}</p>)}
    {tr(info.objectives && <div><h3>{tr("Objectivos de aprendizagem")}</h3><ul>{tr(info.objectives.split('\n').filter(s => s.trim()).map((s, i) => <li key={i}>{tr(s)}</li>))}</ul></div>)}
    {tr(info.audience && <div><h3>{tr("A quem se destina")}</h3><p>{tr(info.audience)}</p></div>)}
    {tr(info.prerequisites && <div><h3>{tr("Requisitos de participa\u00E7\u00E3o")}</h3><p>{tr(info.prerequisites)}</p></div>)}
  </section>;
}
export function LessonContent({ body }: {
    body: string;
}) {
    const content = lessonInfo(body);
    return <div lang={getLanguage()==='en'&&content.translations?.en?'en':'pt-MZ'} className={'academy-content align-' + content.align}>{getLanguage()==='en'&&!content.translations?.en&&body.trim()&&null}{tr(content.blocks.map((b, index) => {
            if (b.type === 'heading2') return <h2 key={b.id}>{tr(b.text)}</h2>;
            if (b.type === 'heading3') return <h3 key={b.id}>{tr(b.text)}</h3>;
            if (b.type === 'heading4') return <h4 key={b.id}>{tr(b.text)}</h4>;
            if (b.type === 'divider') return <hr key={b.id}/>;
            if (b.type === 'orderedlist') return <ol key={b.id}>{b.text.split('\n').filter(s=>s.trim()).map((s,i)=><li key={i}>{tr(s)}</li>)}</ol>;
            if (b.type === 'quote') return <blockquote key={b.id}><p>{tr(b.text)}</p>{b.source&&<cite>{tr(b.source)}</cite>}</blockquote>;
            if (b.type === 'formatted') return <div className="content-text" key={b.id}>{b.text.split(/\n\s*\n/).map((p,i)=><LinkedText key={i} text={p}/>)}</div>;
            if (b.type === 'table') {const rows=tableRows(b.text).slice(0,20);return <div className="editor-table-scroll" key={b.id} tabIndex={0} role="region" aria-label={tr(b.title||'Tabela')}><table className="content-table"><caption>{tr(b.title||'Tabela')}</caption><thead><tr>{rows[0].slice(0,8).map((cell,i)=><th scope="col" key={i}>{tr(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row,i)=><tr key={i}>{row.slice(0,8).map((cell,j)=><td key={j}>{tr(cell)}</td>)}</tr>)}</tbody></table></div>;}
            if (b.type === 'gallery') return <section className="content-gallery" key={b.id}>{b.title&&<h4>{tr(b.title)}</h4>}<div>{galleryItems(b.text).slice(0,12).map((item,i)=>{const url=safeResourceUrl(item.url);return url?<figure key={i}><img src={url} alt={tr(item.alt)} loading="lazy" decoding="async" referrerPolicy="no-referrer"/><figcaption>{item.caption&&<p>{tr(item.caption)}</p>}<small>{tr('Fonte: ')}{tr(item.source)}</small></figcaption></figure>:null;})}</div></section>;
            if (b.type === 'text')
                return <div className="content-text" key={index}>{tr(b.text.split(/\n\s*\n/).map((p, i) => <p key={i}>{tr(p)}</p>))}</div>;
            if (b.type === 'richtext')
                return <div className="content-text" key={index}>{tr(b.text.split(/\n\s*\n/).map((p, i) => <FormattedText key={i} text={tr(p)}/>))}</div>;
            if (b.type === 'notice')
                return <aside className="content-note" key={index}><strong>{tr(b.title || 'Nota')}</strong>{tr(b.text.split(/\n\s*\n/).map((p, i) => <p key={i}>{tr(p)}</p>))}</aside>;
            if (b.type === 'heading')
                return <h3 key={index}>{tr(b.text)}</h3>;
            if (b.type === 'list')
                return <ul key={index}>{tr(b.text.split('\n').filter(s => s.trim()).map((s, i) => <li key={i}>{tr(s)}</li>))}</ul>;
            const url = safeResourceUrl(b.url), embed = b.type === 'video' ? videoEmbed(b.url) : null;
            if (!url)
                return <p className="content-unavailable" key={index}>{tr(b.title || blockLabels[b.type])}{tr(" \u00B7 liga\u00E7\u00E3o indispon\u00EDvel.")}</p>;
            const link = <a href={url} target="_blank" rel="noopener noreferrer">{tr(b.title || blockLabels[b.type])}<ExternalLink size={15} aria-hidden="true"/><span className="sr-only">{tr(" (abre noutra janela)")}</span></a>;
            return <figure className={'content-resource resource-' + b.type} key={index}>
      {tr(b.type === 'image' ? <img src={url} alt={tr(b.alt)} loading="lazy" referrerPolicy="no-referrer"/> :
                    b.type === 'video' ? (embed ? <iframe src={embed} title={tr(b.title)} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture" allowFullScreen/> : <video src={url} controls preload="none">{tr("Consulte a liga\u00E7\u00E3o ao v\u00EDdeo abaixo.")}</video>) :
                        b.type === 'audio' ? <audio src={url} controls preload="none">{tr("Consulte a liga\u00E7\u00E3o ao \u00E1udio abaixo.")}</audio> : b.type === 'pdf' ? <iframe className="content-pdf" src={url} title={tr(b.title || 'Documento PDF')} loading="lazy"/> : <FileText size={24} aria-hidden="true"/>)}
      <figcaption>{tr(link)}{tr(b.text && <p>{tr(b.text)}</p>)}{tr(b.source && <small>{tr("Fonte: ")}{tr(b.source)}</small>)}</figcaption>
    </figure>;
        }))}</div>;
}
function FormattedText({ text }: {
    text: string;
}) {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return <p>{tr(parts.map((p, i) => p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{tr(p.slice(2, -2))}</strong> : p.startsWith('*') && p.endsWith('*') ? <em key={i}>{tr(p.slice(1, -1))}</em> : p))}</p>;
}
export function CourseProgramme({ lessons, editable, onEdit, onAdd }: {
    lessons: any[];
    editable: boolean;
    onEdit: (lesson: any) => void;
    onAdd: (module: string) => void;
}) {
    const groups = moduleGroups(lessons);
    return <section className="course-programme"><h3>{tr("Programa do curso")}</h3>
    {tr(!groups.length && <p>{tr("O programa ainda est\u00E1 por preparar.")}</p>)}
    {tr(groups.map((group, i) => <section className="programme-module" key={i}>
      <header><div><span className="eyebrow">{tr("M\u00D3DULO ")}{tr(i + 1)}</span><h4>{tr(group.lessons[0]?lessonRecord(group.lessons[0]).module:group.name)}</h4></div><span>{tr(group.lessons.length)} {tr(group.lessons.length === 1 ? 'aula' : 'aulas')}</span></header>
      <ol>{tr(group.lessons.map(lesson => <li key={lesson.id}><div><strong>{tr(lessonTitle(lesson))}</strong><p>{tr(lessonExcerpt(lesson.body,160,getLanguage()))}</p></div>{tr(editable && <button type="button" className="text-button" onClick={() => onEdit(lesson)}>{tr("Editar aula")}</button>)}</li>))}</ol>
    </section>))}
    {tr(editable && <button type="button" className="button-link" onClick={() => onAdd(groups.at(-1)?.name || '')}>{tr("Adicionar aula")}</button>)}
  </section>;
}
export function CourseNotes({ work, courseId }: {
    work: Workspace;
    courseId: string;
}) {
    const setup = courseSetup(work, courseId), modules = courseModules(work, courseId);
    return <>{tr((setup.starts || setup.ends) && <p className="meta">{tr("Per\u00EDodo de forma\u00E7\u00E3o: ")}{tr(setup.starts || 'por definir')}{tr(" a ")}{tr(setup.ends || 'por definir')}</p>)}{tr(setup.notes && <section className="content-note"><h3>{tr("Notas e orienta\u00E7\u00F5es")}</h3><p className="workspace-prose">{tr(setup.notes)}</p></section>)}{tr(modules.filter(m => m.body.notes || m.body.objectives).map(m => <section className="programme-module" key={m.id}><h3>{tr(m.title)}</h3>{tr(m.body.objectives && <><strong>{tr("Objectivos")}</strong><p className="workspace-prose">{tr(m.body.objectives)}</p></>)}{tr(m.body.notes && <><strong>{tr("Notas")}</strong><p className="workspace-prose">{tr(m.body.notes)}</p></>)}</section>))}</>;
}

function LinkedText({text}:{text:string}) {return <p>{text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]\n]+\]\(https:\/\/[^)\s]+\))/g).map((part,i)=>{const match=/^\[([^\]]+)\]\((.+)\)$/.exec(part),url=match&&safeResourceUrl(match[2]);if(match&&url)return <a key={i} href={url} target="_blank" rel="noopener noreferrer">{match[1]}<span className="sr-only">{tr(' (abre noutra janela)')}</span></a>;if(part.startsWith('**')&&part.endsWith('**'))return <strong key={i}>{part.slice(2,-2)}</strong>;if(part.startsWith('*')&&part.endsWith('*'))return <em key={i}>{part.slice(1,-1)}</em>;return part;})}</p>;}
