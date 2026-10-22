'use client';
import {BookOpen, ExternalLink, FileText} from 'lucide-react';
import {courseOverview, lessonContent, safeResourceUrl, videoEmbed, blockLabels, moduleGroups, lessonExcerpt} from '@/lib/academy-content';

export function CourseOverview({summary}: {summary: string}) {
  const info = courseOverview(summary);
  return <section className="course-overview">
    <div className="course-summary"><p>{info.summary}</p></div>
    {info.modality && <p className="course-modality"><BookOpen size={16} aria-hidden="true"/>{info.modality}</p>}
    {info.objectives && <div><h3>Objectivos de aprendizagem</h3><ul>{info.objectives.split('\n').filter(s => s.trim()).map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
    {info.audience && <div><h3>A quem se destina</h3><p>{info.audience}</p></div>}
    {info.prerequisites && <div><h3>Requisitos de participação</h3><p>{info.prerequisites}</p></div>}
  </section>;
}

export function LessonContent({body}: {body: string}) {
  const content = lessonContent(body);
  return <div className={'academy-content align-' + content.align}>{content.blocks.map((b, index) => {
    if (b.type === 'text') return <div className="content-text" key={index}>{b.text.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>;
    if (b.type === 'heading') return <h3 key={index}>{b.text}</h3>;
    if (b.type === 'list') return <ul key={index}>{b.text.split('\n').filter(s => s.trim()).map((s, i) => <li key={i}>{s}</li>)}</ul>;
    const url = safeResourceUrl(b.url), embed = b.type === 'video' ? videoEmbed(b.url) : null;
    if (!url) return <p className="content-unavailable" key={index}>{b.title || blockLabels[b.type]} · ligação indisponível.</p>;
    const link = <a href={url} target="_blank" rel="noopener noreferrer">{b.title || blockLabels[b.type]}<ExternalLink size={15} aria-hidden="true"/><span className="sr-only"> (abre noutra janela)</span></a>;
    return <figure className={'content-resource resource-' + b.type} key={index}>
      {b.type === 'image' ? <img src={url} alt={b.alt} loading="lazy" referrerPolicy="no-referrer"/> :
        b.type === 'video' ? (embed ? <iframe src={embed} title={b.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture" allowFullScreen/> : <video src={url} controls preload="none">Consulte a ligação ao vídeo abaixo.</video>) :
        b.type === 'audio' ? <audio src={url} controls preload="none">Consulte a ligação ao áudio abaixo.</audio> : <FileText size={24} aria-hidden="true"/>}
      <figcaption>{link}{b.text && <p>{b.text}</p>}{b.source && <small>Fonte: {b.source}</small>}</figcaption>
    </figure>;
  })}</div>;
}

export function CourseProgramme({lessons, editable, onEdit, onAdd}: {lessons: any[]; editable: boolean; onEdit: (lesson: any) => void; onAdd: (module: string) => void}) {
  const groups = moduleGroups(lessons);
  return <section className="course-programme"><h3>Programa do curso</h3>
    {!groups.length && <p>O programa ainda está por preparar.</p>}
    {groups.map((group, i) => <section className="programme-module" key={i}>
      <header><div><span className="eyebrow">MÓDULO {i + 1}</span><h4>{group.name}</h4></div><span>{group.lessons.length} {group.lessons.length === 1 ? 'aula' : 'aulas'}</span></header>
      <ol>{group.lessons.map(lesson => <li key={lesson.id}><div><strong>{lesson.title}</strong><p>{lessonExcerpt(lesson.body)}</p></div>{editable && <button type="button" className="text-button" onClick={() => onEdit(lesson)}>Editar aula</button>}</li>)}</ol>
    </section>)}
    {editable && <button type="button" className="button-link" onClick={() => onAdd(groups.at(-1)?.name || '')}>Adicionar aula</button>}
  </section>;
}
