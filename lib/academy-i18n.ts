import english from './academy-en.json';
export type AcademyLanguage = 'pt' | 'en';
export const languageKey = 'ins-academia-language-v1';
export const localeFor = (language: AcademyLanguage) => language === 'en' ? 'en-GB' : 'pt-MZ';
// Match complete messages, never replace fragments of user-authored content.
export function translate(value: string, language: AcademyLanguage): string {
  if (language === 'pt' || !value.trim()) return value;
  const source = value.trim().replace(/\s+/g, ' '), dictionary = english as Record<string, string>;
  if (Object.hasOwn(dictionary, source)) return value.replace(value.trim(), dictionary[source]);
  const patterns: [RegExp, (...parts: string[]) => string][] = [
    [/^(\d+) de (\d+) aulas concluídas$/, (a,b) => `${a} of ${b} lessons completed`],
    [/^(\d+) (aula|aulas)$/, a => `${a} ${a === '1' ? 'lesson' : 'lessons'}`],
    [/^(\d+) (questão|questões)$/, a => `${a} ${a === '1' ? 'question' : 'questions'}`],
    [/^(\d+) (curso disponível|cursos disponíveis)$/, a => `${a} ${a === '1' ? 'course available' : 'courses available'}`],
    [/^(Subir bloco|Descer bloco|Remover bloco) (\d+)$/, (action,n) => `${dictionary[action]} ${n}`],
    [/^MÓDULO (\d+)$/, n => `MODULE ${n}`],
    [/^(Nota mínima:|Melhor nota:|Prazo:|Estado da inscrição:) (.+)$/, (label,rest)=>`${dictionary[label]} ${dictionary[rest]||rest}`],
  ];
  for (const [pattern,render] of patterns) {const match=pattern.exec(source);if(match)return render(...match.slice(1));}
  return value;
}
export function languageFromStorage(storage: Pick<Storage,'getItem'> | undefined): AcademyLanguage {
  try {return storage?.getItem(languageKey)==='en'?'en':'pt';} catch {return 'pt';}
}
