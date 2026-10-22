'use client';
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
      <div className="academy-course-type">{management ? labels[course.status] : course.external ? 'Curso externo' : 'Percurso na Academia'}{course.hours > 0 && <span><Clock size={14}/>{course.hours} h</span>}</div>
      <h3>{course.title}</h3>
      <p>{course.external ? 'Conteúdos e avaliações do curso.' : course.summary}</p>
      {!course.external && <div className="academy-course-facts"><span><Layers size={15}/>{course.lessons || 0} aulas</span><span>{course.questions || 0} questões</span></div>}
      {enrollment && <div className="academy-course-progress"><div><span>{enrollment.eligible ? 'Percurso concluído' : 'Aulas concluídas'}</span><strong>{lessonPercent(enrollment)}%</strong></div><Progress value={lessonPercent(enrollment)} aria-label="Percentagem de aulas concluídas"/></div>}
      <div className="academy-course-actions"><>{course.external && !management ? <a className="button-link" href={course.external}>Aceder ao curso<ArrowRight size={15}/></a> : <Button variant="outline" onClick={enrollment && !management ? onContinue : onOpen}>{management ? 'Gerir curso' : enrollment ? 'Continuar' : 'Ver curso'}<ArrowRight size={15}/></Button>}</></div>
    </div>
  </article>;
}

export function CategoryGrid({courses, onSelect}: {courses: any[]; onSelect: (name: string) => void}) {
  return <div className="academy-categories">{courseCategories(courses).map((category, index) => <button className="academy-category-card" key={category.name} onClick={() => onSelect(category.name)}><span className="academy-category-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{category.name}</strong><small>{category.count} {category.count === 1 ? 'curso disponível' : 'cursos disponíveis'}</small></span><ArrowUpRight size={22}/></button>)}</div>;
}

export function AcademyHome({courses, enrollments, onBrowse, onResume, courseCard}: {courses: any[]; enrollments: any[]; certificates: any[]; onBrowse: (query?: string, category?: string) => void; onNavigate: (id: string) => void; onResume: (enrollment: any) => void; courseCard: (course: any) => any}) {
  const [query, setQuery] = useState('');
  const published = courses.filter(c => c.status === 'publicado');
  const resume = latestEnrollment(enrollments);
  return <div className="academy-home">
    <section className="institutional-hero">
      <span className="eyebrow">INSTITUTO NACIONAL DE SAÚDE · MOÇAMBIQUE</span>
      <h1>Academia Digital</h1>
      <p>Formação em saúde. Consulte os cursos e aceda aos conteúdos.</p>
      <form className="academy-hero-search" onSubmit={e => {e.preventDefault(); onBrowse(query);}}><Search size={21} aria-hidden="true"/><label className="sr-only" htmlFor="academy-home-search">Pesquisar cursos</label><input id="academy-home-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Pesquisar cursos"/><Button type="submit">Pesquisar<ArrowRight size={17}/></Button></form>
    </section>
    {resume && <section className="academy-resume"><div className="academy-resume-heading"><Play size={21}/><div><span className="eyebrow">CONTINUAR A APRENDER</span><h2>{resume.c.title}</h2><p>{resume.done} de {resume.total} aulas concluídas</p></div></div><Button onClick={() => onResume(resume)}>Continuar<ArrowRight size={17}/></Button></section>}
    <section className="academy-home-section"><div className="academy-section-heading"><h2>Cursos</h2><button className="text-button" onClick={() => onBrowse()}>Ver catálogo<ArrowRight size={17}/></button></div><div className="course-grid">{published.slice(0, 6).map(courseCard)}</div>{!published.length && <p>Ainda não existem cursos publicados.</p>}</section>
    {published.length > 0 && <section className="academy-home-section"><div className="academy-section-heading"><h2>Áreas de formação</h2></div><CategoryGrid courses={published} onSelect={name => onBrowse('', name)}/></section>}
  </div>;
}

export function AcademyAbout({onNavigate}: {onNavigate: (id: string) => void}) {
  return <><div className="page-heading"><div><h1>Sobre a Academia</h1></div></div><section className="panel academy-about"><p>A Academia Digital do Instituto Nacional de Saúde reúne o acesso à formação em saúde e aos conteúdos dos cursos.</p><Button onClick={() => onNavigate('catalogo')}>Consultar cursos<ArrowRight size={16}/></Button></section></>;
}
