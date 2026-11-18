'use client';
import type {ImgHTMLAttributes} from 'react';
import {academyOrigin} from '@/lib/academy-client';
import {responsiveImage} from '@/lib/academy-responsive-image';
export function AcademyImage({imageId,variants,preview,sizes='(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 480px',target=960,...props}:Omit<ImgHTMLAttributes<HTMLImageElement>,'src'|'srcSet'|'sizes'> & {imageId:string;variants?:unknown;preview?:string;sizes?:string;target?:number}){
 const url=academyOrigin+'/api/completion?image='+encodeURIComponent(imageId);
 return <img {...props} {...(preview?{src:preview}:responsiveImage(url,variants,sizes,target))} loading={props.loading||'lazy'}/>;
}
