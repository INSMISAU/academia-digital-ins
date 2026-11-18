'use client';
import {AcademyImage} from './image';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { ImageUrl } from './complete/common';
import { courseOverview } from '@/lib/academy-content';
import { saveOfflineCourse } from '@/lib/academy-offline';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { lessonPercent } from '@/lib/academy-catalogue';
import { normalise } from '@/lib/academy-workspace';
import './account.css';
export function MyLearning({ data, start, navigate, save }: {
    data: any;
    start: (e: any) => void;
    navigate: (v: string) => void;
    save: (b: any) => Promise<void>;
}) {
    const [error, setError] = useState(''), [offline, setOffline] = useState(''), [search, setSearch] = useState(''), [tab, setTab] = useState('todos'), [order, setOrder] = useState('recentes'), [page, setPage] = useState(0);
    const entries = data.isAdmin ? [] : data.enrollments;
    const state = (e: any) => e.eligible ? 'concluidos' : e.done || e.visited || e.attempts?.length ? 'andamento' : 'por_iniciar';
    const groups = [['todos', 'Todos'], ['por_iniciar', 'Por iniciar'], ['andamento', 'Em andamento'], ['concluidos', 'Concluídos'], ['arquivados', 'Arquivados']];
    const matching = (e: any, id: string) => id === 'arquivados' ? e.archived : !e.archived && (id === 'todos' || state(e) === id);
    const filtered = entries.filter((e: any) => matching(e, tab) && normalise(e.c.title).includes(normalise(search))).sort((a: any, b: any) => order === 'titulo' ? a.c.title.localeCompare(b.c.title, 'pt') : order === 'progresso' ? lessonPercent(b) - lessonPercent(a) : String(b.visited || b.created).localeCompare(a.visited || a.created));
    const pages = Math.max(1, Math.ceil(filtered.length / 6)), current = Math.min(page, pages - 1), last = entries.filter((e: any) => e.visited && !e.archived).sort((a: any, b: any) => b.visited.localeCompare(a.visited))[0];
    return <><nav className="academy-personal-nav" aria-label={tr("Meu perfil")}><button className="text-button" onClick={() => navigate('perfil')}>{tr("Meu perfil")}</button><button className="text-button" onClick={() => navigate('certificados')}>{tr("Meus certificados")}</button></nav><div className="page-heading"><div><span className="eyebrow">{tr("O SEU PERCURSO")}</span><h1>{tr("Meus cursos")}</h1></div><Button onClick={() => navigate('catalogo')}>{tr("Explorar cat\u00E1logo")}</Button></div>
 {tr(data.isAdmin ? <p>{tr("A gest\u00E3o de participantes est\u00E1 em Inscri\u00E7\u00F5es. Use o perfil de participante para consultar um percurso pessoal.")}</p> : <>
 <p role="alert">{tr(error)}</p><p role="status">{tr(offline)}</p>{tr(data.offline && <p>{tr("Sem liga\u00E7\u00E3o. Pode consultar o texto guardado; avalia\u00E7\u00F5es, v\u00EDdeos e grava\u00E7\u00E3o de progresso exigem liga\u00E7\u00E3o.")}</p>)}<div className="metrics">{tr([['Por iniciar', entries.filter((e: any) => state(e) === 'por_iniciar').length], ['Em andamento', entries.filter((e: any) => state(e) === 'andamento').length], ['Concluídos', entries.filter((e: any) => e.eligible).length], ['Certificados', data.certificates.length]].map(([title, count]) => <div className="metric" key={title}><span>{tr(title)}</span><strong>{tr(count)}</strong></div>))}</div>
 {tr(last && <section className="panel"><h2>{tr("Continuar a aprender")}</h2><p>{tr(last.c.title)}{tr(last.lastTitle ? ' · ' + last.lastTitle : '')}</p><Button onClick={() => start(last)}>{tr("Retomar a \u00FAltima aula visitada")}</Button></section>)}
 <div className="academy-learning-controls"><label>{tr("Pesquisar cursos")}<input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}/></label><label>{tr("Ordenar")}<select value={order} onChange={e => { setOrder(e.target.value); setPage(0); }}><option value="recentes">{tr("Actividade mais recente")}</option><option value="titulo">{tr("T\u00EDtulo")}</option><option value="progresso">{tr("Progresso")}</option></select></label></div>
 <div className="academy-enrollment-filters" role="group" aria-label={tr("Filtrar os meus cursos")}>{tr(groups.map(([id, label]) => <button key={id} aria-pressed={tab === id} onClick={() => { setTab(id); setPage(0); }}>{tr(label)}<span>{tr(entries.filter((e: any) => matching(e, id)).length)}</span></button>))}</div>
 <div className="enrollment-grid">{tr(filtered.slice(current * 6, current * 6 + 6).map((e: any) => <article className="panel academy-enrollment academy-personal-course" key={e.id}><span className="badge">{tr(groups.find(([id]) => id === state(e))?.[1])}</span><h2>{tr(courseTitle(e.c))}</h2>{tr(e.imageId && <AcademyImage imageId={e.imageId} variants={e.imageVariants} alt={tr(e.imageAlt)} loading="lazy" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }}/>)}<p>{tr(e.c.category)}{tr(" \u00B7 ")}{tr(courseOverview(e.c.summary).modality)}</p>{tr(e.trainers?.length > 0 && <p>{tr("Formadores: ")}{tr(e.trainers.join(', '))}</p>)}<p>{tr("Tempo de estudo: ")}{tr(Math.floor((e.studySeconds || 0) / 60))}{tr(" minutos")}</p>{tr(e.pendingTasks?.map((t: any) => <p key={t.id}>{tr("Por entregar: ")}{tr(t.title)}{tr(t.due ? ' · ' + new Date(t.due).toLocaleDateString(getLocale()) : '')}</p>))}<div className="academy-progress-label"><span>{tr("Aulas conclu\u00EDdas")}</span><strong>{tr(lessonPercent(e))}{tr("%")}</strong></div><Progress value={lessonPercent(e)} aria-label={tr("Percentagem de aulas conclu\u00EDdas")}/><p>{tr(e.done)}{tr(" de ")}{tr(e.total)}{tr(" aulas \u00B7 ")}{tr(e.best === null ? 'Sem avaliação' : 'Melhor nota: ' + e.best + '%')}</p>{tr(e.pending?.length > 0 && <p>{tr("Por concluir: ")}{tr(e.pending.join(' · '))}</p>)}{tr(!e.eligible && <p>{tr(e.done < e.total ? `Faltam ${e.total - e.done} aulas. ` : '')}{tr(e.best === null || e.best < e.c.pass ? `A avaliação exige uma nota mínima de ${e.c.pass}%.` : '')}</p>)}<div className="academy-enrollment-actions"><Button variant="outline" onClick={async () => { try {
            await saveOfflineCourse(e.courseId);
            setOffline('Texto do curso guardado nesta sessão. Os ficheiros e vídeos externos exigem ligação.');
        }
        catch (err: any) {
            setError(err.message);
        } }}>{tr("Guardar texto para consulta sem liga\u00E7\u00E3o")}</Button><Button onClick={() => start(e)}>{tr(e.eligible ? 'Rever percurso' : state(e) === 'por_iniciar' ? 'Iniciar curso' : 'Continuar a aprender')}</Button><Button variant="outline" onClick={() => void save({ action: 'learning_preference', enrollmentId: e.id, archived: !e.archived })}>{tr(e.archived ? 'Retirar do arquivo' : 'Arquivar')}</Button></div></article>))}</div>
 {tr(data.registrations?.length > 0 && <section><h2>{tr("Inscri\u00E7\u00F5es em cursos noutra plataforma")}</h2><div className="enrollment-grid">{tr(data.registrations.map((r: any) => <article key={r.reference} className="panel academy-personal-course"><h3>{tr(r.courseId === 'surtos' ? 'Curso Básico em Investigação de Surtos' : r.title)}</h3><p>{tr("Inscri\u00E7\u00E3o registada \u00B7 ")}{tr(r.reference)}</p><a className="button-link" href={r.external} target="_blank" rel="noopener noreferrer">{tr("Abrir o curso")}</a></article>))}</div></section>)}
 {tr(!filtered.length && !data.registrations?.length && <div className="empty"><h2>{tr(entries.length ? 'Sem cursos neste filtro' : 'Ainda não tem cursos inscritos')}</h2><p>{tr(entries.length ? 'Altere a pesquisa ou o filtro.' : 'Consulte os cursos disponíveis no catálogo.')}</p></div>)}
 {tr(pages > 1 && <nav className="academy-learning-pages" aria-label={tr("P\u00E1ginas dos meus cursos")}><Button variant="outline" disabled={!current} onClick={() => setPage(current - 1)}>{tr("Anterior")}</Button><span>{tr(current + 1)}{tr(" de ")}{tr(pages)}</span><Button variant="outline" disabled={current + 1 === pages} onClick={() => setPage(current + 1)}>{tr("Seguinte")}</Button></nav>)}
 </>)}</>;
}
