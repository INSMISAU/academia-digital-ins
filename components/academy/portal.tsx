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
      <p>{course.external ? 'Aceda ao percurso de formação, às aulas e às avaliações na plataforma do curso.' : course.summary}</p>
      {!course.external && <div className="academy-course-facts"><span><Layers size={15}/>{course.lessons || 0} aulas</span><span>{course.questions || 0} questões</span></div>}
      {enrollment && <div className="academy-course-progress"><div><span>{enrollment.eligible ? 'Percurso concluído' : 'Aulas concluídas'}</span><strong>{lessonPercent(enrollment)}%</strong></div><Progress value={lessonPercent(enrollment)} aria-label="Percentagem de aulas concluídas"/></div>}
      <div className="academy-course-actions"><Button variant="outline" onClick={onOpen}>{management ? 'Gerir curso' : 'Conhecer o curso'}<ArrowRight size={15}/></Button>{enrollment && !management && <Button onClick={onContinue}>{enrollment.eligible ? 'Rever' : 'Continuar'}<Play size={14}/></Button>}</div>
    </div>
  </article>;
}

export function CategoryGrid({courses, onSelect}: {courses: any[]; onSelect: (name: string) => void}) {
  return <div className="academy-categories">{courseCategories(courses).map((category, index) => <button className="academy-category-card" key={category.name} onClick={() => onSelect(category.name)}><span className="academy-category-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{category.name}</strong><small>{category.count} {category.count === 1 ? 'curso disponível' : 'cursos disponíveis'}</small></span><ArrowUpRight size={22}/></button>)}</div>;
}

export function AcademyHome({courses, enrollments, certificates, onBrowse, onNavigate, onResume, courseCard}: {courses: any[]; enrollments: any[]; certificates: any[]; onBrowse: (query?: string, category?: string) => void; onNavigate: (id: string) => void; onResume: (enrollment: any) => void; courseCard: (course: any) => any}) {
  const [query, setQuery] = useState('');
  const published = courses.filter(c => c.status === 'publicado');
  const resume = latestEnrollment(enrollments);
  const categories = courseCategories(published);
  return <div className="academy-home">
    <section className="academy-hero">
      <div className="academy-hero-copy"><span className="eyebrow">INSTITUTO NACIONAL DE SAÚDE · MOÇAMBIQUE</span><h1>Um espaço para aprender.<br/><em>Um percurso para evoluir.</em></h1><p>Explore os cursos, aprofunde conhecimentos e acompanhe a sua aprendizagem na Academia Digital do INS.</p>
        <form className="academy-hero-search" onSubmit={e => {e.preventDefault(); onBrowse(query);}}><Search size={21} aria-hidden="true"/><label className="sr-only" htmlFor="academy-home-search">O que pretende aprender?</label><input id="academy-home-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="O que pretende aprender?"/><Button type="submit">Pesquisar<ArrowRight size={17}/></Button></form>
        <div className="academy-hero-links"><button onClick={() => onBrowse()}>Explorar todos os cursos<ArrowRight size={16}/></button><span>Entrada livre para experimentar</span></div>
      </div>
      <aside className="academy-hero-aside"><span className="academy-aside-label">A SUA APRENDIZAGEM</span><GraduationCap size={38} strokeWidth={1.4} aria-hidden="true"/><h2>Comece por uma nova descoberta.</h2><p>Escolha um curso e percorra as aulas ao seu ritmo.</p><div className="academy-hero-numbers"><div><strong>{String(published.length).padStart(2, '0')}</strong><span>{published.length === 1 ? 'curso no catálogo' : 'cursos no catálogo'}</span></div><div><strong>{String(categories.length).padStart(2, '0')}</strong><span>{categories.length === 1 ? 'área temática' : 'áreas temáticas'}</span></div></div></aside>
    </section>
    {resume && <section className="academy-resume"><div className="academy-resume-heading"><span className="academy-round-icon"><Play size={21}/></span><div><span className="eyebrow">CONTINUE A APRENDER</span><h2>{resume.c.title}</h2><p>{resume.done} de {resume.total} aulas concluídas</p></div></div><div className="academy-resume-progress"><span>{lessonPercent(resume)}% das aulas</span><Progress value={lessonPercent(resume)} aria-label="Aulas concluídas"/></div><Button onClick={() => onResume(resume)}>Continuar o percurso<ArrowRight size={17}/></Button></section>}
    <section className="academy-home-section"><div className="academy-section-heading"><div><span className="eyebrow">ENCONTRE A SUA FORMAÇÃO</span><h2>Explore o catálogo</h2><p>Consulte o programa e escolha por onde começar.</p></div><button className="text-button" onClick={() => onBrowse()}>Ver todos os cursos<ArrowRight size={17}/></button></div><div className="course-grid">{published.slice(0, 3).map(courseCard)}</div>{!published.length && <p>Ainda não existem cursos publicados.</p>}</section>
    <section className="academy-home-section"><div className="academy-section-heading"><div><span className="eyebrow">APRENDER POR TEMA</span><h2>Áreas de formação</h2></div><button className="text-button" onClick={() => onNavigate('categorias')}>Ver áreas<ArrowRight size={17}/></button></div><CategoryGrid courses={published} onSelect={name => onBrowse('', name)}/></section>
    <section className="academy-learning-steps"><div><span className="eyebrow">AO LONGO DO PERCURSO</span><h2>Acompanhe cada etapa.</h2><p>Da escolha do curso à consulta dos resultados.</p></div><ol><li><BookOpen size={23}/><strong>Explore e aprenda</strong><span>Consulte os conteúdos e navegue entre as aulas.</span></li><li><CheckCircle2 size={23}/><strong>Acompanhe o progresso</strong><span>Conclua actividades e consulte os resultados.</span></li><li><Award size={23}/><strong>Consulte os certificados</strong><span>Aceda aos documentos dos percursos concluídos.</span></li></ol></section>
    <div className="academy-quick-links"><button onClick={() => onNavigate('aprender')}><GraduationCap size={21}/><span>Meus cursos<small>{enrollments.length} {enrollments.length === 1 ? 'percurso iniciado' : 'percursos iniciados'}</small></span><ArrowRight size={19}/></button><button onClick={() => onNavigate('certificados')}><Award size={21}/><span>Certificados<small>{certificates.length} {certificates.length === 1 ? 'documento disponível' : 'documentos disponíveis'}</small></span><ArrowRight size={19}/></button></div>
  </div>;
}

export function AcademyAbout({onNavigate}: {onNavigate: (id: string) => void}) {
  return <><div className="page-heading"><div><span className="eyebrow">FORMAÇÃO E APRENDIZAGEM</span><h1>Sobre a Academia</h1><p>Conheça o espaço de aprendizagem do Instituto Nacional de Saúde.</p></div></div><section className="panel academy-about"><Compass size={34}/><h2>Conhecimentos que acompanham o seu percurso.</h2><p>A Academia Digital do INS reúne o acesso aos cursos e aos percursos de aprendizagem disponíveis neste espaço. Aqui pode consultar o catálogo, estudar e acompanhar as actividades que concluiu.</p><div className="academy-about-grid"><div><h3>Escolher um curso</h3><p>Consulte as áreas temáticas, o programa e as informações de cada formação.</p><Button variant="outline" onClick={() => onNavigate('catalogo')}>Abrir catálogo<ArrowRight size={16}/></Button></div><div><h3>Continuar a aprender</h3><p>Em Meus cursos, consulte o progresso e volte aos percursos que já iniciou.</p><Button variant="outline" onClick={() => onNavigate('aprender')}>Meus cursos<ArrowRight size={16}/></Button></div><div><h3>Verificar certificados</h3><p>Consulte os certificados emitidos e verifique o estado de um documento através do código.</p><Button variant="outline" onClick={() => onNavigate('certificados')}>Consultar certificados<ArrowRight size={16}/></Button></div></div></section></>;
}
