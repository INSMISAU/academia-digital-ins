export type ContentFilters={author:string;category:string;from:string;to:string};
export const emptyContentFilters:ContentFilters={author:'',category:'',from:'',to:''};
export function filterContent<T extends {body:any;updated:string}>(entries:T[],filter:ContentFilters):T[]{return entries.filter(e=>(!filter.author||e.body.author===filter.author)&&(!filter.category||e.body.category===filter.category)&&(!filter.from||e.updated.slice(0,10)>=filter.from)&&(!filter.to||e.updated.slice(0,10)<=filter.to));}
