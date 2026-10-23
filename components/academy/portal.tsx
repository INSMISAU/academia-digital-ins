'use client';
import {courseOverview} from '@/lib/academy-content';
import {useState} from 'react';
import {ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Clock, GraduationCap, Layers, Search, Award, Play, Compass} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar} from '@/components/ui/sidebar';
import {courseCategories, latestEnrollment, lessonPercent} from '@/lib/academy-catalogue';

export function AcademyMenu({items, view, navigate, reviewCount = 0}: {items: any[]; view: string; navigate: (id: string) => void; reviewCount?: number}) {
  const {setOpenMobile} = useSidebar();
  return <SidebarMenu>{items.map(item => <SidebarMenuItem key={item.id}><SidebarMenuButton isActive={view === item.id} onClick={() => {navigate(item.id); setOpenMobile(false);}}><item.icon/><span>{item.title}</span>{item.id === 'revisao' && reviewCount > 0 && <span className="nav-count">{reviewCount}</span>}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>;
}

export function PublicCourseCard({course, enrollment, onOpen, onContinue, management = false}: {course: any; enrollment?: any; onOpen: () => void; onContinue: () => void; management?: boolean}) {
  const labels: any = {rascunho: 'Rascunho', em_revisao: 'Em revisão', aprovado: 'Aprovado', publicado: 'Publicado', arquivado: 'Arquivado'};
  return <article className="academy-course-card">
    <div className={'academy-course-top ' + (course.external ? 'external-course' : 'internal-course')}>
      <span className="academy-category">{course.category}</span><BookOpen size={25} strokeWidth={1.5} aria-hidden="true"/>
    </div>
    <div className="academy-course-content">
      <div className="academy-course-type">{management ? labels[course.status] : course.external ? 'Curso online' : courseOverview(course.summary).modality || 'Percurso na Academia'}{course.hours > 0 && <span><Clock size={14}/>{course.hours} h</span>}</div>
      <h3>{course.title}</h3>
      <p>{course.external ? 'Conteúdos e avaliações do curso.' : courseOverview(course.summary).summary}</p>
      {!course.external && <div className="academy-course-facts"><span><Layers size={15}/>{course.lessons || 0} aulas</span><span>{course.questions || 0} questões</span></div>}
      {enrollment && <div className="academy-course-progress"><div><span>{enrollment.eligible ? 'Percurso concluído' : 'Aulas concluídas'}</span><strong>{lessonPercent(enrollment)}%</strong></div><Progress value={lessonPercent(enrollment)} aria-label="Percentagem de aulas concluídas"/></div>}
      <div className="academy-course-actions"><>{course.external && !management ? <a className="button-link" href={course.external}>Aceder ao curso<ArrowRight size={15}/></a> : <Button variant="outline" onClick={enrollment && !management ? onContinue : onOpen}>{management ? 'Gerir curso' : enrollment ? 'Continuar' : 'Ver curso'}<ArrowRight size={15}/></Button>}</></div>
    </div>
  </article>;
}

export function CategoryGrid({courses, onSelect}: {courses: any[]; onSelect: (name: string) => void}) {
  return <div className="academy-categories">{courseCategories(courses).map((category, index) => <button className="academy-category-card" key={category.name} onClick={() => onSelect(category.name)}><span className="academy-category-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{category.name}</strong><small>{category.count} {category.count === 1 ? 'curso disponível' : 'cursos disponíveis'}</small></span><ArrowUpRight size={22}/></button>)}</div>;
}

export function AcademyHome({branding, courses, enrollments, onBrowse, onNavigate, onResume, courseCard}: {branding?: any; courses: any[]; enrollments: any[]; certificates: any[]; onBrowse: (query?: string, category?: string) => void; onNavigate: (id: string) => void; onResume: (enrollment: any) => void; courseCard: (course: any) => any}) {
  const [query, setQuery] = useState('');
  const published = courses.filter(c => c.status === 'publicado');
  const resume = latestEnrollment(enrollments);
  return <div className="academy-home">
    <section className="institutional-hero">
      <span className="eyebrow">INSTITUTO NACIONAL DE SAÚDE · MOÇAMBIQUE</span>
      <h1>{branding?.name||'Academia Digital'}</h1>
      <p>{branding?.description||'Formação em saúde. Aceda aos cursos e aos materiais de consulta.'}</p>
      <form className="academy-hero-search" onSubmit={e => {e.preventDefault(); onBrowse(query);}}><Search size={21} aria-hidden="true"/><label className="sr-only" htmlFor="academy-home-search">Pesquisar cursos</label><input id="academy-home-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Pesquisar cursos"/><Button type="submit">Pesquisar<ArrowRight size={17}/></Button></form>
    </section>
    {resume && <section className="academy-resume"><div className="academy-resume-heading"><Play size={21}/><div><span className="eyebrow">CONTINUAR A APRENDER</span><h2>{resume.c.title}</h2><p>{resume.done} de {resume.total} aulas concluídas</p></div></div><Button onClick={() => onResume(resume)}>Continuar<ArrowRight size={17}/></Button></section>}
    <div className="academy-home-resources">
    <section className="academy-home-section"><div className="academy-section-heading"><h2>Cursos</h2><button className="text-button" onClick={() => onBrowse()}>Ver catálogo<ArrowRight size={17}/></button></div><div className="course-grid">{published.slice(0, 6).map(courseCard)}</div>{!published.length && <p>Ainda não existem cursos publicados.</p>}</section>
    <section className="academy-home-section"><div className="academy-section-heading"><h2>Biblioteca</h2><button className="text-button" onClick={() => onNavigate('biblioteca')}>Ver Biblioteca<ArrowRight size={17}/></button></div><EbookResource/></section>
    </div>
  </div>;
}

export function AcademyAbout({onNavigate}: {onNavigate: (id: string) => void}) {
  return <><div className="page-heading"><div><h1>Sobre a Academia</h1></div></div><section className="panel academy-about"><p>A Academia Digital do Instituto Nacional de Saúde reúne o acesso à formação em saúde e aos conteúdos dos cursos.</p><Button onClick={() => onNavigate('catalogo')}>Consultar cursos<ArrowRight size={16}/></Button></section></>;
}

export const academyEbook = {
  title: 'Manual de Detecção e Investigação de Surtos',
  description: 'eBook · Material de consulta',
  url: 'https://insmisau.github.io/manual-surtos/',
};

export function EbookResource() {
  return <article className="academy-course-card academy-ebook-card">
    <div className="academy-course-top external-course"><span className="academy-category">Biblioteca</span><BookOpen size={25} strokeWidth={1.5} aria-hidden="true"/></div>
    <div className="academy-course-content">
      <div className="academy-course-type">eBook</div>
      <h3>{academyEbook.title}</h3>
      <p>Material de consulta</p>
      <div className="academy-course-actions"><a className="button-link" href={academyEbook.url}>Consultar eBook<ArrowRight size={15}/></a></div>
    </div>
  </article>;
}
export function AcademyLibrary() {
  return <div className="page-heading"><div><h1>Biblioteca</h1><p>Manuais e materiais de apoio à formação.</p></div></div>;
}
