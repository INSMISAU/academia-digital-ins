// Versioned content in the existing summary/body fields. No database migration
// is needed, and existing text remains readable without changing any record.
export const COURSE_FORMAT = 'INS_ACADEMY_COURSE_V1\n';
export const LESSON_FORMAT = 'INS_ACADEMY_LESSON_V1\n';
export const modalities = ['Online', 'Presencial', 'Híbrido', 'Auto-aprendizagem', 'Webinar'];
export type CourseOverview = {
  summary: string; objectives: string; audience: string; prerequisites: string; modality: string;
};
export const blockLabels = {
  text: 'Texto', heading: 'Título de secção', list: 'Lista', image: 'Imagem',
  video: 'Vídeo', audio: 'Áudio', pdf: 'PDF', presentation: 'Apresentação', document: 'Documento', link: 'Ligação',
};
export type BlockType = keyof typeof blockLabels;
export type ContentBlock = {
  id: string; type: BlockType; text: string; url: string; title: string; alt: string; source: string;
};
export type LessonContent = {align: 'left' | 'justify'; blocks: ContentBlock[]};
const emptyOverview: CourseOverview = {summary: '', objectives: '', audience: '', prerequisites: '', modality: ''};
const string = (v: unknown) => typeof v === 'string' ? v : '';
function payload(raw: string, prefix: string): any {
  if (!raw.startsWith(prefix)) return null;
  try { return JSON.parse(raw.slice(prefix.length)); } catch { return null; }
}
export function courseOverview(raw: unknown): CourseOverview {
  const original = string(raw), data = payload(original, COURSE_FORMAT);
  if (!data || typeof data.summary !== 'string') return {...emptyOverview, summary: original};
  return Object.fromEntries(Object.keys(emptyOverview).map(k => [k, string(data[k])])) as CourseOverview;
}
export function encodeOverview(input: CourseOverview): string {
  const data = Object.fromEntries(Object.keys(emptyOverview).map(k => [k, string(input[k as keyof CourseOverview]).trim()])) as CourseOverview;
  if (!data.summary) throw Error('Preencha o resumo do curso.');
  if (data.modality && !modalities.includes(data.modality)) throw Error('Seleccione uma modalidade válida.');
  const encoded = Object.entries(data).some(([key, value]) => key !== 'summary' && value) ? COURSE_FORMAT + JSON.stringify(data) : data.summary;
  if (encoded.length > 3000) throw Error('Reduza o texto da ficha: o conjunto dos campos deve caber em 3000 caracteres.');
  return encoded;
}
export function newBlock(type: BlockType, id: string): ContentBlock {
  return {id, type, text: '', url: '', title: '', alt: '', source: ''};
}
export function lessonContent(raw: unknown): LessonContent {
  const original = string(raw), data = payload(original, LESSON_FORMAT);
  if (!data || !Array.isArray(data.blocks) || !data.blocks.every((b: any) => b && Object.hasOwn(blockLabels, b.type))) {
    return {align: 'left', blocks: [{...newBlock('text', 'legacy-text'), text: original}]};
  }
  return {align: data.align === 'justify' ? 'justify' : 'left', blocks: data.blocks.map((b: any, i: number) => ({
    id: string(b.id) || 'block-' + i, type: b.type,
    text: string(b.text), url: string(b.url), title: string(b.title), alt: string(b.alt), source: string(b.source),
  }))};
}
export function safeResourceUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw || /[\u0000-\u0020\u007f]/.test(raw)) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    // The existing media endpoint is reserved for administration. It is not
    // a public attachment URL and would fail for participants.
    if (u.pathname.startsWith('/api/media/')) return null;
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
    const clean = {...b, text: b.text.trim(), url: b.url.trim(), title: b.title.trim(), alt: b.alt.trim(), source: b.source.trim()};
    if (['text', 'heading', 'list'].includes(b.type)) {
      if (!clean.text) throw Error('Preencha o texto do bloco ' + (i + 1) + '.');
    } else {
      if (!safeResourceUrl(clean.url)) throw Error('No bloco ' + (i + 1) + ', use uma ligação HTTPS pública, sem espaços.');
      if (!clean.title) throw Error('Identifique o material do bloco ' + (i + 1) + '.');
      if (b.type === 'image' && (!clean.alt || !clean.source)) throw Error('Indique a descrição e a fonte da imagem do bloco ' + (i + 1) + '.');
    }
    return clean;
  });
  const encoded = LESSON_FORMAT + JSON.stringify({align: input.align === 'justify' ? 'justify' : 'left', blocks});
  if (encoded.length > 20000) throw Error('Reduza o conteúdo da aula para caber em 20000 caracteres.');
  return encoded;
}
export function lessonExcerpt(raw: unknown, limit = 160): string {
  const text = lessonContent(raw).blocks.map(b => b.text || b.title || blockLabels[b.type]).join(' ').replace(/\s+/g, ' ').trim();
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
