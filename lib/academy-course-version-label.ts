export function nextCourseVersion(current:string|number,bump='major'){
 const label=typeof current==='number'?current+'.0':current;
 if(!/^\d{1,6}\.\d{1,6}$/.test(label)||!['major','minor'].includes(bump))throw Error('Seleccione uma versão válida.');
 const [major,minor]=label.split('.').map(Number);return bump==='major'?(major+1)+'.0':major+'.'+(minor+1);
}
