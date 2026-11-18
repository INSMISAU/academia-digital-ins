import {one} from '@/db/store';
import type {ImageVariant} from './academy-responsive-image';
export async function imageVariants(id:unknown):Promise<ImageVariant[]>{
 if(typeof id!=='string'||!id)return [];
 const row=await one('SELECT metadata FROM academy_media_details WHERE mediaId=?',id);if(!row)return [];
 try{const values=JSON.parse(row.metadata).variants;return Array.isArray(values)?values.filter(v=>v&&Number.isSafeInteger(v.width)&&v.width>0&&Number.isSafeInteger(v.height)&&v.height>0).map(v=>({width:v.width,height:v.height})):[];}catch{return [];}
}
