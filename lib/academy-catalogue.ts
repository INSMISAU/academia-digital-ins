import {courseOverview} from './academy-content';
export type CatalogueFilters = {search: string; category: string; mode: string; order: string};
export const defaultCatalogue: CatalogueFilters = {search: '', category: 'todas', mode: 'todos', order: 'recentes'};
export const publicViews = ['inicio', 'catalogo', 'categorias', 'biblioteca', 'aprender', 'certificados', 'sobre'];
export const normaliseSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt').trim();

export function courseCategories(courses: any[]) {
  const categories = new Map<string, number>();
  for (const course of courses.filter(c => c.status === 'publicado')) {
    const category = course.category || 'Formação';
    categories.set(category, (categories.get(category) || 0) + 1);
  }
  return Array.from(categories, ([name, count]) => ({name, count})).sort((a, b) => a.name.localeCompare(b.name, 'pt'));
}

export function filterCatalogue(courses: any[], filters: CatalogueFilters, management = false, state = 'todos') {
  const query = normaliseSearch(filters.search);
  const result = courses.filter(c =>
    (management || c.status === 'publicado') &&
    (state === 'todos' || c.status === state) &&
    (filters.category === 'todas' || c.category === filters.category) &&
    (filters.mode === 'todos' || (filters.mode === 'academia' ? !c.external : !!c.external)) &&
    normaliseSearch([c.title, c.category, ...Object.values(courseOverview(c.summary))].join(' ')).includes(query)
  );
  return result.sort((a, b) => {
    if (filters.order === 'titulo') return a.title.localeCompare(b.title, 'pt');
    if (filters.order === 'duracao') return (a.hours || Infinity) - (b.hours || Infinity) || a.title.localeCompare(b.title, 'pt');
    return (Date.parse(b.updated) || 0) - (Date.parse(a.updated) || 0) || a.title.localeCompare(b.title, 'pt');
  });
}

export function readCatalogueHash(hash: string) {
  const [view = 'inicio', query = ''] = hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query);
  return {view: view || 'inicio', filters: {
    search: params.get('q') || '', category: params.get('area') || 'todas',
    mode: ['academia', 'externo'].includes(params.get('tipo') || '') ? params.get('tipo')! : 'todos',
    order: ['titulo', 'duracao'].includes(params.get('ordem') || '') ? params.get('ordem')! : 'recentes',
  }};
}

export function catalogueHash(filters: CatalogueFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.category !== 'todas') params.set('area', filters.category);
  if (filters.mode !== 'todos') params.set('tipo', filters.mode);
  if (filters.order !== 'recentes') params.set('ordem', filters.order);
  return '#catalogo' + (params.size ? '?' + params.toString() : '');
}

export function latestEnrollment(enrollments: any[]) {
  const activity = (e: any) => Math.max(0, ...[e.created, ...(e.progress || []).map((p: any) => p.completed), ...(e.attempts || []).map((a: any) => a.created)].map(s => Date.parse(s) || 0));
  return [...enrollments].filter(e => !e.eligible).sort((a, b) => activity(b) - activity(a))[0];
}

export function lessonPercent(enrollment: any) {
  return enrollment?.total ? Math.min(100, Math.round(enrollment.done / enrollment.total * 100)) : 0;
}
