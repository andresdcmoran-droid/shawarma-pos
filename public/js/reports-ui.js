/* Populate the bundled, styled workbook. All exports are generated on this device. */
(() => {
 'use strict';
 const app=window.app,proto=Object.getPrototypeOf(app),s=window.ShawarmaService,ui=window.ShawarmaPremium;
 const {esc}=ui,$=id=>document.getElementById(id),copy=x=>JSON.parse(JSON.stringify(x));
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const elements=(node,name)=>[...node.getElementsByTagNameNS(ns,name)];
 const col=i=>String.fromCharCode(65+i);
 function readArchives(){const raw=localStorage.getItem('shawarma_event_vault_archives');if(!raw)return [];const value=JSON.parse(raw);if(!Array.isArray(value))throw Error('Invalid archive');return value;}
 function xmlDocument(text){const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('Invalid workbook');return doc;}
 function put(doc,ref,value,style,formula) {
   const c=doc.createElementNS(ns,'c');c.setAttribute('r',ref);if(style)c.setAttribute('s',style);
   if(formula){const f=doc.createElementNS(ns,'f');f.textContent=formula;c.appendChild(f);const v=doc.createElementNS(ns,'v');v.textContent=String(value);c.appendChild(v);}
   else if(typeof value==='number'&&Number.isFinite(value)){const v=doc.createElementNS(ns,'v');v.textContent=String(value);c.appendChild(v);}
   else {c.setAttribute('t','inlineStr');const is=doc.createElementNS(ns,'is'),t=doc.createElementNS(ns,'t');t.setAttribute('xml:space','preserve');t.textContent=String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');is.appendChild(t);c.appendChild(is);}
   return c;
 }
 function excelDate(value){const ms=Date.parse(value);return Number.isFinite(ms)?ms/86400000+25569:'';}
 function replaceCell(doc,ref,value,formula){const old=elements(doc,'c').find(c=>c.getAttribute('r')===ref);if(old)old.parentNode.replaceChild(put(doc,ref,value,old.getAttribute('s'),formula),old);}
 async function fillSheet(zip,index,rows,options={}){
   const path=`xl/worksheets/sheet${index}.xml`,doc=xmlDocument(await zip.file(path).async('string')),data=elements(doc,'sheetData')[0];
   const row8=[...data.children].find(r=>r.getAttribute('r')==='8'),styles={};
   for(const c of row8?.children||[])styles[c.getAttribute('r').replace(/\d/g,'')]=c.getAttribute('s');
   if(index===1){for(const r of [...data.children])if(Number(r.getAttribute('r'))>=8)for(const c of [...r.children])if(/^[A-C]\d+$/.test(c.getAttribute('r')))r.removeChild(c);}
   else for(const r of [...data.children])if(Number(r.getAttribute('r'))>=8)data.removeChild(r);
   rows.forEach((values,i)=>{const n=i+8;let row=[...data.children].find(r=>r.getAttribute('r')===String(n));if(!row){row=doc.createElementNS(ns,'row');row.setAttribute('r',String(n));row.setAttribute('ht',index===2?'52':'32');row.setAttribute('customHeight','1');const next=[...data.children].find(r=>Number(r.getAttribute('r'))>n);data.insertBefore(row,next||null);}
     values.forEach((value,j)=>{const formula=options.formulas?.(i,j),cached=typeof value==='object'&&value?value.value:value;const c=put(doc,col(j)+n,cached,styles[col(j)],formula);const next=[...row.children].find(c=>c.getAttribute('r').replace(/\d/g,'')>col(j));row.insertBefore(c,next||null);});
   });
   replaceCell(doc,'A4',options.title||'');replaceCell(doc,'A5',options.subtitle||'');
   if(index===1){for(const [ref,value,formula] of options.kpis||[])replaceCell(doc,ref,value,formula);}
   if(index===2){const filter=doc.createElementNS(ns,'autoFilter');filter.setAttribute('ref',`A7:T${Math.max(8,rows.length+7)}`);const after=data.nextSibling;doc.documentElement.insertBefore(filter,after);const view=elements(doc,'sheetView')[0];if(view&&!elements(view,'pane').length){const pane=doc.createElementNS(ns,'pane');pane.setAttribute('ySplit','7');pane.setAttribute('topLeftCell','A8');pane.setAttribute('activePane','bottomLeft');pane.setAttribute('state','frozen');view.insertBefore(pane,view.firstChild||null);}}
   const dim=elements(doc,'dimension')[0];if(dim)dim.setAttribute('ref',`A1:${index===1?'G':index===2?'T':'G'}${Math.max(index===1?12:8,rows.length+7)}`);
   zip.file(path,new XMLSerializer().serializeToString(doc));
 }
 function capture(){app.recalculateCosts();return {db:copy(app.db),meta:copy(app.getServiceMeta()),costs:copy(app.lastCostBreakdown||[]),backup:app.buildSafetyBackup()};}
 async function makeWorkbook(snapshot){
   const {db,meta,costs}=snapshot,summary=s.summarize(db),rows=summary.rows,last=Math.max(8,rows.length+7),zip=await JSZip.loadAsync(window.ShawarmaWorkbookTemplate,{base64:true});
   const detail=rows.map(r=>s.cells(r).map((v,j)=>j>=15&&j<=18?excelDate(v):v));
   const title=`${meta.client||db.event_info?.name||'Evento'} · ${db.event_info?.id||''}`;
   const subtitle=`Exportado ${new Date().toLocaleString()} · Horas en UTC. Copia de consulta; recuperación completa en JSON.`;
   await fillSheet(zip,2,detail,{title,subtitle});
   const products=[...new Set(['Mixto','Pollo','Carne','Falafel',...rows.map(r=>r.protein)])],breakdown=products.flatMap(p=>['Shawarma','Bowl','Infantil'].map(f=>[p,f,rows.filter(r=>r.protein===p&&r.format===f&&r.status==='delivered').reduce((n,r)=>n+r.quantity,0)]));
   const sum=(condition)=>`SUMIF('Pedidos'!$J$8:$J$${last},"${condition}",'Pedidos'!$I$8:$I$${last})`;
   await fillSheet(zip,1,breakdown,{title,subtitle:`Invitados: ${meta.guests??'sin informar'} · Responsable: ${meta.responsible||app.operatorName||'—'} · Bowls no se suman dos veces.`,formulas:(i,j)=>j===2?`SUMIFS('Pedidos'!$I$8:$I$${last},'Pedidos'!$G$8:$G$${last},A${i+8},'Pedidos'!$H$8:$H$${last},B${i+8},'Pedidos'!$J$8:$J$${last},"Entregado")`:null,kpis:[['G8',meta.guests??'—'],['G9',summary.delivered,sum('Entregado')],['G10',summary.pending,`${sum('Por preparar')}+${sum('En preparación')}+${sum('Listo')}`],['G11',summary.cancelled,sum('Cancelado')]]});
   const raw=snapshot.backup?.financial_inputs||{},revenue=Math.max(0,Number(raw.revenue)||0),logistics=Math.max(0,Number(raw.logistics)||0),totalCost=costs.reduce((n,r)=>n+r.qty*r.unitCost,0),count=costs.length;
   const costRows=[...costs.map(r=>[r.name,r.formula,r.qty,r.unitCost,r.qty*r.unitCost]),['','','','',''],['Ingreso del evento','','','',revenue],['Logística','','','',logistics],['Total insumos','','','',totalCost],['Resultado neto','','','',revenue-logistics-totalCost]];
   await fillSheet(zip,3,costRows,{title,subtitle:'Uso interno. Configuración de este dispositivo. Si no has informado ingresos o logística, se muestran en cero.',formulas:(i,j)=>j!==4?null:i<count?`C${i+8}*D${i+8}`:i===count+3?(count?`SUM(E8:E${count+7})`:'0'):i===count+4?`E${count+9}-E${count+10}-E${count+11}`:null});
   const workbook=xmlDocument(await zip.file('xl/workbook.xml').async('string'));let calc=elements(workbook,'calcPr')[0];if(!calc){calc=workbook.createElementNS(ns,'calcPr');workbook.documentElement.appendChild(calc);}calc.setAttribute('fullCalcOnLoad','1');calc.setAttribute('forceFullCalc','1');zip.file('xl/workbook.xml',new XMLSerializer().serializeToString(workbook));
   return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
 }
 proto.exportEventExcel=async function(){if(this.serviceExportBusy)return;this.serviceExportBusy=true;try{const snap=capture(),bytes=await makeWorkbook(snap);s.download(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'Shawarma_Evento.xlsx');this.showToast(s.t('Excel generado. Comprueba el archivo en Descargas.','Excel generated. Check your Downloads.'));return true;}catch{this.showToast(s.t('No se pudo crear el Excel. Conserva el respaldo JSON.','Could not create Excel. Keep the JSON backup.'),'error');return false;}finally{this.serviceExportBusy=false;}};
 proto.downloadEventBundle=async function(){if(this.serviceExportBusy)return false;this.serviceExportBusy=true;try{const snap=capture(),xlsx=await makeWorkbook(snap),zip=new JSZip();zip.file('Shawarma_Evento.xlsx',xlsx);zip.file('Shawarma_Respaldo.json',JSON.stringify(snap.backup,null,2));zip.file('LEEME.txt','Privado: contiene nombres e información del negocio.\nExcel: consulta. JSON: recuperación y archivo.\nConserva este ZIP fuera del navegador. Su descarga no demuestra que el servidor tenga almacenamiento permanente.\n');const bytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE'});s.download(new Blob([bytes],{type:'application/zip'}),`Shawarma_Respaldo_${new Date().toISOString().replace(/[:.]/g,'-')}.zip`);this.showToast(s.t('Respaldo ZIP generado con Excel y JSON. Verifica la descarga.','ZIP backup generated with Excel and JSON. Verify the download.'));return true;}catch{this.showToast(s.t('No se pudo crear el ZIP. Descarga el JSON y no cierres el evento.','Could not create the ZIP. Download JSON and do not close the event.'),'error');return false;}finally{this.serviceExportBusy=false;}};
 function validateBackup(value){
   if(!value||value.format!=='shawarma-recovery'||value.version!==1)throw Error('Formato no reconocido');
   const events=[value.current_event,...(Array.isArray(value.archived_events)?value.archived_events.map(e=>({event_info:{id:e.id,name:e.name,created_at:e.date,timer:e.timer},orders:e.orders})):[])];
   for(const db of events){if(!db||!db.event_info||typeof db.event_info.id!=='string'||!Array.isArray(db.orders)||db.orders.length>10000)throw Error('Evento incompleto');const ids=new Set();for(const o of db.orders){if(!o||typeof o.id!=='string'||ids.has(o.id)||!Number.isSafeInteger(o.turn)||o.turn<1||!['pending','preparing','ready','delivered','cancelled'].includes(o.status))throw Error('Pedidos inválidos');ids.add(o.id);if(o.is_group&&(!Array.isArray(o.items)||!o.items.length))throw Error('Grupo incompleto');for(const item of (o.is_group?o.items:[o])){if(!item||typeof item.protein!=='string'||!Array.isArray(item.ingredients)||!item.ingredients.every(x=>typeof x==='string')||(item.quantity!=null&&(!Number.isSafeInteger(item.quantity)||item.quantity<1)))throw Error('Receta inválida');}}}
   return events;
 }
 proto.openRecoveryFile=function(){$('s-recovery-file')?.click();};
 proto.inspectRecoveryFile=async function(file){if(!file)return;try{if(file.size>20*1024*1024)throw Error('Elige un JSON menor a 20 MB');const content=JSON.parse(await file.text()),events=validateBackup(content);this.serviceRecovery={content,events};const box=$('s-recovery-preview');box.hidden=false;box.innerHTML=`<strong>${s.t('Respaldo válido · solo consulta','Valid backup · read-only')}</strong><p>${s.t('Selecciona un evento. No reemplaza ni envía pedidos al servidor.','Select an event. This does not replace or send server orders.')}</p><select id="s-recovery-event" aria-label="Evento del respaldo">${events.map((db,i)=>`<option value="${i}">${esc(db.event_info.name||db.event_info.id)} · ${db.orders.length} turnos</option>`).join('')}</select><div class="u-actions"><button class="u-button" type="button" onclick="app.archiveRecoveredEvent()">${s.t('Guardar copia en historial local','Save copy to local history')}</button></div>`;}catch(error){this.serviceRecovery=null;$('s-recovery-preview').hidden=true;this.showToast(s.t('No se abrió el respaldo. Elige el JSON original válido; no se modificaron datos.','Could not open backup. Choose a valid original JSON; no data changed.'),'error');}};
 proto.archiveRecoveredEvent=function(){const selected=this.serviceRecovery?.events[Number($('s-recovery-event')?.value)];if(!selected)return;const db=copy(selected);if(!confirm(s.t('¿Añadir una copia al historial de este dispositivo? Los pedidos activos no cambiarán.','Add a copy to this device’s history? Active orders will not change.')))return;try{const archives=readArchives(),id='recovered_'+db.event_info.id+'_'+Date.now();archives.push({id,source_event_id:db.event_info.id,name:db.event_info.name,date:db.event_info.created_at||new Date().toISOString(),orders:db.orders,timer:db.event_info.timer,total_orders:db.orders.length,operator:'Respaldo importado',service_metadata:this.serviceRecovery.content.service_metadata?.[db.event_info.id]||{},cost_config:this.serviceRecovery.content.cost_config||{}});localStorage.setItem('shawarma_event_vault_archives',JSON.stringify(archives));this.renderAdmin();this.showToast(s.t('Copia guardada en historial. No se enviaron pedidos al servidor.','Copy saved to history. No orders were sent to the server.'));}catch{this.showToast(s.t('No se pudo guardar la copia. Conserva el JSON original.','Could not save copy. Keep the original JSON.'),'error');}};
 window.ShawarmaReports={makeWorkbook,validateBackup,excelDate,capture};
})();
