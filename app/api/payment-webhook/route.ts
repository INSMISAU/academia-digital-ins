import {paymentWebhook} from '@/lib/academy/payments';
import {AcademyError,response} from '@/lib/academy/core';
export async function POST(req:Request){try{return response(await paymentWebhook(req));}catch(e:any){return response({error:e instanceof AcademyError?e.message:'Pedido inválido.'},e instanceof AcademyError?e.status:400);}}
