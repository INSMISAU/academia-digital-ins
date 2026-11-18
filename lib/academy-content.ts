// Versioned content in the existing summary/body fields. No database migration
// is needed, and existing text remains readable without changing any record.
export const COURSE_FORMAT = 'INS_ACADEMY_COURSE_V1\n';
export const LESSON_FORMAT = 'INS_ACADEMY_LESSON_V1\n';
export const modalities = ['Online', 'Presencial', 'Híbrido', 'Auto-aprendizagem', 'Webinar'];
export type CourseOverview = {
  summary: string; objectives: string; audience: string; prerequisites: string; modality: string;
  translations?: {en?: Partial<Record<'title'|'category'|'summary'|'objectives'|'audience'|'prerequisites',string>>};
};
export const blockLabels = {
  text: 'Texto', richtext: 'Texto formatado', notice: 'Nota / orientação', heading: 'Título de secção', list: 'Lista', image: 'Imagem',
  video: 'Vídeo', audio: 'Áudio', pdf: 'PDF', presentation: 'Apresentação', document: 'Documento', link: 'Ligação',
  formatted: 'Texto com ligações', heading2: 'Título H2', heading3: 'Título H3', heading4: 'Título H4', orderedlist: 'Lista numerada', quote: 'Citação', divider: 'Separador', table: 'Tabela', gallery: 'Galeria',
};
export type BlockType = keyof typeof blockLabels;
export type ContentBlock = {
  id: string; type: BlockType; text: string; url: string; title: string; alt: string; source: string;
};
export type LessonEnglish={title?:string;module?:string;blocks?:Record<string,Partial<Pick<ContentBlock,'text'|'title'|'alt'>>>};
export type LessonContent = {align: 'left' | 'justify'; blocks: ContentBlock[];translations?:{en?:LessonEnglish}};
const emptyOverview: CourseOverview = {summary: '', objectives: '', audience: '', prerequisites: '', modality: ''};
const string = (v: unknown) => typeof v === 'string' ? v : '';
function payload(raw: string, prefix: string): any {
  if (!raw.startsWith(prefix)) return null;
  try { return JSON.parse(raw.slice(prefix.length)); } catch { return null; }
}
export function courseOverview(raw: unknown): CourseOverview {
  const original = string(raw), data = payload(original, COURSE_FORMAT);
  if (!data || typeof data.summary !== 'string') return {...emptyOverview, summary: original};
  const result:CourseOverview={...emptyOverview,...Object.fromEntries(Object.keys(emptyOverview).map(k => [k, string(data[k])]))};
  const en=cleanEnglishOverview(data.translations?.en);if(Object.keys(en).length)result.translations={en};
  return result;
}
function cleanEnglishOverview(raw:any){const result:Record<string,string>={};for(const k of ['title','category','summary','objectives','audience','prerequisites'])if(typeof raw?.[k]==='string'&&raw[k].trim())result[k]=raw[k].trim();return result;}
export function localisedOverview(raw:unknown,language:'pt'|'en'):CourseOverview{const base=courseOverview(raw);return language==='en'?{...base,...base.translations?.en}:base;}
export function localisedCourse(course:any,language:'pt'|'en'){const en=courseOverview(course.summary).translations?.en;return language==='en'&&en?{...course,title:en.title||course.title,category:en.category||course.category}:course;}
export function encodeOverview(input: CourseOverview): string {
  const data:CourseOverview = {...emptyOverview,...Object.fromEntries(Object.keys(emptyOverview).map(k => [k, string(input[k as keyof CourseOverview]).trim()]))};
  const en=cleanEnglishOverview(input.translations?.en);if(Object.keys(en).length)data.translations={en};
  if (data.modality && !modalities.includes(data.modality)) throw Error('Seleccione uma modalidade válida.');
  const encoded = Object.entries(data).some(([key, value]) => key !== 'summary' && value) ? COURSE_FORMAT + JSON.stringify(data) : data.summary;
  if (encoded.length > 30000) throw Error('Reduza o texto da ficha: o conjunto dos campos deve caber em 30000 caracteres.');
  return encoded;
}
export function newBlock(type: BlockType, id: string): ContentBlock {
  return {id, type, text: '', url: '', title: '', alt: '', source: ''};
}
export function lessonContent(raw: unknown): LessonContent {
  const original = string(raw), data = payload(original, LESSON_FORMAT);
  if (!data || !Array.isArray(data.blocks) || !data.blocks.every((b: any) => b && Object.hasOwn(blockLabels, b.type))) {
    return {align: 'justify', blocks: [{...newBlock('text', 'legacy-text'), text: original}]};
  }
  const result:LessonContent={align: data.align === 'justify' ? 'justify' : 'left', blocks: data.blocks.map((b: any, i: number) => ({
    id: string(b.id) || 'block-' + i, type: b.type,
    text: string(b.text), url: string(b.url), title: string(b.title), alt: string(b.alt), source: string(b.source),
  }))};
  const en=cleanEnglishLesson(data.translations?.en,result.blocks);if(Object.keys(en).length)result.translations={en};return result;
}
function cleanEnglishLesson(raw:any,blocks:ContentBlock[]):LessonEnglish{
 const en:LessonEnglish={};for(const k of ['title','module'] as const)if(typeof raw?.[k]==='string'&&raw[k].trim())en[k]=raw[k].trim();
 const translated:NonNullable<LessonEnglish['blocks']>={};
 for(const block of blocks){const fields:Partial<Pick<ContentBlock,'text'|'title'|'alt'>>={};for(const key of ['text','title','alt'] as const)if(typeof raw?.blocks?.[block.id]?.[key]==='string'&&raw.blocks[block.id][key].trim())fields[key]=key==='text'&&['table','gallery'].includes(block.type)?raw.blocks[block.id][key]:raw.blocks[block.id][key].trim();if(Object.keys(fields).length)translated[block.id]=fields;}
 if(Object.keys(translated).length)en.blocks=translated;return en;
}
export function localisedLesson(raw:unknown,language:'pt'|'en'):LessonContent{const base=lessonContent(raw),en=base.translations?.en;return language==='en'&&en?{...base,blocks:base.blocks.map(b=>({...b,...en.blocks?.[b.id]}))}:base;}
export function localisedLessonRecord(lesson:any,language:'pt'|'en'){const en=lessonContent(lesson.body).translations?.en;return language==='en'&&en?{...lesson,title:en.title||lesson.title,module:en.module||lesson.module}:lesson;}
export function safeResourceUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw || /[\u0000-\u0020\u007f]/.test(raw)) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    // The existing media endpoint is reserved for administration. It is not
    // a public attachment URL and would fail for participants.
    if (/^\/api\/(administration\/|validation\/)?media\//.test(u.pathname)) return null;
    return u.href;
  } catch { return null; }
}
export function videoEmbed(raw: string): string | null {
  const safe = safeResourceUrl(raw);
  if (!safe) return null;
  const u = new URL(safe);
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(u.hostname)) {
    const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') || (/^\/(embed|shorts)\/([\w-]{11})$/.exec(u.pathname)?.[2]);
    if (id && /^[\w-]{11}$/.test(id)) return 'https://www.youtube-nocookie.com/embed/' + id;
  }
  if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(u.hostname)) {
    const id = /^\/(?:video\/)?(\d+)$/.exec(u.pathname)?.[1];
    if (id) return 'https://player.vimeo.com/video/' + id + '?dnt=1';
  }
  return null;
}
export function encodeLesson(input: LessonContent): string {
  if (!input.blocks.length || input.blocks.length > 40) throw Error('A aula deve ter entre 1 e 40 blocos.');
  const ids = new Set<string>();
  const blocks = input.blocks.map((b, i) => {
    if (!Object.hasOwn(blockLabels, b.type) || !b.id || ids.has(b.id)) throw Error('Identificação de bloco inválida.');
    ids.add(b.id);
    const clean = {...b, text: ['table','gallery'].includes(b.type)?b.text.replace(/\r\n/g,'\n'):b.text.trim(), url: b.url.trim(), title: b.title.trim(), alt: b.alt.trim(), source: b.source.trim()};
    if (b.type === 'table') {
      validateTable(clean.text);
    } else if (b.type === 'gallery') {
      validateGallery(clean.text);
    } else if (b.type === 'divider') {
      // No resource or text is required for a separator.
    } else if (['text', 'richtext', 'notice', 'heading', 'list','formatted','heading2','heading3','heading4','orderedlist','quote'].includes(b.type)) {
      if (!clean.text) throw Error('Preencha o texto do bloco ' + (i + 1) + '.');
    } else {
      if (!safeResourceUrl(clean.url)) throw Error('No bloco ' + (i + 1) + ', use uma ligação HTTPS pública, sem espaços.');
      if (!clean.title) throw Error('Identifique o material do bloco ' + (i + 1) + '.');
      if (b.type === 'image' && (!clean.alt || !clean.source)) throw Error('Indique a descrição e a fonte da imagem do bloco ' + (i + 1) + '.');
    }
    return clean;
  });
  const en=cleanEnglishLesson(input.translations?.en,blocks);
  for (const b of blocks) {const translated=en.blocks?.[b.id]?.text;if(translated && b.type==='table')validateTable(translated);if(translated && b.type==='gallery')validateGallery(translated);}
  const encoded = LESSON_FORMAT + JSON.stringify({align: input.align === 'justify' ? 'justify' : 'left', blocks,...(Object.keys(en).length?{translations:{en}}:{})});
  if (encoded.length > 20000) throw Error('Reduza o conteúdo da aula para caber em 20000 caracteres.');
  return encoded;
}
export function lessonExcerpt(raw: unknown, limit = 160,language:'pt'|'en'='pt'): string {
  const text = localisedLesson(raw,language).blocks.map(b => b.text || b.title || blockLabels[b.type]).join(' ').replace(/\s+/g, ' ').trim();
  return text.length > limit ? text.slice(0, limit) + '…' : text;
}
export function moveBlock(blocks: ContentBlock[], from: number, to: number): ContentBlock[] {
  if (from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return blocks;
  const copy = [...blocks]; const [block] = copy.splice(from, 1); copy.splice(to, 0, block); return copy;
}
export function moduleGroups(lessons: any[]): {name: string; lessons: any[]}[] {
  const groups: {name: string; lessons: any[]}[] = [];
  // Keep the server's lesson sequence, including non-contiguous module names.
  for (const lesson of lessons) {
    let last = groups[groups.length - 1];
    if (!last || last.name !== lesson.module) {last = {name: lesson.module, lessons: []}; groups.push(last);}
    last.lessons.push(lesson);
  }
  return groups;
}

export const advancedBlockTypes = ['formatted','heading2','heading3','heading4','orderedlist','quote','divider','table','gallery'];
export const tableRows = (text: string): string[][] => text.split('\n').map(row => row.split('\t'));
export function validateTable(text: string) {const rows=tableRows(text);if(rows.length<2||rows.length>20||rows[0].length<1||rows[0].length>8||rows.some(row=>row.length!==rows[0].length)||rows[0].some(cell=>!cell.trim()))throw Error('A tabela deve ter cabeçalho e dados, até 20 linhas e 8 colunas.');}
export const galleryItems = (text: string) => text ? text.split('\n').map(row=>{const [url='',alt='',source='',caption='']=row.split('\t');return {url,alt,source,caption};}) : [];
export function validateGallery(text: string) {const items=galleryItems(text);if(!items.length||items.length>12||items.some(item=>!safeResourceUrl(item.url)||!item.alt.trim()||!item.source.trim()))throw Error('Adicione até 12 imagens com ligação HTTPS, descrição e autoria.');}
export function insertFormatting(text: string,start: number,end: number,kind: 'bold'|'italic'|'link',url='') {start=Math.max(0,Math.min(text.length,start));end=Math.max(start,Math.min(text.length,end));const selected=text.slice(start,end);if(kind==='link'&&(!selected||!safeResourceUrl(url)))throw Error('Seleccione o texto e indique uma ligação HTTPS válida.');const marker=kind==='bold'?'**':'*';const inserted=kind==='link'?'['+selected.replace(/[\[\]\n]/g,' ')+']('+url.replace(/\(/g,'%28').replace(/\)/g,'%29')+')':marker+selected+marker;return {text:text.slice(0,start)+inserted+text.slice(end),start:start+(kind==='link'?1:marker.length),end:start+(kind==='link'?1:marker.length)+selected.length};}
