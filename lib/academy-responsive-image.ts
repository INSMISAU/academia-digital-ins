export type ImageVariant={width:number;height:number;size?:number};
export function responsiveImage(url:string,raw:unknown,sizes:string,target=960){
 const variants:ImageVariant[]=Array.isArray(raw)?raw.filter(v=>v&&Number.isSafeInteger(v.width)&&v.width>0&&v.width<=10000&&Number.isSafeInteger(v.height)&&v.height>0&&v.height<=10000).filter((v,i,a)=>a.findIndex(x=>x.width===v.width)===i).sort((a,b)=>a.width-b.width):[];
 if(!variants.length)return {src:url,decoding:'async' as const};
 const sized=(width:number)=>url+(url.includes('?')?'&':'?')+'width='+width;
 const selected=variants.find(v=>v.width>=target)||variants[variants.length-1];
 return {src:sized(selected.width),srcSet:variants.map(v=>sized(v.width)+' '+v.width+'w').join(', '),sizes,width:selected.width,height:selected.height,decoding:'async' as const};
}
