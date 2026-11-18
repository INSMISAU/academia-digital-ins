'use client';
import {lessonTitle,lessonRecord,tr,getLocale,courseTitle,courseCategory,courseInfo} from '@/components/academy/complete/language';
import { useEffect, useState, useCallback } from 'react';
import { BookOpen, LayoutDashboard, GraduationCap, Layers, Users, FolderOpen, ClipboardCheck, BarChart3, Award, Settings2, Search, Plus, ExternalLink, Clock, CheckCircle2, FileText, Download, ShieldCheck, History, ChevronRight, Play, Library, RefreshCw, Copy, Send, Upload, AlertCircle, MapPin, Check, FlaskConical, Calendar as CalendarIcon } from 'lucide-react';
import { Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Toaster, toast } from 'sonner';
import { academyFetch, academyReadJson, academyUrl, downloadCertificate, academyRequestId, academyAdministrationUrl, academyPublicUrl, academyOrigin, academyAdministration, academyValidation, academyManagement, hasTeamAccess, setManagementInstitution, downloadMaterial } from '@/lib/academy-client';
import { CourseOverview, LessonContent, CourseProgramme, CourseNotes } from '@/components/academy/content';
import { CourseEditor, LessonEditor } from '@/components/academy/editor';
import { AcademyLibrary, AcademyHome, AcademyMenu, AcademyAbout, CategoryGrid, PublicCourseCard } from '@/components/academy/portal';
import { AdminDashboard, RecordsPanel, PublicRecords, SettingsPanel, EnrollmentPanel, ReportsPanel, CohortMembers, Announcements } from '@/components/academy/workspace';
import { AssessmentsPanel, LearningAssessments } from '@/components/academy/assessments';
import { Registration } from '@/components/academy/registration';
import { AccessSettings } from '@/components/academy/access-settings';
import { AccountPanel } from '@/components/academy/account';
import { MyLearning } from '@/components/academy/my-learning';
import { TeamGate, TeamBar } from '@/components/academy/team-access';
import { RegistrationSettings } from '@/components/academy/registration-settings';
import { finishAccess, type Method } from '@/lib/registration-client';
import { LanguageSelector, UiText, t, useLanguage } from '@/components/academy/complete/language';
import { EditorPage } from '@/components/academy/complete/common';
import { LearningExtras, Notifications, Integrations, CoursePayment, CourseTrash } from '@/components/academy/complete/learning';
import '@/components/academy/complete/complete.css';
import { CourseBuilder } from '@/components/academy/builder';
import { emptyWorkspace, courseModules, courseAssessments, type Workspace } from '@/lib/academy-workspace';
import { defaultCatalogue, publicViews, courseCategories, filterCatalogue, readCatalogueHash, catalogueHash, lessonPercent, type CatalogueFilters } from '@/lib/academy-catalogue';
const status: any = { rascunho: 'Rascunho', em_revisao: 'Em revisão', aprovado: 'Aprovado', publicado: 'Publicado', arquivado: 'Arquivado' };
const sections = [{ id: 'perfil', title: 'Meu perfil', icon: Users }, { id: 'inicio', title: 'Início', icon: LayoutDashboard }, { id: 'catalogo', title: 'Catálogo de cursos', icon: Library }, { id: 'categorias', title: 'Áreas de formação', icon: Layers }, { id: 'programas', title: 'Programas', icon: Layers }, { id: 'formadores', title: 'Formadores', icon: Users }, { id: 'biblioteca', title: 'Biblioteca', icon: Library }, { id: 'noticias', title: 'Notícias', icon: FileText }, { id: 'eventos', title: 'Eventos', icon: CalendarIcon }, { id: 'aprender', title: 'Meus cursos', icon: GraduationCap }, { id: 'certificados', title: 'Certificados', icon: Award }, { id: 'sobre', title: 'Sobre a Academia', icon: BookOpen }, { id: 'painel', title: 'Painel administrativo', icon: LayoutDashboard }, { id: 'programas-gestao', title: 'Programas', icon: Layers }, { id: 'formadores-gestao', title: 'Formadores', icon: Users }, { id: 'gestao', title: 'Cursos e conteúdos', icon: Layers }, { id: 'categorias-gestao', title: 'Categorias', icon: Library }, { id: 'revisao', title: 'Revisão editorial', icon: ClipboardCheck }, { id: 'turmas', title: 'Turmas', icon: Users }, { id: 'inscricoes', title: 'Inscrições', icon: GraduationCap }, { id: 'avaliacoes', title: 'Avaliações', icon: ClipboardCheck }, { id: 'materiais', title: 'Ficheiros e media', icon: FolderOpen }, { id: 'biblioteca-gestao', title: 'Biblioteca digital', icon: Library }, { id: 'noticias-gestao', title: 'Notícias', icon: FileText }, { id: 'eventos-gestao', title: 'Eventos', icon: CalendarIcon }, { id: 'anuncios-gestao', title: 'Anúncios', icon: Send }, { id: 'certificados-gestao', title: 'Certificados', icon: Award }, { id: 'relatorios', title: 'Relatórios e analytics', icon: BarChart3 }, { id: 'auditoria', title: 'Auditoria', icon: History }, { id: 'acessos', title: 'Permissões', icon: ShieldCheck }, { id: 'configuracoes', title: 'Configurações', icon: Settings2 }];
const date = (s: string) => new Date(s).toLocaleDateString(getLocale());
const blank = { isAdmin: false, courses: [], enrollments: [], cohorts: [], certificates: [], media: [], audit: [] } as any;
async function request(body?: any, path = '/api/academy') { if (!body)
    return academyReadJson(path); const r = await academyFetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { cache: 'no-store' }); const d: any = await r.json(); if (!r.ok)
    throw Error(d.error || 'Não foi possível concluir.'); return d; }
