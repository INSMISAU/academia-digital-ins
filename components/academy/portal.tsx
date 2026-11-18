'use client';
import {tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { courseOverview } from '@/lib/academy-content';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Clock, GraduationCap, Layers, Search, Award, Play, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar';
import { courseCategories, latestEnrollment, lessonPercent } from '@/lib/academy-catalogue';
export function AcademyMenu({ items, view, navigate, reviewCount = 0 }: {
    items: any[];
    view: string;
    navigate: (id: string) => void;
    reviewCount?: number;
}) {
    const { setOpenMobile } = useSidebar();
    return <SidebarMenu>{tr(items.map(item => <SidebarMenuItem key={item.id}><SidebarMenuButton isActive={view === item.id} onClick={() => { navigate(item.id); setOpenMobile(false); }}><item.icon /><span>{tr(item.title)}</span>{tr(item.id === 'revisao' && reviewCount > 0 && <span className="nav-count">{tr(reviewCount)}</span>)}</SidebarMenuButton></SidebarMenuItem>))}</SidebarMenu>;
}
export function PublicCourseCard({ course, enrollment, onOpen, onContinue, onRegister, management = false }: {
    course: any;
    enrollment?: any;
    onOpen: () => void;
    onContinue: () => void;
    onRegister?: () => void;
    management?: boolean;
}) {
    const labels: any = { rascunho: 'Rascunho', em_revisao: 'Em revisão', aprovado: 'Aprovado', publicado: 'Publicado', arquivado: 'Arquivado' };
    return <article className="academy-course-card">
    <div className={'academy-course-top ' + (course.external ? 'external-course' : 'internal-course')}>
      <span className="academy-category">{tr(courseCategory(course))}</span><BookOpen size={25} strokeWidth={1.5} aria-hidden="true"/>
    </div>
    <div className="academy-course-content">
      <div className="academy-course-type">{tr(management ? labels[course.status] : course.external ? 'Curso online' : courseInfo(course.summary).modality || 'Percurso na Academia')}{tr(course.hours > 0 && <span><Clock size={14}/>{tr(course.hours)}{tr(" h")}</span>)}</div>
      <h3>{tr(courseTitle(course))}</h3>
      <p>{tr(course.external ? 'Conteúdos e avaliações do curso.' : courseInfo(course.summary).summary)}</p>
      {tr(!course.external && <div className="academy-course-facts"><span><Layers size={15}/>{tr(course.lessons || 0)}{tr(" aulas")}</span><span>{tr(course.questions || 0)}{tr(" quest\u00F5es")}</span></div>)}
      {tr(enrollment && <div className="academy-course-progress"><div><span>{tr(enrollment.eligible ? 'Percurso concluído' : 'Aulas concluídas')}</span><strong>{tr(lessonPercent(enrollment))}{tr("%")}</strong></div><Progress value={lessonPercent(enrollment)} aria-label={tr("Percentagem de aulas conclu\u00EDdas")}/></div>)}
      <div className="academy-course-actions"><>{tr(course.external && !management ? <a className="button-link" href={course.external}>{tr("Aceder ao curso")}<ArrowRight size={15}/></a> : <Button variant="outline" onClick={enrollment && !management ? onContinue : onOpen}>{tr(management ? 'Gerir curso' : enrollment ? 'Continuar' : 'Ver curso')}<ArrowRight size={15}/></Button>)}{tr(onRegister && <Button variant="outline" onClick={onRegister}>{tr("Ficha de inscri\u00E7\u00E3o")}</Button>)}</></div>
    </div>
  </article>;
}
export function CategoryGrid({ courses, onSelect }: {
    courses: any[];
    onSelect: (name: string) => void;
}) {
    return <div className="academy-categories">{tr(courseCategories(courses).map((category, index) => <button className="academy-category-card" key={category.name} onClick={() => onSelect(category.name)}><span className="academy-category-number">{tr(String(index + 1).padStart(2, '0'))}</span><span><strong>{tr(category.name)}</strong><small>{tr(category.count)} {tr(category.count === 1 ? 'curso disponível' : 'cursos disponíveis')}</small></span><ArrowUpRight size={22}/></button>))}</div>;
}
export function AcademyHome({ branding, courses, enrollments, onBrowse, onNavigate, onResume, courseCard }: {
    branding?: any;
    courses: any[];
    enrollments: any[];
    certificates: any[];
    onBrowse: (query?: string, category?: string) => void;
    onNavigate: (id: string) => void;
    onResume: (enrollment: any) => void;
    courseCard: (course: any) => any;
}) {
    const [query, setQuery] = useState('');
    const published = courses.filter(c => c.status === 'publicado');
    const resume = latestEnrollment(enrollments);
    return <div className="academy-home">
    <section className="institutional-hero">
      <span className="eyebrow">{tr("INSTITUTO NACIONAL DE SA\u00DADE \u00B7 MO\u00C7AMBIQUE")}</span>
      <h1>{tr(branding?.name || 'Academia Digital')}</h1>
      <p>{tr(branding?.description || 'Formação em saúde. Aceda aos cursos e aos materiais de consulta.')}</p>
      <form className="academy-hero-search" onSubmit={e => { e.preventDefault(); onBrowse(query); }}><Search size={21} aria-hidden="true"/><label className="sr-only" htmlFor="academy-home-search">{tr("Pesquisar cursos")}</label><input id="academy-home-search" value={query} onChange={e => setQuery(e.target.value)} placeholder={tr("Pesquisar cursos")}/><Button type="submit">{tr("Pesquisar")}<ArrowRight size={17}/></Button></form>
    </section>
    {tr(resume && <section className="academy-resume"><div className="academy-resume-heading"><Play size={21}/><div><span className="eyebrow">{tr("CONTINUAR A APRENDER")}</span><h2>{tr(courseTitle(resume.c))}</h2><p>{tr(resume.done)}{tr(" de ")}{tr(resume.total)}{tr(" aulas conclu\u00EDdas")}</p></div></div><Button onClick={() => onResume(resume)}>{tr("Continuar")}<ArrowRight size={17}/></Button></section>)}
    <div className="academy-home-resources">
    <section className="academy-home-section"><div className="academy-section-heading"><h2>{tr("Cursos")}</h2><button className="text-button" onClick={() => onBrowse()}>{tr("Ver cat\u00E1logo")}<ArrowRight size={17}/></button></div><div className="course-grid">{tr(published.slice(0, 6).map(courseCard))}</div>{tr(!published.length && <p>{tr("Ainda n\u00E3o existem cursos publicados.")}</p>)}</section>
    <section className="academy-home-section"><div className="academy-section-heading"><h2>{tr("Biblioteca")}</h2><button className="text-button" onClick={() => onNavigate('biblioteca')}>{tr("Ver Biblioteca")}<ArrowRight size={17}/></button></div><EbookResource /></section>
    </div>
  </div>;
}
export function AcademyAbout({ onNavigate }: {
    onNavigate: (id: string) => void;
}) {
    return <><div className="page-heading"><div><h1>{tr("Sobre a Academia")}</h1></div></div><section className="panel academy-about"><p>{tr("A Academia Digital do Instituto Nacional de Sa\u00FAde re\u00FAne o acesso \u00E0 forma\u00E7\u00E3o em sa\u00FAde e aos conte\u00FAdos dos cursos.")}</p><Button onClick={() => onNavigate('catalogo')}>{tr("Consultar cursos")}<ArrowRight size={16}/></Button></section></>;
}
export const academyEbook = {
    title: 'Manual de Detecção e Investigação de Surtos',
    description: 'eBook · Material de consulta',
    url: 'https://insmisau.github.io/manual-surtos/',
};
export function EbookResource() {
    return <article className="academy-course-card academy-ebook-card">
    <div className="academy-course-top external-course"><span className="academy-category">{tr("Biblioteca")}</span><BookOpen size={25} strokeWidth={1.5} aria-hidden="true"/></div>
    <div className="academy-course-content">
      <div className="academy-course-type">{tr("eBook")}</div>
      <h3>{tr(academyEbook.title)}</h3>
      <p>{tr("Material de consulta")}</p>
      <div className="academy-course-actions"><a className="button-link" href={academyEbook.url} target="_blank" rel="noopener noreferrer">{tr("Consultar eBook")}<ArrowRight size={15}/></a></div>
    </div>
  </article>;
}
export function AcademyLibrary() {
    return <div className="page-heading"><div><h1>{tr("Biblioteca")}</h1><p>{tr("Manuais e materiais de apoio \u00E0 forma\u00E7\u00E3o.")}</p></div></div>;
}
