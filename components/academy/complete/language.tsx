'use client';
import {useEffect,useSyncExternalStore} from 'react';
import {languageFromStorage,languageKey,localeFor,translate,type AcademyLanguage} from '@/lib/academy-i18n';
import {localisedCourse,localisedOverview,localisedLesson,localisedLessonRecord} from '@/lib/academy-content';
let language:AcademyLanguage='pt',initialized=false;
const listeners=new Set<()=>void>();
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export const getLanguage=()=>language;
export const getLocale=()=>localeFor(language);
export const courseTitle=(course:any)=>localisedCourse(course,language).title;
export const courseCategory=(course:any)=>localisedCourse(course,language).category;
export const courseInfo=(raw:unknown)=>localisedOverview(raw,language);
export const lessonInfo=(raw:unknown)=>localisedLesson(raw,language);
export const lessonRecord=(lesson:any)=>localisedLessonRecord(lesson,language);
export const lessonTitle=(lesson:any)=>lessonRecord(lesson).title;
export function setLanguage(next:AcademyLanguage,persist=true){
 if(next!=='pt'&&next!=='en')return;
 const changed=language!==next;language=next;
 if(typeof document!=='undefined')document.documentElement.lang=localeFor(next);
 if(persist)try{localStorage.setItem(languageKey,next);}catch{}
 if(changed)listeners.forEach(fn=>fn());
}
export function useLanguage(){
 const selected=useSyncExternalStore(subscribe,getLanguage,()=>'pt' as AcademyLanguage);
 useEffect(()=>{
  if(!initialized){initialized=true;let saved:AcademyLanguage='pt';try{saved=languageFromStorage(localStorage);}catch{}setLanguage(saved,false);}
  const sync=(event:StorageEvent)=>{if(event.key===languageKey||event.key===null)setLanguage(event.newValue==='en'?'en':'pt',false);};
  window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
 },[]);
 return selected;
}
export function t(value:string){return translate(value,language);}
// Presentation strings only: never modify form values, IDs, sessions or API payloads.
export function tr<T>(value:T):T{if(typeof value==='string')return t(value) as T;if(Array.isArray(value))return value.map(item=>tr(item)) as T;return value;}
export function UiText({children}:{children:string}){useLanguage();return <>{t(children)}</>;}
export function LanguageSelector(){const selected=useLanguage();return <label className="academy-language"><span>{selected==='en'?'Language':'Idioma'}</span><select aria-label="Idioma / Language" value={selected} onChange={event=>setLanguage(event.target.value as AcademyLanguage)}><option value="pt" lang="pt">Português</option><option value="en" lang="en">English</option></select></label>;}