function Badge({ value }: {
    value: string;
}) { return <span className={'badge ' + value}>{tr(status[value] || value)}</span>; }
function Empty({ title, text }: {
    title: string;
    text: string;
}) { return <div className="empty"><FolderOpen size={32}/><h3>{tr(title)}</h3><p>{tr(text)}</p></div>; }
function Field({ label, children }: {
    label: string;
    children: any;
}) { return <label className="field"><span>{tr(label)}</span>{tr(children)}</label>; }
function Choice({ value, onChange, items }: {
    value: string;
    onChange: (v: string) => void;
    items: any[];
}) { return <Select value={value} onValueChange={onChange}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{tr(items.map(v => <SelectItem key={v.value || v} value={v.value || v}>{tr(v.label || v)}</SelectItem>))}</SelectContent></Select>; }
export default function Page() { useLanguage(); return <TeamGate><Academy /></TeamGate>; }
function Academy() {
    const language=useLanguage();
    const [registration, setRegistration] = useState<any>(null), [registrationNotice, setRegistrationNotice] = useState(''), [accessMethods, setAccessMethods] = useState<Method[]>([]);
    useEffect(() => { let active = true; if (!academyAdministration())
        academyReadJson('/api/registration', 6000).then(r => { if (active && r.open === true && r.formVersion === 2 && typeof r.notice === 'string') {
            setRegistrationNotice(r.notice);
            setAccessMethods(Array.isArray(r.providers) ? r.providers : []);
        } }).catch(() => { }); return () => { active = false; }; }, []);
    const [administration, setAdministration] = useState(false);
    const [work, setWork] = useState<Workspace>(emptyWorkspace), [cohortDetail, setCohortDetail] = useState<any>(null);
    const workRequest = useCallback((body?: any, path = '/api/workspace') => request(body, path), []);
    const [data, setData] = useState(blank), [view, setView] = useState('inicio'), [loading, setLoading] = useState(true), [error, setError] = useState(''), [busy, setBusy] = useState(false), [catalogue, setCatalogue] = useState<CatalogueFilters>(defaultCatalogue), [filter, setFilter] = useState('todos'), [enrollmentFilter, setEnrollmentFilter] = useState('todos');
    const [detail, setDetail] = useState<any>(null), [editing, setEditing] = useState(false), [courseForm, setCourseForm] = useState<any>(null), [lessonForm, setLessonForm] = useState<any>(null), [questionForm, setQuestionForm] = useState<any>(null), [enrollForm, setEnrollForm] = useState<any>(null), [cohortForm, setCohortForm] = useState<any>(null), [reviewForm, setReviewForm] = useState<any>(null), [revokeForm, setRevokeForm] = useState<any>(null);
    const [learning, setLearning] = useState<any>(null), [lessonIndex, setLessonIndex] = useState(0), [quiz, setQuiz] = useState(false), [answers, setAnswers] = useState<any>({}), [feedback, setFeedback] = useState<any>(null), [attemptKey, setAttemptKey] = useState(''), [mediaCourse, setMediaCourse] = useState(''), [reportFilter, setReportFilter] = useState('todos'), [verifyCode, setVerifyCode] = useState('');
    const load = useCallback(async () => { const [d, w] = await Promise.all([request(), request(undefined, '/api/workspace')]); setWork(w); d.courses = d.courses.map((c: any) => c.id === 'surtos' ? { ...c, title: 'Curso Básico em Investigação de Surtos' } : c); const visible = { ...d, courses: d.courses.filter((c: any) => !['orientacao', 'biosseguranca', 'dados'].includes(c.id)), enrollments: d.enrollments.filter((e: any) => e.courseId !== 'orientacao'), certificates: d.certificates.filter((c: any) => !String(c.code).startsWith('DEMO-')), audit: d.audit.filter((a: any) => !(a.action === 'Preparação' && a.entity === 'Academia')) }; setData(visible); setAdministration(academyAdministration()); setError(''); return visible; }, []);
    useEffect(() => { if (academyAdministration())
        return; let live = true; const completed = finishAccess(); if (completed)
        void completed.then(async (r) => { if (!live)
            return; if (r.error)
            toast.error(tr(r.error)); const d = await load(); if (!live)
            return; const c = d.courses.find((x: any) => x.id === r.course); if (!c) {
            navigate('perfil');
            return;
        } const status = await academyReadJson('/api/registration'); if (live && status.open && status.formVersion === 2)
            setRegistration({ course: c, notice: status.notice, providers: status.providers || [], profile: r.profile, preview: false }); }).catch(() => { if (live)
            toast.error(tr('Não foi possível reabrir a ficha.')); }); return () => { live = false; }; }, [load]);
    useEffect(() => {
        setAdministration(academyAdministration());
        const syncHash = () => { const route = readCatalogueHash(location.hash); const id = sections.some(s => s.id === route.view) ? route.view : 'inicio'; if (academyManagement() && publicViews.includes(id)) {
            location.replace((academyValidation() ? '?validacao=1&perfil=participante' : '?') + '#' + id);
            return;
        } setView(id); setCatalogue(route.filters); setFilter('todos'); if (id !== 'aprender')
            setLearning(null); };
        syncHash();
        window.addEventListener('hashchange', syncHash);
        load().catch(e => setError(e.message)).finally(() => setLoading(false));
        return () => window.removeEventListener('hashchange', syncHash);
    }, [load]);
    useEffect(() => { if (!loading && !error && data.allowedViews && !publicViews.includes(view) && !data.allowedViews.includes(view)) {
        setView('gestao');
        history.replaceState(null, '', '#gestao');
    } }, [loading, error, data.allowedViews, view]);
    useEffect(() => { if (!loading && !error && !data.isAdmin && !publicViews.includes(view)) {
        setView('catalogo');
        history.replaceState(null, '', '#catalogo');
    } }, [loading, error, data.isAdmin, view]);
    useEffect(() => { const restore = (e: PageTransitionEvent) => { if (e.persisted)
        location.reload(); }; window.addEventListener('pageshow', restore); return () => window.removeEventListener('pageshow', restore); }, []);
    useEffect(() => { document.title = t(sections.find(s => s.id === view)?.title || 'Início') + ' · ' + t('Academia Digital do INS'); }, [view, language]);
    useEffect(() => {if (!loading)document.getElementById('academy-main')?.focus({preventScroll:true});},[view,loading]);
    useEffect(() => { const settings = work.entries.find(e => e.id === 'institucional' && e.kind === 'configuracao' && e.status === 'publicado')?.body; if (!settings)
        return; document.documentElement.style.setProperty('--primary', settings.color); document.documentElement.style.setProperty('--academy-brand', settings.color); if (settings.faviconUrl) {
        let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (icon)
            icon.href = settings.faviconUrl;
    } }, [work]);
    useEffect(() => { if (learning) {
        const body = document.getElementById('academy-lesson');
        body?.focus({ preventScroll: true });
        body?.scrollIntoView({ block: 'start' });
    } }, [lessonIndex, quiz, learning?.enrollmentId]);
    function navigate(id: string) { if (academyManagement() && publicViews.includes(id)) {
        location.assign((academyValidation() ? '?validacao=1&perfil=participante' : '?') + '#' + id);
        return;
    } setView(id); location.hash = id; setLearning(null); setCatalogue(defaultCatalogue); setFilter('todos'); window.scrollTo({ top: 0 }); }
    function browse(query = '', category = 'todas') { const next = { ...defaultCatalogue, search: query.trim(), category }; setCatalogue(next); setView('catalogo'); setLearning(null); location.hash = catalogueHash(next); window.scrollTo({ top: 0 }); }
    function changeCatalogue(next: CatalogueFilters) { setCatalogue(next); if (view === 'catalogo')
        history.replaceState(null, '', catalogueHash(next)); }
    useEffect(() => { const context = (document as any).modelContext; if (!context?.registerTool)
        return; const ctl = new AbortController(); Promise.resolve(context.registerTool({ name: 'academy_list_courses', description: 'Lista os cursos e respectivos estados na Academia.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: async (input: any) => { if (Object.keys(input || {}).length)
            throw Error('Sem parâmetros.'); const d = await load(); return d.courses.map((c: any) => ({ id: c.id, title: c.title, status: c.status })); } }, { signal: ctl.signal })).catch(() => { }); return () => ctl.abort(); }, [load]);
    async function act(body: any, done?: (r: any) => void) { if (busy)
        return; setBusy(true); try {
        const r = await request(body);
        await load();
        if (detail && body.courseId === detail.course.id)
            setDetail(await request(null, '/api/academy?course=' + detail.course.id));
        toast.success(tr('Guardado no servidor'));
        await done?.(r);
    }
    catch (e: any) {
        toast.error(tr(e.message));
    }
    finally {
        setBusy(false);
    } }
    async function saveEditorial(body: any, close: () => void) {
        if (busy)
            throw Error('Aguarde a gravação em curso.');
        setBusy(true);
        try {
            const result = await request(body);
            close();
            toast.success(tr('Guardado no servidor'));
            try {
                await load();
                const courseId = body.courseId || result.id;
                if (courseId)
                    setDetail(await request(null, '/api/academy?course=' + courseId));
            }
            catch {
                toast.error(tr('O conteúdo foi guardado. Actualize a página para carregar os dados recentes.'));
            }
        }
        finally {
            setBusy(false);
        }
    }
    async function saveDraft(body: any) { const result = await request(body); await load(); const id = body.courseId || body.id; if (detail && id === detail.course.id)
        setDetail(await request(undefined, '/api/academy?course=' + id)); return result; }
    async function openCourse(c: any, edit = false) { try {
        setDetail(await request(null, '/api/academy?course=' + c.id));
        setEditing(edit || academyManagement());
    }
    catch (e: any) {
        toast.error(tr(e.message));
    } }
    async function start(e: any) { try {
        const d = await request(null, '/api/academy?course=' + e.courseId);
        setLearning({ ...d, enrollmentId: e.id });
        const done = e.progress.map((p: any) => p.lessonId);
        const last = d.lessons.findIndex((l: any) => l.id === e.lastLesson);
        const next = last >= 0 ? last : d.lessons.findIndex((l: any) => !done.includes(l.id));
        setLessonIndex(next < 0 ? 0 : next);
        setQuiz(next < 0 && !e.eligible);
        setAnswers({});
        setFeedback(null);
        setAttemptKey(academyRequestId());
        setView('aprender');
        location.hash = 'aprender';
    }
    catch (e: any) {
        toast.error(tr(e.message));
    } }
    useEffect(() => { if (!learning || quiz)
        return; const lesson = learning.lessons[lessonIndex]; if (!lesson)
        return; let active = true; request({ action: 'learning_visit', enrollmentId: learning.enrollmentId, lessonId: lesson.id }).then(() => { if (active)
        void load(); }).catch(e => { if (active)
        toast.error(tr('Não foi possível guardar o ponto de retoma: ' + e.message)); }); return () => { active = false; }; }, [learning?.enrollmentId, lessonIndex, quiz, load]);
    const courses = filterCatalogue(data.courses, catalogue, view === 'gestao' && data.isAdmin, view === 'gestao' ? filter : 'todos',language);
    const filteredEnrollments = data.enrollments.filter((e: any) => enrollmentFilter === 'todos' || (enrollmentFilter === 'concluidos' ? e.eligible : !e.eligible));
    const currentEnrollment = learning ? data.enrollments.find((e: any) => e.id === learning.enrollmentId) : null;
    const completed = data.enrollments.filter((e: any) => e.eligible).length;
    const reviewCount = data.courses.filter((c: any) => c.status === 'em_revisao').length;
    const rows = data.enrollments.filter((e: any) => reportFilter === 'todos' || e.courseId === reportFilter);
    function exportCSV() { const escape = (x: any) => '"' + String(x ?? '').replace(/^[=+@-]/, "'").replaceAll('"', '""') + '"'; const lines = [['Participante', 'Curso', 'Província', 'Aulas concluídas', 'Total', 'Melhor nota', 'Apto'], ...rows.map((e: any) => [e.participant, e.c.title, e.province, e.done, e.total, e.best ?? '', e.eligible ? 'Sim' : 'Não'])].map(r => r.map(escape).join(';')).join('\r\n'); const url = URL.createObjectURL(new Blob(['\ufeff' + lines], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'academia-relatorio.csv'; a.click(); URL.revokeObjectURL(url); }
    // Keep the approved form; submission follows the current registration status.
    function openRegistration(course: any) {
        const canSubmit = !!registrationNotice && !data.isAdmin;
        setRegistration({ course, providers: accessMethods, preview: false, unavailable: !canSubmit, notice: registrationNotice });
    }
    const courseCard = (c: any) => { const enrollment = data.enrollments.find((e: any) => e.courseId === c.id); return <PublicCourseCard key={c.id} course={c} enrollment={enrollment} onOpen={() => openCourse(c, view === 'gestao')} onContinue={() => start(enrollment)} onRegister={c.status === 'publicado' ? () => openRegistration(c) : undefined} management={data.isAdmin && ['gestao', 'revisao'].includes(view)}/>; };
    const branding = work.entries.find(e => e.id === 'institucional' && e.kind === 'configuracao')?.body;
    const panelProps = { work, data, request: workRequest, reload: load, navigate };
    const learningAssessments = learning ? courseAssessments(work, learning.course.id).filter(e => e.status === 'publicado') : [];
    return <SidebarProvider><a href="#academy-main" className="academy-skip" onClick={e => { e.preventDefault(); document.getElementById('academy-main')?.focus(); }}>{tr("Saltar para o conte\u00FAdo")}</a><Toaster richColors position="top-right"/><div className={'institutional-shell ' + (data.isAdmin && !publicViews.includes(view) ? 'is-management' : '')}><header className="institutional-header"><a className="institutional-brand" href="#inicio" onClick={() => navigate('inicio')}><img className="institutional-logo" src={branding?.logoUrl || "./logo_ins.png"} alt={tr("Instituto Nacional de Sa\u00FAde")}/><span>{tr(branding?.name || 'Academia Digital')}<small>{tr("INSTITUTO NACIONAL DE SA\u00DADE")}</small></span></a><nav aria-label={tr("Navega\u00E7\u00E3o principal")}>{tr([{ id: 'inicio', title: 'Início' }, { id: 'catalogo', title: 'Cursos' }, { id: 'programas', title: 'Programas' }, { id: 'formadores', title: 'Formadores' }, { id: 'biblioteca', title: 'Biblioteca' }, { id: 'noticias', title: 'Notícias' }, { id: 'eventos', title: 'Eventos' }, { id: 'perfil', title: 'Meu perfil' }, { id: 'certificados', title: 'Certificados' }, { id: 'sobre', title: 'Sobre a Academia' }].map(item => <a key={item.id} href={'#' + item.id} aria-current={view === item.id ? 'page' : undefined} onClick={e => { e.preventDefault(); navigate(item.id); }}>{tr(t(item.title))}</a>))}{tr(<a className="academy-admin-entry" href={academyAdministrationUrl(data.isAdmin)} target="_top" onClick={administration ? e => { e.preventDefault(); navigate('painel'); } : undefined} aria-current={data.isAdmin && !publicViews.includes(view) ? 'page' : undefined}><ShieldCheck size={16} aria-hidden="true"/>{tr("Administra\u00E7\u00E3o")}</a>)}<LanguageSelector /></nav></header><TeamBar />{tr(data.isAdmin && !publicViews.includes(view) && <nav className="institutional-management" aria-label={tr("Gest\u00E3o da Academia")}>{tr(sections.filter(s => !publicViews.includes(s.id) && (!data.allowedViews || data.allowedViews.includes(s.id))).map(item => <button key={item.id} onClick={() => navigate(item.id)} aria-current={view === item.id ? 'page' : undefined}>{tr(t(item.title))}</button>))}{tr(!administration && !academyValidation() && !hasTeamAccess() && (academyManagement() ? <a href="?">{tr("Voltar \u00E0 Academia")}</a> : <a href={academyUrl('/signout-with-chatgpt?return_to=/')}>{tr("Sair")}</a>))}</nav>)}<main className="workspace institutional-main" id="academy-main" tabIndex={-1}>{tr(data.roleManagement && data.managementInstitutions?.length > 1 && <label className="field"><span>{tr("Institui\u00E7\u00E3o para novos registos")}</span><select defaultValue="" onChange={e => setManagementInstitution(e.target.value)}><option value="">{tr("Seleccionar institui\u00E7\u00E3o")}</option>{tr(data.managementInstitutions.map((i: any) => <option key={i.id} value={i.id}>{tr(i.name)}</option>))}</select></label>)}

        {tr(loading ? <div className="empty academy-loading" role="status" aria-live="polite"><RefreshCw className="animate-spin" aria-hidden="true"/><h2>{tr("A carregar a Academia\u2026")}</h2><p>{tr("Aguarde um momento enquanto os dados s\u00E3o carregados.")}</p></div> : error ? <div className="empty academy-loading" role="alert"><AlertCircle aria-hidden="true"/><h2>{tr("N\u00E3o foi poss\u00EDvel abrir os dados")}</h2><p>{tr(error)}</p><Button onClick={() => { setLoading(true); load().catch(e => setError(e.message)).finally(() => setLoading(false)); }}>{tr("Tentar novamente")}</Button></div> : <>
        {tr(view === 'inicio' && <><Announcements work={work}/><AcademyHome branding={branding} courses={data.courses} enrollments={[]} certificates={data.certificates} onBrowse={browse} onNavigate={navigate} onResume={start} courseCard={courseCard}/></>)}
        {tr(view === 'categorias' && <><div className="page-heading"><div><span className="eyebrow">{tr("APRENDER POR TEMA")}</span><h1>{tr("\u00C1reas de forma\u00E7\u00E3o")}</h1><p>{tr("Escolha uma \u00E1rea para consultar os cursos dispon\u00EDveis.")}</p></div><Button variant="outline" onClick={() => browse()}>{tr("Ver todos os cursos")}</Button></div><CategoryGrid courses={data.courses} onSelect={name => browse('', name)}/>{tr(!courseCategories(data.courses).length && <Empty title={tr("\u00C1reas em prepara\u00E7\u00E3o")} text={tr("As \u00E1reas ser\u00E3o apresentadas com a publica\u00E7\u00E3o dos cursos.")}/>)}</>)}
        {tr(view === 'biblioteca' && <><AcademyLibrary /><PublicRecords embedded includeEbook kind="recurso" work={work} courses={data.courses} onOpen={c => openCourse(c)}/></>)}
        {tr(view === 'sobre' && (branding?.about ? <><div className="page-heading"><h1>{tr("Sobre a Academia")}</h1></div><section className="panel workspace-prose">{tr(branding.about.split(/\n\s*\n/).map((p: string, i: number) => <p key={i}>{tr(p)}</p>))}</section></> : <AcademyAbout onNavigate={navigate}/>))}
        {tr(view === 'programas' && <PublicRecords kind="programa" work={work} courses={data.courses} onOpen={c => openCourse(c)}/>)}
        {tr(view === 'formadores' && <PublicRecords kind="formador" work={work} courses={data.courses} onOpen={c => openCourse(c)}/>)}
        {tr(view === 'noticias' && <PublicRecords kind="noticia" work={work} courses={data.courses} onOpen={c => openCourse(c)}/>)}
        {tr(view === 'eventos' && <PublicRecords kind="evento" work={work} courses={data.courses} onOpen={c => openCourse(c)}/>)}
        {tr(data.isAdmin && view === 'painel' && <AdminDashboard {...panelProps}/>)}
        {tr(data.isAdmin && view === 'acessos' && <AccessSettings />)}
        {tr(data.isAdmin && view === 'configuracoes' && <><SettingsPanel {...panelProps}/><RegistrationSettings /></>)}
        {tr(data.isAdmin && view === 'inscricoes' && <EnrollmentPanel {...panelProps}/>)}
        {tr(data.isAdmin && view === 'avaliacoes' && <AssessmentsPanel {...panelProps}/>)}
        {tr(data.isAdmin && [['programas-gestao', 'programa'], ['formadores-gestao', 'formador'], ['categorias-gestao', 'categoria'], ['biblioteca-gestao', 'recurso'], ['noticias-gestao', 'noticia'], ['eventos-gestao', 'evento'], ['anuncios-gestao', 'anuncio']].map(([id, kind]) => view === id ? <RecordsPanel key={id} kind={kind as any} {...panelProps}/> : null))}
        {tr((view === 'catalogo' || (data.isAdmin && view === 'gestao')) && <><div className="page-heading"><div><span className="eyebrow">{tr(view === 'catalogo' ? 'ENCONTRE A SUA FORMAÇÃO' : 'ÁREA EDITORIAL')}</span><h1>{tr(view === 'catalogo' ? 'Catálogo de cursos' : 'Cursos e conteúdos')}</h1><p>{tr(view === 'catalogo' ? 'Pesquise por curso ou área de formação.' : 'Organize módulos, aulas e avaliações. Submeta os conteúdos a revisão antes de publicar.')}</p></div>{tr(data.isAdmin && view === 'gestao' && data.canCreateCourse !== false && <Button onClick={() => { setEditing(true); setCourseForm({ title: '', summary: '', category: '', hours: 0, pass: 80 }); }}><Plus size={17}/>{tr("Criar curso")}</Button>)}</div><section className="academy-catalogue-filters" aria-label={tr("Filtros do cat\u00E1logo")}><div className="search"><Search size={18}/><Input aria-label={tr("Pesquisar cursos")} placeholder={tr("Pesquisar por curso ou \u00E1rea\u2026")} value={catalogue.search} onChange={e => changeCatalogue({ ...catalogue, search: e.target.value })}/></div><div className="academy-filter-row"><label>{tr("\u00C1rea de forma\u00E7\u00E3o")}<select value={catalogue.category} onChange={e => changeCatalogue({ ...catalogue, category: e.target.value })}><option value="todas">{tr("Todas as \u00E1reas")}</option>{tr(Array.from(new Set(data.courses.filter((c: any) => view === 'gestao' || c.status === 'publicado').map((c: any) => c.category))).sort((a: any, b: any) => a.localeCompare(b, 'pt')).map((name: any) => <option key={name} value={name}>{tr(name)}</option>))}</select></label><label>{tr("Local do curso")}<select value={catalogue.mode} onChange={e => changeCatalogue({ ...catalogue, mode: e.target.value })}><option value="todos">{tr("Todos os cursos")}</option><option value="academia">{tr("Na Academia")}</option><option value="externo">{tr("Noutra plataforma")}</option></select></label><label>{tr("Ordenar por")}<select value={catalogue.order} onChange={e => changeCatalogue({ ...catalogue, order: e.target.value })}><option value="recentes">{tr("Actualizados recentemente")}</option><option value="titulo">{tr("T\u00EDtulo: A\u2013Z")}</option><option value="duracao">{tr("Menor carga hor\u00E1ria")}</option></select></label>{tr(data.isAdmin && view === 'gestao' && <label>{tr("Estado")}<select value={filter} onChange={e => setFilter(e.target.value)}><option value="todos">{tr("Todos os estados")}</option>{tr(Object.keys(status).map(value => <option key={value} value={value}>{tr(status[value])}</option>))}</select></label>)}</div></section><div className="academy-results"><p role="status" aria-live="polite"><strong>{tr(courses.length)}</strong> {tr(courses.length === 1 ? 'curso encontrado' : 'cursos encontrados')}{tr(catalogue.category !== 'todas' && <>{tr(" \u00B7 ")}{tr(catalogue.category)}</>)}</p>{tr((catalogue.search || catalogue.category !== 'todas' || catalogue.mode !== 'todos' || catalogue.order !== 'recentes' || filter !== 'todos') && <Button variant="ghost" onClick={() => { changeCatalogue(defaultCatalogue); setFilter('todos'); }}>{tr("Limpar filtros")}</Button>)}</div><div className="course-grid">{tr(courses.map(courseCard))}</div>{tr(!courses.length && <Empty title={tr("Nenhum curso encontrado")} text={tr("Experimente outro termo, seleccione outra \u00E1rea ou limpe os filtros.")}/>)}</>)}
        {tr(view === 'perfil' && <AccountPanel navigate={navigate} changed={async () => { setData(blank); setWork(emptyWorkspace); setLearning(null); setAnswers({}); setFeedback(null); await load(); }}/>)}
        {tr(view === 'aprender' && !learning && <MyLearning data={data} start={start} navigate={navigate} save={body => act(body)}/>)}
        {tr(view === 'aprender' && !learning && !data.isAdmin && <Notifications />)}
        {tr(view === 'configuracoes' && data.isAdmin && <><Integrations /><CourseTrash onRestore={load}/></>)}
        {tr(view === 'aprender' && learning && <><div className="page-heading"><div><button className="text-button" onClick={() => setLearning(null)}>{tr("Voltar aos meus cursos")}</button><h1>{tr(courseTitle(learning.course))}</h1><p>{tr(currentEnrollment?.done)}{tr(" de ")}{tr(currentEnrollment?.total)}{tr(" aulas conclu\u00EDdas")}</p></div></div><div className="learning-grid"><aside className="panel lesson-nav"><h3>{tr("Conte\u00FAdos do curso")}</h3><div className="academy-progress-label"><span>{tr("Aulas conclu\u00EDdas")}</span><strong>{tr(lessonPercent(currentEnrollment))}{tr("%")}</strong></div><Progress value={lessonPercent(currentEnrollment)} aria-label={tr("Percentagem de aulas conclu\u00EDdas")}/>{tr(learning.lessons.map((l: any, i: number) => <button aria-current={!quiz && lessonIndex === i ? 'step' : undefined} className={'lesson-link ' + (!quiz && lessonIndex === i ? 'selected' : '')} onClick={() => { setLessonIndex(i); setQuiz(false); }} key={l.id}><span>{tr(currentEnrollment?.progress.some((p: any) => p.lessonId === l.id) ? <CheckCircle2 size={18}/> : String(i + 1).padStart(2, '0'))}</span><div><small>{tr(lessonRecord(l).module)}</small>{tr(lessonTitle(l))}</div></button>))}<button aria-current={quiz ? 'step' : undefined} className={'lesson-link ' + (quiz ? 'selected' : '')} onClick={() => setQuiz(true)}><ClipboardCheck size={20}/><div>{tr(learningAssessments.length ? 'Pré-teste e pós-teste' : 'Avaliação final')}<small>{tr(learningAssessments.length ? 'Avaliações e histórico de respostas' : 'Nota mínima: ' + learning.course.pass + '%')}</small></div></button></aside><section className="panel lesson-body" id="academy-lesson" tabIndex={-1}>{tr(!quiz && learning.lessons[lessonIndex] ? <><span className="eyebrow">{tr("AULA ")}{tr(lessonIndex + 1)}{tr(" \u00B7 ")}{tr(lessonRecord(learning.lessons[lessonIndex]).module)}</span><h2>{tr(lessonTitle(learning.lessons[lessonIndex]))}</h2>{tr(learning.lessons[lessonIndex].locked ? <p role="status">{tr(learning.lessons[lessonIndex].locked)}</p> : <LessonContent body={learning.lessons[lessonIndex].body}/>)}<LearningExtras courseId={learning.course.id} lessonId={learning.lessons[lessonIndex].locked ? '' : learning.lessons[lessonIndex].id}/><div className="lesson-actions"><Button disabled={busy} onClick={() => act({ action: 'complete', enrollmentId: learning.enrollmentId, lessonId: learning.lessons[lessonIndex].id }, () => { if (lessonIndex < learning.lessons.length - 1)
            setLessonIndex(lessonIndex + 1);
        else
            setQuiz(true); })}><Check size={18}/>{tr(currentEnrollment?.progress.some((p: any) => p.lessonId === learning.lessons[lessonIndex].id) ? 'Concluída · continuar' : 'Concluir aula e continuar')}</Button><span className="meta">{tr("Aguarde a confirma\u00E7\u00E3o de grava\u00E7\u00E3o.")}</span></div><nav className="academy-lesson-pagination" aria-label={tr("Navega\u00E7\u00E3o entre aulas")}><Button variant="outline" disabled={lessonIndex === 0} onClick={() => setLessonIndex(lessonIndex - 1)}>{tr("Aula anterior")}</Button><span>{tr(lessonIndex + 1)}{tr(" de ")}{tr(learning.lessons.length)}</span><Button variant="outline" onClick={() => { if (lessonIndex < learning.lessons.length - 1)
            setLessonIndex(lessonIndex + 1);
        else
            setQuiz(true); }}>{tr(lessonIndex < learning.lessons.length - 1 ? 'Aula seguinte' : 'Ir à avaliação')}</Button></nav></> : learningAssessments.length ? <LearningAssessments work={work} courseId={learning.course.id} enrollmentId={learning.enrollmentId} request={workRequest} onResult={load}/> : <><span className="eyebrow">{tr("AVALIA\u00C7\u00C3O FINAL")}</span><h2>{tr("Verifique a sua aprendizagem")}</h2><p>{tr("Responda a todas as quest\u00F5es. Nota m\u00EDnima: ")}{tr(learning.course.pass)}{tr("%. As tentativas anteriores s\u00E3o preservadas.")}</p>{tr(feedback ? <><div className={'result-box ' + (feedback.score >= learning.course.pass ? 'passed' : '')}><strong>{tr(feedback.score)}{tr("%")}</strong><h3>{tr(feedback.score >= learning.course.pass ? 'Avaliação aprovada' : 'Continue a praticar')}</h3><p>{tr(currentEnrollment?.eligible ? 'Concluiu todas as aulas e atingiu a nota mínima.' : 'A conclusão do curso exige também todas as aulas concluídas.')}</p></div>{tr(feedback.feedback?.map((q: any, i: number) => <div className="feedback" key={i}><strong>{tr(q.correct ? '✓' : '×')} {tr(q.prompt)}</strong><p>{tr(q.explanation)}</p></div>))}<div className="row wrap"><Button variant="outline" onClick={() => { setFeedback(null); setAnswers({}); setAttemptKey(academyRequestId()); }}>{tr("Nova tentativa")}</Button>{tr(data.isAdmin && currentEnrollment?.eligible && <Button disabled={busy} onClick={() => act({ action: 'certificate', enrollmentId: learning.enrollmentId }, () => navigate('certificados'))}>{tr("Emitir certificado")}</Button>)}</div></> : <form onSubmit={e => { e.preventDefault(); act({ action: 'submit', enrollmentId: learning.enrollmentId, answers, requestId: attemptKey }, r => setFeedback(r)); }}>{tr(learning.questions.map((q: any, i: number) => <fieldset className="question" key={q.id}><legend>{tr(i + 1)}{tr(". ")}{tr(q.prompt)}</legend><RadioGroup value={answers[q.id] === undefined ? '' : String(answers[q.id])} onValueChange={v => setAnswers({ ...answers, [q.id]: Number(v) })}>{tr(q.options.map((o: string, j: number) => <label className="answer" key={j}><RadioGroupItem value={String(j)}/>{tr(o)}</label>))}</RadioGroup></fieldset>))}<Button type="submit" disabled={busy || Object.keys(answers).length !== learning.questions.length}>{tr("Submeter avalia\u00E7\u00E3o")}</Button></form>)}<div className="history"><h3>{tr("Hist\u00F3rico de tentativas")}</h3>{tr(currentEnrollment?.attempts.length ? currentEnrollment.attempts.map((a: any) => <p key={a.id}>{tr(date(a.created))}{tr(" \u00B7 ")}<strong>{tr(a.score)}{tr("%")}</strong></p>) : <p>{tr("Ainda n\u00E3o existem tentativas.")}</p>)}</div></>)}</section></div></>)}
        {tr(data.isAdmin && view === 'revisao' && <><div className="page-heading"><div><span className="eyebrow">{tr("QUALIDADE DOS CONTE\u00DADOS")}</span><h1>{tr("Revis\u00E3o editorial")}</h1><p>{tr("Registe a decis\u00E3o e os coment\u00E1rios. ")}</p></div></div><div className="workflow-strip">{tr(['rascunho', 'em_revisao', 'aprovado', 'publicado'].map((s, i) => <div key={s}><span>{tr("0")}{tr(i + 1)}</span>{tr(status[s])}</div>))}</div>{tr(data.courses.some((c: any) => ['em_revisao', 'aprovado'].includes(c.status)) ? <div className="course-grid">{tr(data.courses.filter((c: any) => ['em_revisao', 'aprovado'].includes(c.status)).map(courseCard))}</div> : <Empty title={tr("Nenhum curso \u00E0 espera de revis\u00E3o")} text={tr("Na \u00E1rea Cursos e conte\u00FAdos, complete um rascunho e seleccione Submeter a revis\u00E3o.")}/>)}</>)}
        {tr(data.isAdmin && view === 'turmas' && <><div className="page-heading"><div><span className="eyebrow">{tr("GEST\u00C3O DE FORMA\u00C7\u00C3O")}</span><h1>{tr("Turmas")}</h1><p>{tr("Prepare o calend\u00E1rio, a capacidade e o formador respons\u00E1vel.")}</p></div>{tr((!data.roleManagement || data.courses.some((c: any) => c.canCreateCohort)) && <Button onClick={() => setCohortForm({ courseId: data.courses.find((c: any) => !data.roleManagement || c.canCreateCohort)?.id, title: '', trainer: '', starts: '', ends: '', capacity: 25 })}><Plus size={17}/>{tr("Criar turma")}</Button>)}</div><div className="panel">{tr(data.cohorts.length ? <Table><TableHeader><TableRow>{tr(['Turma / curso', 'Formador', 'Período', 'Vagas', 'Participantes'].map(s => <TableHead key={s}>{tr(s)}</TableHead>))}</TableRow></TableHeader><TableBody>{tr(data.cohorts.map((c: any) => <TableRow key={c.id}><TableCell><strong>{tr(courseTitle(c))}</strong><small className="block">{tr(data.courses.find((v: any) => v.id === c.courseId)?.title)}</small></TableCell><TableCell>{tr(c.trainer)}</TableCell><TableCell>{tr(c.starts)}{tr(" a ")}{tr(c.ends)}</TableCell><TableCell>{tr(c.capacity)}</TableCell><TableCell><Button variant="outline" onClick={() => setCohortDetail(c)}>{tr("Gerir participantes")}</Button><Button variant="ghost" onClick={() => setCohortForm(c)}>{tr("Editar turma")}</Button></TableCell></TableRow>))}</TableBody></Table> : <Empty title={tr("Ainda n\u00E3o existem turmas")} text={tr("Crie a primeira turma para preparar o calend\u00E1rio de forma\u00E7\u00E3o.")}/>)}</div></>)}
        {tr(data.isAdmin && view === 'materiais' && <><div className="page-heading"><div><span className="eyebrow">{tr("RECURSOS DE APRENDIZAGEM")}</span><h1>{tr("Biblioteca de materiais")}</h1><p>{tr("Guarde documentos e recursos para a prepara\u00E7\u00E3o dos cursos.")}</p></div>{tr(data.roleManagement && <label className="field"><span>{tr("Curso do material")}</span><select value={mediaCourse} onChange={e => setMediaCourse(e.target.value)}><option value="">{tr("Seleccionar curso")}</option>{tr(data.courses.filter((c: any) => c.permissions?.edit).map((c: any) => <option key={c.id} value={c.id}>{tr(courseTitle(c))}</option>))}</select></label>)}<label className="upload-button"><Upload size={17}/>{tr(busy ? 'A guardar…' : 'Carregar material')}<input type="file" disabled={busy} accept=".pdf,.png,.jpg,.jpeg,.webp,.mp3,.mp4,.docx,.pptx" onChange={async (e) => { const f = e.target.files?.[0]; if (!f)
            return; setBusy(true); try {
            const fd = new FormData();
            fd.append('file', f);
            if (data.roleManagement) {
                if (!mediaCourse)
                    throw Error('Seleccione o curso do material.');
                fd.append('courseId', mediaCourse);
            }
            const r = await academyFetch('/api/media', { method: 'POST', body: fd });
            const d: any = await r.json();
            if (!r.ok)
                throw Error(d.error);
            await load();
            toast.success(tr('Material guardado'));
        }
        catch (e: any) {
            toast.error(tr(e.message));
        }
        finally {
            setBusy(false);
            e.target.value = '';
        } }}/></label></div><p className="meta">{tr("PDF, imagens, MP3, MP4, Word e PowerPoint \u00B7 at\u00E9 20 MB por ficheiro \u00B7 n\u00E3o carregar dados pessoais.")}</p>{tr(data.media.length ? <div className="materials-grid">{tr(data.media.map((m: any) => <a className="panel material" href={academyUrl('/api/media/' + m.id)} onClick={e => { e.preventDefault(); void downloadMaterial(m.id, m.name).catch(e => toast.error(tr(e.message))); }} key={m.id}><FileText size={30}/><h3>{tr(m.name)}</h3><p>{tr((m.size / 1024 / 1024).toFixed(2))}{tr(" MB \u00B7 ")}{tr(date(m.created))}</p><span className="text-button">{tr("Descarregar ")}<Download size={15}/></span></a>))}</div> : <Empty title={tr("Uma biblioteca por construir")} text={tr("Carregue os materiais de apoio aos cursos.")}/>)}</>)}
        {tr(data.isAdmin && view === 'relatorios' && <ReportsPanel {...panelProps}/>)}
        {tr((view === 'certificados' || view === 'certificados-gestao') && <><div className="page-heading"><div><span className="eyebrow">{tr("CONCLUS\u00C3O E VERIFICA\u00C7\u00C3O")}</span><h1>{tr("Certificados")}</h1><p>{tr("Consulte os seus certificados ou verifique um c\u00F3digo.")}</p></div></div><div className="panel verify-search"><ShieldCheck size={30}/><div><h3>{tr("Verificar um c\u00F3digo")}</h3><p>{tr("Introduza o c\u00F3digo que consta no certificado.")}</p></div><Input aria-label={tr("C\u00F3digo do certificado")} placeholder={tr("C\u00F3digo do certificado")} value={verifyCode} onChange={e => setVerifyCode(e.target.value)}/><Button disabled={!verifyCode.trim()} onClick={() => window.open(academyUrl('/verify/' + encodeURIComponent(verifyCode.trim())), '_blank', 'noopener')}>{tr("Verificar")}</Button></div>{tr(data.certificates.length ? <div className="enrollment-grid">{tr(data.certificates.map((c: any) => <article className="panel cert-card" key={c.id}><Award size={38}/><Badge value={c.status === 'valido' ? 'Válido' : 'Revogado'}/><h2>{tr(courseTitle(c))}</h2><p>{tr(c.participant)}</p><code>{tr(c.code)}</code><p className="meta">{tr(date(c.created))}{tr(" \u00B7 ")}{tr(c.hours)}{tr(" h \u00B7 vers\u00E3o ")}{tr(c.versionLabel||c.version)}</p><div className="row wrap"><Button onClick={() => downloadCertificate(c.id, c.code).catch(e => toast.error(tr(e.message)))}><Download size={16}/>{tr("Descarregar PDF")}</Button><Button variant="outline" onClick={() => window.open(academyUrl('/verify/' + encodeURIComponent(c.code)), '_blank', 'noopener')}>{tr("Verificar")}</Button>{tr(data.isAdmin && c.status === 'valido' && <Button variant="ghost" onClick={() => setRevokeForm({ id: c.id, reason: '' })}>{tr("Revogar")}</Button>)}</div></article>))}</div> : <Empty title={tr("Ainda n\u00E3o foram emitidos certificados")} text={tr("Os certificados emitidos ser\u00E3o apresentados aqui.")}/>)}</>)}
        {tr(data.isAdmin && view === 'auditoria' && <><div className="page-heading"><div><span className="eyebrow">{tr("RASTREABILIDADE")}</span><h1>{tr("Registo de actividade")}</h1><p>{tr("Consulte as opera\u00E7\u00F5es registadas na Academia, com a respectiva data e hora.")}</p></div></div><div className="panel"><Table><TableHeader><TableRow><TableHead>{tr("Data e hora")}</TableHead><TableHead>{tr("Opera\u00E7\u00E3o")}</TableHead><TableHead>{tr("Autor")}</TableHead><TableHead>{tr("Resultado")}</TableHead><TableHead>{tr("Detalhe")}</TableHead></TableRow></TableHeader><TableBody>{tr(data.audit.map((a: any) => <TableRow key={a.id}><TableCell className="whitespace-nowrap">{tr(new Date(a.created).toLocaleString(getLocale()))}</TableCell><TableCell>{tr(a.action)}</TableCell><TableCell>{tr(a.actor || 'Registo anterior')}</TableCell><TableCell>{tr(a.result || 'permitido')}</TableCell><TableCell>{tr(a.detail)}</TableCell></TableRow>))}</TableBody></Table></div></>)}

        </>)}
    <footer className="page-footer"><span>{tr("Academia Digital do INS \u00B7 Mo\u00E7ambique")}</span><div className="academy-footer-actions"><button className="text-button" onClick={() => navigate('sobre')}>{tr("Sobre a Academia")}</button>{tr(!academyOrigin && <a className="text-button" href="#inicio" onClick={event=>{event.preventDefault();navigate('inicio');}}>{tr("Voltar \u00E0 Academia")}</a>)}</div></footer></main></div>
    <EditorPage open={!!detail} onOpenChange={v => { if (!v)
        setDetail(null); }}><div><header><h1>{tr(detail?.course.title)}</h1><p>{tr(detail?.course.category)}{tr(" \u00B7 vers\u00E3o ")}{tr(detail?.course.versionLabel||detail?.course.version)}</p></header>{tr(detail && data.isAdmin && editing ? <CourseBuilder detail={detail} work={work} data={data} request={workRequest} reload={load} busy={busy} refreshDetail={async () => setDetail(await request(undefined, '/api/academy?course=' + detail.course.id))} editCourse={() => setCourseForm(detail.course)} editLesson={setLessonForm} addLesson={module => setLessonForm({ courseId: detail.course.id, module, title: '', body: '' })} transition={state => setReviewForm({ id: detail.course.id, status: state, comment: '' })} duplicate={(bump='major') => act({ action: 'duplicate', id: detail.course.id, bump, expectedUpdated:detail.course.updated }, async (r) => setDetail(await request(undefined, '/api/academy?course=' + r.id)))}/> : detail && <Tabs defaultValue="conteudo"><TabsList><TabsTrigger value="conteudo">{tr("Conte\u00FAdos")}</TabsTrigger>{tr(!detail.course.external && <TabsTrigger value="avaliacao">{tr("Avalia\u00E7\u00E3o")}</TabsTrigger>)}{tr(data.isAdmin && <TabsTrigger value="revisao">{tr("Revis\u00E3o e publica\u00E7\u00E3o")}</TabsTrigger>)}</TabsList><TabsContent value="conteudo"><div className="row between mt-4"><Badge value={detail.course.status}/>{tr(data.isAdmin && detail.permissions?.edit !== false && detail.course.status === 'rascunho' && <Button variant="outline" onClick={() => setCourseForm(detail.course)}>{tr("Editar dados do curso")}</Button>)}</div>{tr(detail.course.external ? <p className="description">{tr("Aceda ao programa, \u00E0s aulas e \u00E0s avalia\u00E7\u00F5es na plataforma deste curso.")}</p> : <><CourseOverview summary={detail.course.summary}/>{tr(!data.isAdmin && work.entries.find(e => e.kind === 'curso' && e.id === detail.course.id)?.body.format === 'pago' && <CoursePayment courseId={detail.course.id} price={work.entries.find(e => e.kind === 'curso' && e.id === detail.course.id)?.body.price || 0} currency={work.entries.find(e => e.kind === 'curso' && e.id === detail.course.id)?.body.currency || 'MZN'}/>)} <CourseNotes work={work} courseId={detail.course.id}/></>)}{tr(!detail.course.external && <div className="detail-facts"><span><Clock size={17}/>{tr(detail.course.hours ? detail.course.hours + ' horas' : 'Duração a definir')}</span><span><ClipboardCheck size={17}/>{tr("Nota m\u00EDnima ")}{tr(detail.course.pass)}{tr("%")}</span><span><Layers size={17}/>{tr(detail.lessons.length)}{tr(" aulas")}</span></div>)}{tr(detail.course.external ? <div className="notice"><p>{tr("O curso abre numa nova janela. O progresso e os resultados s\u00E3o consultados na plataforma desse curso.")}</p><a href={detail.course.external} target="_blank" rel="noreferrer" className="button-link">{tr("Abrir o curso ")}<ExternalLink size={16}/></a></div> : <><CourseProgramme lessons={detail.lessons} editable={data.isAdmin && detail.permissions?.edit !== false && detail.course.status === 'rascunho'} onEdit={setLessonForm} onAdd={module => setLessonForm({ courseId: detail.course.id, module, title: '', body: '' })}/>{tr(detail.course.status === 'publicado' && (!data.roleManagement || data.canManageMembers) && <Button className="mt-4" disabled={busy} onClick={() => { const id = detail.course.id; setDetail(null); if (data.isAdmin)
        setEnrollForm({ courseId: id, participant: '', province: 'Maputo Cidade' });
    else if (!data.enrollments.some((e: any) => e.courseId === id))
        openRegistration(detail.course);
    else
        act({ action: 'enroll', courseId: id }, async (r) => { const d = await request(); await start(d.enrollments.find((e: any) => e.id === r.id)); }); }}>{tr(data.isAdmin ? 'Inscrever participante' : data.enrollments.some((e: any) => e.courseId === detail.course.id) ? 'Continuar este curso' : 'Preencher ficha de inscrição')}</Button>)}</>)}</TabsContent><TabsContent value="avaliacao"><p className="description">{tr(detail.questions.length)}{tr(" quest\u00F5es \u00B7 nota m\u00EDnima ")}{tr(detail.course.pass)}{tr("%. Consulte as actividades que fazem parte da avalia\u00E7\u00E3o do curso.")}</p>{tr(detail.questions.map((q: any, i: number) => <div className="lesson-summary" key={q.id}><span>{tr(i + 1)}</span><div><strong>{tr(q.prompt)}</strong><p>{tr(q.options.join(' · '))}</p></div></div>))}{tr(data.isAdmin && detail.permissions?.edit !== false && detail.course.status === 'rascunho' && <Button onClick={() => setQuestionForm({ courseId: detail.course.id, prompt: '', optionsText: '', answer: '0', explanation: '' })}><Plus size={16}/>{tr("Adicionar quest\u00E3o")}</Button>)}</TabsContent>{tr(data.isAdmin && <TabsContent value="revisao"><div className="row wrap mt-4">{tr(({ rascunho: ['em_revisao'], em_revisao: ['rascunho', 'aprovado'], aprovado: ['publicado'], publicado: ['arquivado'], arquivado: [] } as any)[detail.course.status]?.filter((s: string) => !detail.permissions || detail.permissions.transitions.includes(s)).map((s: string) => <Button key={s} variant={s === 'rascunho' ? 'outline' : 'default'} onClick={() => setReviewForm({ id: detail.course.id, status: s, comment: '' })}>{tr(s === 'em_revisao' ? 'Submeter a revisão' : s === 'rascunho' ? 'Devolver para correcção' : s === 'aprovado' ? 'Aprovar conteúdo' : s === 'publicado' ? 'Publicar na Academia' : 'Arquivar')}</Button>))}<Button variant="outline" disabled={busy} onClick={() => act({ action: 'duplicate', id: detail.course.id }, async (r) => { setDetail(await request(null, '/api/academy?course=' + r.id)); })}><Copy size={16}/>{tr("Criar c\u00F3pia em rascunho")}</Button></div><h3 className="mt-5">{tr("Decis\u00F5es registadas")}</h3>{tr(detail.reviews.length ? detail.reviews.map((r: any) => <div className="feedback" key={r.id}><Badge value={r.decision}/><p>{tr(r.comment)}</p><small>{tr(date(r.created))}</small></div>) : <p>{tr("Ainda sem decis\u00F5es editoriais.")}</p>)}</TabsContent>)}</Tabs>)}</div></EditorPage>
    <Dialog open={!!cohortDetail} onOpenChange={v => !v && setCohortDetail(null)}><DialogContent className="dialog-wide"><DialogHeader><DialogTitle>{tr(cohortDetail?.title)}</DialogTitle><DialogDescription>{tr("Associe participantes inscritos e registe as presen\u00E7as por sess\u00E3o.")}</DialogDescription></DialogHeader>{tr(cohortDetail && <CohortMembers cohort={data.cohorts.find((c: any) => c.id === cohortDetail.id) || cohortDetail} data={data} work={work} request={workRequest} reload={load}/>)}</DialogContent></Dialog>
    <EditorPage open={!!courseForm} onOpenChange={v => !v && !busy && setCourseForm(null)}><div><header><h1>{tr(courseForm?.id ? 'Editar curso' : 'Criar curso')}</h1>{null}</header>{tr(courseForm && <CourseEditor key={courseForm.id || 'new-course'} value={courseForm} busy={busy} onAutoSave={saveDraft} onSave={body => saveEditorial(body, () => setCourseForm(null))}/>)}</div></EditorPage>
    <EditorPage open={!!lessonForm} onOpenChange={v => !v && !busy && setLessonForm(null)}><div><header><h1>{tr(lessonForm?.id ? 'Editar aula' : 'Adicionar aula')}</h1><p>{tr("Organize o conte\u00FAdo por blocos e guarde a aula antes de fechar.")}</p></header>{tr(lessonForm && <LessonEditor key={lessonForm.id || 'new-lesson'} value={lessonForm} busy={busy} resources={work.entries.filter(e => e.kind === 'recurso' && e.status === 'publicado')} modules={Array.from(new Set<string>([...(detail?.lessons || []).map((l: any) => l.module), ...courseModules(work, detail?.course.id).map(m => m.title)]))} onAutoSave={saveDraft} onSave={body => saveEditorial(body, () => setLessonForm(null))}/>)}</div></EditorPage>
    <Dialog open={!!questionForm} onOpenChange={v => !v && setQuestionForm(null)}><DialogContent><DialogHeader><DialogTitle>{tr("Adicionar quest\u00E3o")}</DialogTitle><DialogDescription>{tr("Escolha m\u00FAltipla com uma resposta correcta.")}</DialogDescription></DialogHeader>{tr(questionForm && <form className="form" onSubmit={e => { e.preventDefault(); act({ action: 'question', ...questionForm, options: questionForm.optionsText.split('\n').filter((s: string) => s.trim()), answer: Number(questionForm.answer) }, () => setQuestionForm(null)); }}><Field label={tr("Pergunta")}><Textarea required value={questionForm.prompt} onChange={e => setQuestionForm({ ...questionForm, prompt: e.target.value })}/></Field><Field label={tr("Op\u00E7\u00F5es (uma por linha, entre 2 e 6)")}><Textarea required value={questionForm.optionsText} onChange={e => setQuestionForm({ ...questionForm, optionsText: e.target.value })}/></Field><Field label={tr("Resposta correcta")}><Choice value={questionForm.answer} onChange={v => setQuestionForm({ ...questionForm, answer: v })} items={questionForm.optionsText.split('\n').filter((s: string) => s.trim()).map((s: string, i: number) => ({ value: String(i), label: (i + 1) + '. ' + s }))}/></Field><Field label={tr("Explica\u00E7\u00E3o ap\u00F3s submiss\u00E3o")}><Textarea required value={questionForm.explanation} onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}/></Field><Button type="submit" disabled={busy}>{tr("Guardar quest\u00E3o")}</Button></form>)}</DialogContent></Dialog>
    {tr(registration && <Registration course={registration.course} notice={registration.notice} preview={registration.preview} unavailable={registration.unavailable} providers={registration.providers} initialProfile={registration.profile} close={() => setRegistration(null)} onSaved={() => { void load().catch(() => { }); }}/>)}
    <Dialog open={!!enrollForm} onOpenChange={v => !v && setEnrollForm(null)}><DialogContent><DialogHeader><DialogTitle>{tr("Inscri\u00E7\u00E3o no curso")}</DialogTitle><DialogDescription>{tr("Preencha os dados do participante para efectuar a inscri\u00E7\u00E3o no curso.")}</DialogDescription></DialogHeader>{tr(enrollForm && <form className="form" onSubmit={e => { e.preventDefault(); act({ action: 'enroll', ...enrollForm, participant: enrollForm.participant }, () => { setEnrollForm(null); navigate('aprender'); }); }}><Field label={tr("Nome do participante")}><Input required maxLength={80} value={enrollForm.participant} onChange={e => setEnrollForm({ ...enrollForm, participant: e.target.value })}/></Field><Field label={tr("Prov\u00EDncia")}><Choice value={enrollForm.province} onChange={v => setEnrollForm({ ...enrollForm, province: v })} items={['Maputo Cidade', 'Maputo Província', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zambézia', 'Nampula', 'Niassa', 'Cabo Delgado']}/></Field><Button disabled={busy} type="submit">{tr("Confirmar inscri\u00E7\u00E3o")}</Button></form>)}</DialogContent></Dialog>
    <Dialog open={!!cohortForm} onOpenChange={v => !v && setCohortForm(null)}><DialogContent><DialogHeader><DialogTitle>{tr("Criar turma")}</DialogTitle><DialogDescription>{tr("Defina o curso, o per\u00EDodo e o formador respons\u00E1vel pela turma.")}</DialogDescription></DialogHeader>{tr(cohortForm && <form className="form" onSubmit={e => { e.preventDefault(); if (cohortForm.id) {
        setBusy(true);
        workRequest({ action: 'cohort_update', ...cohortForm }).then(async () => { await load(); setCohortForm(null); toast.success(tr('Turma guardada')); }).catch(e => toast.error(tr(e.message))).finally(() => setBusy(false));
    }
    else
        act({ action: 'cohort', ...cohortForm }, () => setCohortForm(null)); }}><Field label={tr("Curso")}><Choice value={cohortForm.courseId} onChange={v => setCohortForm({ ...cohortForm, courseId: v })} items={data.courses.map((c: any) => ({ value: c.id, label: c.title }))}/></Field>{tr([['title', 'Nome da turma'], ['trainer', 'Formador']].map(([k, l]) => <Field key={k} label={tr(l)}><Input required value={cohortForm[k]} onChange={e => setCohortForm({ ...cohortForm, [k]: e.target.value })}/></Field>))}<div className="form-grid">{tr([['starts', 'Data de início'], ['ends', 'Data de fim']].map(([k, l]) => <Field key={k} label={tr(l)}><Input required type="date" value={cohortForm[k]} onChange={e => setCohortForm({ ...cohortForm, [k]: e.target.value })}/></Field>))}</div><Field label={tr("Vagas")}><Input type="number" min={1} max={10000} required value={cohortForm.capacity} onChange={e => setCohortForm({ ...cohortForm, capacity: Number(e.target.value) })}/></Field><Button disabled={busy} type="submit">{tr("Guardar turma")}</Button></form>)}</DialogContent></Dialog>
    <Dialog open={!!reviewForm} onOpenChange={v => !v && setReviewForm(null)}><DialogContent><DialogHeader><DialogTitle>{tr(reviewForm ? status[reviewForm.status] : '')}</DialogTitle><DialogDescription>{tr("Registe o fundamento da decis\u00E3o editorial.")}</DialogDescription></DialogHeader>{tr(reviewForm && <form className="form" onSubmit={e => { e.preventDefault(); act({ action: 'transition', ...reviewForm }, async () => { setReviewForm(null); setDetail(await request(null, '/api/academy?course=' + reviewForm.id)); }); }}><Field label={tr("Coment\u00E1rio")}><Textarea required value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}/></Field><Button type="submit" disabled={busy}>{tr("Confirmar decis\u00E3o")}</Button></form>)}</DialogContent></Dialog>
    <Dialog open={!!revokeForm} onOpenChange={v => !v && setRevokeForm(null)}><DialogContent><DialogHeader><DialogTitle>{tr("Revogar certificado")}</DialogTitle><DialogDescription>{tr("O registo permanece no hist\u00F3rico e a verifica\u00E7\u00E3o passa a indicar Revogado.")}</DialogDescription></DialogHeader>{tr(revokeForm && <form className="form" onSubmit={e => { e.preventDefault(); act({ action: 'revoke', ...revokeForm }, () => setRevokeForm(null)); }}><Field label={tr("Motivo")}><Textarea required value={revokeForm.reason} onChange={e => setRevokeForm({ ...revokeForm, reason: e.target.value })}/></Field><Button disabled={busy} type="submit">{tr("Confirmar revoga\u00E7\u00E3o")}</Button></form>)}</DialogContent></Dialog>
    </SidebarProvider>;
}
