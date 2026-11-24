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
 function computeCostsForDb(db,costCfg){
   const cfg=costCfg||app.costConfig||window.DEFAULT_COST_CONFIG||{};
   const getUnit=(k,def)=>{const it=cfg[k];if(!it)return def;const p=parseFloat(it.pack_price??it.unit_cost??def),q=parseFloat(it.pack_qty||1);return Number.isFinite(p)&&q>0?p/q:def;};
   const orders=(db?.orders||[]).filter(o=>o.status!=='cancelled');
   let bread=0,bowls=0,plates=0,spicy=0,carne=0,pollo=0,falSh=0,regFal=0;
   let tom=0,ceb=0,pep=0,tab=0,nab=0,hum=0,ajo=0,tah=0;
   orders.forEach(o=>{
     const list=(o.is_group&&Array.isArray(o.items)&&o.items.length)?o.items:[o];
     list.forEach(it=>{
       const q=Math.max(1,Number(it.quantity)||1);
       plates+=q;
       if(it.is_bowl||it.preset==='bowl')bowls+=q;else bread+=q;
       const rem=(it.removed_ingredients||[]).map(x=>String(x).toLowerCase());
       const inc=(it.ingredients||[]).map(x=>String(x).toLowerCase());
       const notes=String(it.notes||o.notes||'').toLowerCase();
       const isPlain=it.preset==='ninos';
       const has=(kw)=>isPlain?inc.some(x=>x.includes(kw)):!rem.some(x=>x.includes(kw));
       if(has('tomate'))tom+=q;if(has('cebolla'))ceb+=q;if(has('pepinillo'))pep+=q;if(has('tabule'))tab+=q;
       if(has('nabo'))nab+=q;if(has('hummus'))hum+=q;if(has('ajo'))ajo+=q;if(has('ajonjol')||has('tahini'))tah+=q;
       if(inc.some(x=>x.includes('picante'))||notes.includes('picante'))spicy+=q;
       const p=String(it.protein||'Mixto').toLowerCase();
       if(p.includes('falafel')||it.preset==='falafel')falSh+=q;
       else{
         if(has('falafel'))regFal+=q;
         if(p.includes('mixto')){carne+=q;pollo+=q;}
         else if(p.includes('carne'))carne+=q*2;
         else if(p.includes('pollo'))pollo+=q*2;
       }
     });
   });
   const cups=plates+spicy;
   const defs=[
     ['waxed_paper','Hojas de Papel Encerado','3 hojas por shawarma en pan',bread*3,5.65/500],
     ['plate_premium','Platos Plásticos Premium','1 por cada plato servido',plates,13.49/25],
     ['black_napkin','Servilletas Negras de Fondo','1 por plato',plates,2.50/20],
     ['sticker_logo','Stickers con Logo','1 por shawarma en pan',bread,80.00/400],
     ['cup_black','Tacitas Negras (2 oz)','1 para salsa + 1 si piden picante',cups,4.69/250],
     ['lid_black','Tapas para Tacitas Negras (2 oz)','1 por cada tacita',cups,4.50/250],
     ['spoons','Cucharitas Plásticas','1 por plato',plates,1.50/45],
     ['pita_bread','Pan Árabe Pita','1 por shawarma en pan',bread,1.75/6],
     ['falafel','Falafeles (Bolsa de 70)','1 regular + 4 en Falafel',regFal+falSh*4,18.75/70],
     ['protein_carne','Carne Sazonada','Porción carne',carne,75.00/22],
     ['protein_pollo','Pollo Sazonado','Porción pollo',pollo,20.00/22],
     ['ing_tomate','Tomate Fresco','Porción tomate',tom,0.98/5.333],
     ['ing_cebolla','Cebolla Blanca','Porción cebolla',ceb,1.50/8],
     ['ing_pepinillo','Pepinillos Encurtidos','Porción pepinillo',pep,11.00/55],
     ['ing_tabule','Ensalada Tabule','Porción tabule',tab,0.20],
     ['ing_nabo','Nabo Encurtido Rosa','Porción nabo',nab,0.15],
     ['ing_hummus','Hummus de Garbanzo','Porción hummus',hum,0.24],
     ['ing_salsa_ajo','Salsa de Ajo (Toum)','Tacita ajo',ajo,4.50/17],
     ['ing_salsa_tahini','Salsa de Ajonjolí (Tahini)','Tacita tahini',tah,4.50/17],
     ['ing_picante','Picante Especial Casero','Porción picante',spicy,0.16]
   ];
   return defs.map(([k,name,formula,qty,def])=>({name:cfg[k]?.name||name,formula:cfg[k]?.qty_formula||formula,qty,unitCost:getUnit(k,def)})).filter(x=>x.qty>0);
 }
 function buildAllReportEntries(customSnapshot){
   const entries=[];
   const seen=new Set();
   const addEntry=(id,dbObj,metaObj,costsArr,isActive)=>{
     if(!dbObj||!dbObj.event_info)return;
     const eid=String(id||dbObj.event_info.id||('evt_'+entries.length));
     if(seen.has(eid))return;
     seen.add(eid);
     const computedCosts=(Array.isArray(costsArr)&&costsArr.length)?costsArr:computeCostsForDb(dbObj);
     const snap={db:copy(dbObj),meta:copy(metaObj||{}),costs:copy(computedCosts),backup:{financial_inputs:dbObj.event_info?.finances||{}}};
     const f=extractFinances(snap);
     const ev=dbObj.event_info||{};
     const rawDate=ev.created_at||dbObj.date||new Date().toISOString();
     const dt=new Date(rawDate);
     const validDt=Number.isFinite(dt.getTime())?dt:new Date();
     const dateKey=`${validDt.getFullYear()}-${String(validDt.getMonth()+1).padStart(2,'0')}-${String(validDt.getDate()).padStart(2,'0')}`;
     const owner=(ev.owner_name||metaObj?.client||ev.name||'Evento Shawarma en Casa').trim();
     entries.push({id:eid,owner,dateKey,isoDate:validDt.toISOString(),isActive:!!isActive,units:f.realUnits,totalCost:f.totalEventCost,netProfit:f.netProfit,snapshot:snap});
   };
   if(customSnapshot&&customSnapshot.db){
     addEntry(customSnapshot.db.event_info?.id||'closed_latest',customSnapshot.db,customSnapshot.meta,customSnapshot.costs,false);
   }
   const activeSnap=capture();
   if((activeSnap.db?.orders||[]).length>0||(activeSnap.db?.event_info?.owner_name||'').trim()){
     addEntry(activeSnap.db.event_info?.id||'active_now',activeSnap.db,activeSnap.meta,activeSnap.costs,true);
   }
   const archives=typeof app.getVaultArchives==='function'?app.getVaultArchives():[];
   archives.forEach((arc,idx)=>{
     const evInfo=Object.assign({id:arc.id||`arc_${idx}`,name:arc.name||'Evento Catering',created_at:arc.date||new Date().toISOString(),timer:arc.timer||null},arc.event_info||{});
     const dbObj={event_info:evInfo,orders:Array.isArray(arc.orders)?arc.orders:[],deleted_orders:Array.isArray(arc.deleted_orders)?arc.deleted_orders:[]};
     addEntry(evInfo.id,dbObj,arc.service_metadata||{},null,false);
   });
   if(!entries.length){
     addEntry(activeSnap.db?.event_info?.id||'active_empty',activeSnap.db||{event_info:{id:'active_empty',name:'Evento actual',created_at:new Date().toISOString()},orders:[]},activeSnap.meta,activeSnap.costs,true);
   }
   entries.sort((a,b)=>Date.parse(b.isoDate)-Date.parse(a.isoDate));
   return entries;
 }
 function extractFinances(snapshot){
   const db=snapshot.db||{},costs=snapshot.costs||[],fin=db.event_info?.finances||{},raw=snapshot.backup?.financial_inputs||{};
   const orders=(db.orders||[]).filter(o=>o.status!=='cancelled');
   const realUnits=orders.reduce((s,o)=>s+(o.is_group&&Array.isArray(o.items)?o.items.reduce((a,it)=>a+Math.max(1,Number(it.quantity)||1),0):Math.max(1,Number(o.quantity)||1)),0);
   const totalUnits=Number(fin.total_units)>0?Number(fin.total_units):realUnits;
   const unitPrice=Number(fin.unit_sell_price)>0?Number(fin.unit_sell_price):23;
   const totalCost=costs.length?costs.reduce((n,r)=>n+Number(r.qty||0)*Number(r.unitCost||0),0):Math.max(0,Number(fin.total_cost)||0);
   const revShawarmas=fin.revenue_shawarmas!==undefined?Math.max(0,Number(fin.revenue_shawarmas)||0):(Math.max(0,Number(raw.revenue)||0)||totalUnits*unitPrice);
   const serviceFee=Math.max(0,Number(fin.service_fee)||0);
   const revenue=Number(fin.revenue)>0?Number(fin.revenue):(revShawarmas+serviceFee);
   const logistics=Math.max(0,Number(fin.logistics??raw.logistics)||0);
   const totalEventCost=totalCost+logistics;
   const netProfit=revenue-totalEventCost;
   const marginPct=revenue>0?((netProfit/revenue)*100):0;
   const costPerUnit=totalUnits>0?(totalCost/totalUnits):0;
   return {totalUnits,realUnits,unitPrice,revShawarmas,serviceFee,revenue,logistics,totalCost,totalEventCost,netProfit,marginPct,costPerUnit,contracted:Number(db.event_info?.contracted_qty)||0};
 }
 function makeInteractiveReportHTML(snapshot){
   const {db,meta,costs}=snapshot,summary=s.summarize(db),rows=summary.rows||[],f=extractFinances(snapshot);
   const ev=db.event_info||{},owner=(ev.owner_name||meta.client||ev.name||'Evento Shawarma en Casa').trim();
   const dateStr=new Date(ev.created_at||Date.now()).toLocaleDateString('es-ES',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
   const timerSecs=Number(ev.timer?.elapsed_seconds||0);
   const durStr=timerSecs>0?`${Math.floor(timerSecs/3600)}h ${Math.floor((timerSecs%3600)/60)}m`:'Servicio en vivo';
   const deleted=Array.isArray(db.deleted_orders)?db.deleted_orders:[];
   const protCounts={Mixto:0,Pollo:0,Carne:0,Falafel:0,Bowls:0};
   rows.filter(r=>r.status!=='cancelled').forEach(r=>{
     const q=Number(r.quantity)||1;
     if(r.format==='Bowl')protCounts.Bowls+=q;
     if(protCounts[r.protein]!==undefined)protCounts[r.protein]+=q;
   });
   const classify=(name)=>{
     const n=String(name||'').toLowerCase();
     if(/carne|pollo|pita|falafel/.test(n))return 'prot';
     if(/tomate|cebolla|pepinillo|tabule|nabo|hummus|ajo|ajonjol|tahini|picante/.test(n))return 'veg';
     if(/papel|plato|servilleta|sticker|tacita|tapa|cuchar/.test(n))return 'pack';
     return 'other';
   };
   const catMeta=[
     {id:'prot',label:'Proteínas y base',color:'#D41473'},
     {id:'veg',label:'Vegetales y salsas',color:'#F59E0B'},
     {id:'pack',label:'Empaques y presentación',color:'#06B6D4'},
     {id:'other',label:'Otros insumos',color:'#8B5CF6'}
   ];
   const grouped={prot:[],veg:[],pack:[],other:[]},catSum={prot:0,veg:0,pack:0,other:0};
   (costs||[]).forEach(c=>{const id=classify(c.name),sub=Number(c.qty||0)*Number(c.unitCost||0);grouped[id].push({...c,subtotal:sub});catSum[id]+=sub;});
   const mixSegs=catMeta.filter(c=>catSum[c.id]>0).map(c=>({...c,val:catSum[c.id],pct:f.totalCost>0?(catSum[c.id]/f.totalCost)*100:0}));
   const costRowsHTML=catMeta.map(c=>{
     const list=grouped[c.id];if(!list.length)return '';
     const cpct=f.totalCost>0?((catSum[c.id]/f.totalCost)*100).toFixed(0):'0';
     return `<tr class="cat"><td colspan="4"><i style="background:${c.color}"></i>${esc(c.label)}</td><td class="num">${cpct}%</td><td class="num">$${catSum[c.id].toFixed(2)}</td></tr>`+list.map(it=>{
       const p=f.totalCost>0?((it.subtotal/f.totalCost)*100).toFixed(1):'0.0';
       return `<tr><td>${esc(it.name)}</td><td class="dim">${esc(it.formula||'')}</td><td class="num">${it.qty}</td><td class="num dim">$${Number(it.unitCost||0).toFixed(3)}</td><td class="num dim">${p}%</td><td class="num b">$${it.subtotal.toFixed(2)}</td></tr>`;
     }).join('');
   }).join('')+`<tr class="tot"><td colspan="4">Total de insumos (${f.totalUnits} unidades)</td><td class="num">100%</td><td class="num">$${f.totalCost.toFixed(2)}</td></tr>`;
   const ordersJSON=JSON.stringify(rows.map(r=>({turn:r.turn,guest:r.guest||'Invitado',table:r.table||'',protein:r.protein||'Mixto',format:r.format||'Shawarma',qty:r.quantity||1,status:r.status,mods:r.modifications||r.recipe||'Con todo',notes:r.notes||''}))).replace(/</g,'\\u003c');
   return `<!DOCTYPE html><html lang="es" data-theme="night"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Reporte · ${esc(owner)} · SHAWARMA en casa</title>
<style>
:root{--bg:#09090B;--s1:#111114;--s2:#18181C;--bd:rgba(255,255,255,.09);--t1:#FAFAFA;--t2:#A1A1AA;--t3:#71717A;--brand:#D41473;--pos:#34D399;--neg:#F87171}
html[data-theme="day"]{--bg:#F7F7F8;--s1:#FFFFFF;--s2:#F4F4F5;--bd:rgba(9,9,11,.10);--t1:#09090B;--t2:#52525B;--t3:#71717A;--pos:#059669;--neg:#DC2626}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--t1);padding:24px 16px 60px;line-height:1.45}
.wrap{max-width:1120px;margin:0 auto;display:flex;flex-direction:column;gap:18px}
.top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding-bottom:16px;border-bottom:1px solid var(--bd)}
.eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--brand);display:block;margin-bottom:4px}
h1{font-size:26px;font-weight:700;letter-spacing:-.03em}
.sub{font-size:13px;color:var(--t2);margin-top:4px}
.acts{display:flex;gap:8px;flex-wrap:wrap}
.btn{height:36px;padding:0 14px;border-radius:8px;border:1px solid var(--bd);background:var(--s1);color:var(--t1);font-size:13px;font-weight:600;cursor:pointer}
.btn.pri{background:var(--brand);border-color:var(--brand);color:#fff}
.card{background:var(--s1);border:1px solid var(--bd);border-radius:14px;overflow:hidden}
.pnl{display:grid;grid-template-columns:300px minmax(0,1fr)}
@media(max-width:860px){.pnl{grid-template-columns:1fr}}
.params{padding:20px;background:var(--s2);border-right:1px solid var(--bd);display:flex;flex-direction:column;gap:12px}
@media(max-width:860px){.params{border-right:none;border-bottom:1px solid var(--bd)}}
.lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--t3)}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fld{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--t2)}
.inp{display:flex;align-items:center;height:38px;border:1px solid var(--bd);border-radius:8px;background:var(--s1);padding:0 10px;gap:5px}
.inp span{font-size:12px;color:var(--t3);font-weight:600}
.inp input{width:100%;border:0;background:transparent;color:var(--t1);font-size:14px;font-weight:600;outline:none;font-variant-numeric:tabular-nums}
.score{display:flex;flex-direction:column}
.heroes{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--bd)}
@media(max-width:600px){.heroes{grid-template-columns:1fr}}
.hero{padding:20px 22px;display:flex;flex-direction:column;gap:6px}
.hero+.hero{border-left:1px solid var(--bd)}
@media(max-width:600px){.hero+.hero{border-left:none;border-top:1px solid var(--bd)}}
.htop{display:flex;justify-content:space-between;align-items:center}
.htop span{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--t3)}
.pill{font-size:11.5px;font-weight:700;padding:2px 9px;border-radius:99px;background:var(--s2);border:1px solid var(--bd);font-variant-numeric:tabular-nums}
.pill.pos{color:var(--pos);border-color:rgba(16,185,129,.35)}
.pill.neg{color:var(--neg);border-color:rgba(239,68,68,.35)}
.hval{font-size:32px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.hval.pos{color:var(--pos)}.hval.neg{color:var(--neg)}
.hero small{font-size:12px;color:var(--t2);font-variant-numeric:tabular-nums}
.subs{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--bd)}
@media(max-width:600px){.subs{grid-template-columns:1fr}}
.subk{padding:14px 22px;display:flex;flex-direction:column;gap:3px}
.subk+.subk{border-left:1px solid var(--bd)}
.subk span{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--t3)}
.subk strong{font-size:18px;font-variant-numeric:tabular-nums}
.mix{padding:16px 22px;display:flex;flex-direction:column;gap:9px}
.track{display:flex;height:7px;border-radius:99px;overflow:hidden;background:var(--s2);gap:2px}
.track span{display:block;height:100%}
.leg{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--t2)}
.leg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
.leg strong{color:var(--t1)}
.strip{display:grid;grid-template-columns:repeat(6,1fr);border-bottom:1px solid var(--bd)}
@media(max-width:720px){.strip{grid-template-columns:repeat(3,1fr)}}
.st{padding:14px 16px;border-right:1px solid var(--bd);display:flex;flex-direction:column;gap:2px}
.st:last-child{border-right:none}
.st span{font-size:11px;color:var(--t3);text-transform:uppercase;font-weight:600}
.st strong{font-size:20px;font-variant-numeric:tabular-nums}
.headbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:16px 20px;border-bottom:1px solid var(--bd)}
.headbar h2{font-size:15px;font-weight:700}
.tscroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th{padding:10px 16px;text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);background:var(--s2);border-bottom:1px solid var(--bd);white-space:nowrap}
td{padding:10px 16px;border-bottom:1px solid var(--bd);font-variant-numeric:tabular-nums}
th.num,td.num{text-align:right}
td.dim{color:var(--t2);font-size:12px}
td.b{font-weight:600}
tr.cat td{background:var(--s2);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--t2)}
tr.cat i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px;vertical-align:middle}
tr.tot td{background:var(--s2);font-weight:700;border-top:2px solid var(--bd);border-bottom:none;padding:13px 16px}
.search{height:34px;padding:0 12px;border-radius:8px;border:1px solid var(--bd);background:var(--s2);color:var(--t1);font-size:13px;min-width:220px;outline:none}
.tag{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;background:var(--s2);border:1px solid var(--bd)}
.tag.delivered{color:var(--pos);border-color:rgba(16,185,129,.35)}
@media print{.no-print{display:none!important}body{background:#fff;color:#000;padding:0}.card{border-color:#ddd}}
</style></head><body><div class="wrap">
<header class="top">
  <div><span class="eyebrow">SHAWARMA en casa · Reporte Interactivo del Evento</span><h1>${esc(owner)}</h1><p class="sub">${esc(dateStr)} · Duración: ${esc(durStr)} · ${f.realUnits} unidades servidas${f.contracted>0?` de ${f.contracted} contratadas`:''}</p></div>
  <div class="acts no-print"><button class="btn" onclick="document.documentElement.dataset.theme=document.documentElement.dataset.theme==='day'?'night':'day'">☀ / 🌙 Tema</button><button class="btn pri" onclick="window.print()">Imprimir / Guardar PDF</button></div>
</header>

<section class="card">
  <div class="pnl">
    <div class="params">
      <div class="lbl">Parámetros financieros (editables)</div>
      <div class="row2">
        <label class="fld">Unidades<div class="inp"><input id="r-uds" type="number" min="1" value="${f.totalUnits}" oninput="recalc()"><span>uds</span></div></label>
        <label class="fld">Precio / ud<div class="inp"><span>$</span><input id="r-px" type="number" step="0.5" min="0" value="${f.unitPrice}" oninput="recalc()"></div></label>
      </div>
      <div class="row2">
        <label class="fld">Servicio adicional<div class="inp"><span>$</span><input id="r-svc" type="number" step="0.01" min="0" value="${f.serviceFee.toFixed(2)}" oninput="recalc()"></div></label>
        <label class="fld">Logística / gastos<div class="inp"><span>$</span><input id="r-log" type="number" step="0.01" min="0" value="${f.logistics.toFixed(2)}" oninput="recalc()"></div></label>
      </div>
      <p class="sub" style="font-size:11.5px">Puedes ajustar precios o gastos aquí para simular escenarios sin alterar el respaldo original.</p>
    </div>
    <div class="score">
      <div class="heroes">
        <div class="hero"><div class="htop"><span>Ganancia neta</span><span id="r-mgn" class="pill">${f.marginPct.toFixed(1)}%</span></div><strong id="r-net" class="hval">$${f.netProfit.toFixed(2)}</strong><small id="r-rev-sub">Sobre $${f.revenue.toFixed(2)} cobrados</small></div>
        <div class="hero"><div class="htop"><span>Costo evento + logística</span></div><strong id="r-totc" class="hval">$${f.totalEventCost.toFixed(2)}</strong><small id="r-cost-sub">${f.totalUnits} uds ($${f.totalCost.toFixed(2)} insumos + $${f.logistics.toFixed(2)} logística)</small></div>
      </div>
      <div class="subs">
        <div class="subk"><span>Costo / unidad</span><strong id="r-cu">$${f.costPerUnit.toFixed(2)}</strong></div>
        <div class="subk"><span id="r-sh-lbl">Costo shawarmas (${f.totalUnits} uds)</span><strong>$${f.totalCost.toFixed(2)}</strong></div>
        <div class="subk"><span>Punto de equilibrio</span><strong id="r-be">—</strong></div>
      </div>
      <div class="mix"><div class="track">${mixSegs.map(x=>`<span style="width:${x.pct.toFixed(1)}%;background:${x.color}"></span>`).join('')}</div><div class="leg">${mixSegs.map(x=>`<span><i style="background:${x.color}"></i>${esc(x.label)} <strong>${x.pct.toFixed(0)}%</strong> ($${x.val.toFixed(2)})</span>`).join('')}</div></div>
    </div>
  </div>
</section>

<section class="card">
  <div class="strip">
    <div class="st"><span>Unidades</span><strong>${f.realUnits}</strong></div>
    <div class="st"><span>Mixto</span><strong>${protCounts.Mixto}</strong></div>
    <div class="st"><span>Pollo</span><strong>${protCounts.Pollo}</strong></div>
    <div class="st"><span>Carne</span><strong>${protCounts.Carne}</strong></div>
    <div class="st"><span>Falafel</span><strong>${protCounts.Falafel}</strong></div>
    <div class="st"><span>Bowls / Elim.</span><strong>${protCounts.Bowls} / ${deleted.length}</strong></div>
  </div>
</section>

<section class="card">
  <div class="headbar"><h2>Desglose completo de insumos y gastos</h2><span class="sub">Total insumos: $${f.totalCost.toFixed(2)}</span></div>
  <div class="tscroll"><table><thead><tr><th>Insumo</th><th>Fórmula</th><th class="num">Cant.</th><th class="num">Unitario</th><th class="num">% Costo</th><th class="num">Subtotal</th></tr></thead><tbody>${costRowsHTML}</tbody></table></div>
</section>

<section class="card">
  <div class="headbar"><h2>Comandas del evento (${rows.length})</h2><input id="r-q" class="search no-print" placeholder="Buscar invitado, turno o proteína…" oninput="renderOrders()"></div>
  <div class="tscroll"><table><thead><tr><th>Turno</th><th>Invitado</th><th>Producto</th><th>Detalle / Modificaciones</th><th>Estado</th></tr></thead><tbody id="r-orders"></tbody></table></div>
</section>
</div>
<script>
const BASE_COST=${f.totalCost.toFixed(4)},ORDERS=${ordersJSON};
function recalc(){
  const u=Math.max(1,Number(document.getElementById('r-uds').value)||1);
  const px=Math.max(0,Number(document.getElementById('r-px').value)||0);
  const svc=Math.max(0,Number(document.getElementById('r-svc').value)||0);
  const log=Math.max(0,Number(document.getElementById('r-log').value)||0);
  const revSh=u*px,rev=revSh+svc,totC=BASE_COST+log,net=rev-totC,mgn=rev>0?(net/rev)*100:0,cu=BASE_COST/u;
  const netEl=document.getElementById('r-net'),mgnEl=document.getElementById('r-mgn');
  netEl.textContent=(net<0?'-':'')+'$'+Math.abs(net).toFixed(2);
  netEl.className='hval '+(net>=0?'pos':'neg');
  mgnEl.textContent=mgn.toFixed(1)+'%';
  mgnEl.className='pill '+(net>=0&&rev>0?'pos':'neg');
  document.getElementById('r-rev-sub').textContent=svc>0?'Sobre $'+rev.toFixed(2)+' ($'+revSh.toFixed(0)+' shawarmas + $'+svc.toFixed(0)+' servicio)':'Sobre $'+rev.toFixed(2)+' cobrados ($'+px.toFixed(2)+' / ud)';
  document.getElementById('r-totc').textContent='$'+totC.toFixed(2);
  document.getElementById('r-cost-sub').textContent=u+' uds ($'+BASE_COST.toFixed(2)+' insumos + $'+log.toFixed(2)+' logística)';
  document.getElementById('r-cu').textContent='$'+cu.toFixed(2);
  document.getElementById('r-sh-lbl').textContent='Costo shawarmas ('+u+' uds)';
  const sellU=rev/u;
  document.getElementById('r-be').textContent=sellU>cu?Math.ceil(totC/sellU)+' uds':'—';
}
function renderOrders(){
  const q=(document.getElementById('r-q').value||'').toLowerCase().trim();
  const list=ORDERS.filter(o=>!q||String(o.turn).includes(q)||o.guest.toLowerCase().includes(q)||o.protein.toLowerCase().includes(q)||o.mods.toLowerCase().includes(q));
  document.getElementById('r-orders').innerHTML=list.map(o=>'<tr><td class="b">#'+o.turn+'</td><td>'+o.guest+(o.table?' <span class="dim">('+o.table+')</span>':'')+'</td><td>'+(o.qty>1?o.qty+'× ':'')+o.format+' '+o.protein+'</td><td class="dim">'+o.mods+(o.notes?' · '+o.notes:'')+'</td><td><span class="tag '+o.status+'">'+(o.status==='delivered'?'Entregado':o.status)+'</span></td></tr>').join('')||'<tr><td colspan="5" class="dim">Sin coincidencias.</td></tr>';
}
recalc();renderOrders();
</script></body></html>`;
 }
 async function makeWorkbook(snapshot){
   const {db,meta,costs}=snapshot,summary=s.summarize(db),rows=summary.rows,last=Math.max(8,rows.length+7),zip=await JSZip.loadAsync(window.ShawarmaWorkbookTemplate,{base64:true});
   const detail=rows.map(r=>s.cells(r).map((v,j)=>j>=15&&j<=18?excelDate(v):v));
   const title=`${meta.client||db.event_info?.name||'Evento'} · ${db.event_info?.id||''}`;
   const subtitle=`Exportado ${new Date().toLocaleString()} · Horas en UTC. Copia de consulta; recuperación completa en JSON.`;
   await fillSheet(zip,2,detail,{title,subtitle});
   const products=[...new Set(['Mixto','Pollo','Carne','Falafel',...rows.map(r=>r.protein)])],breakdown=products.flatMap(p=>['Shawarma','Bowl','Infantil'].map(f=>[p,f,rows.filter(r=>r.protein===p&&r.format===f&&r.status==='delivered').reduce((n,r)=>n+r.quantity,0)]));
   const sum=(condition)=>`SUMIF('Pedidos'!$J$8:$J$${last},"${condition}",'Pedidos'!$I$8:$I$${last})`;
   await fillSheet(zip,1,breakdown,{title,subtitle:`Invitados: ${meta.guests??'sin informar'} · Responsable: ${meta.responsible||app.operatorName||'—'} · Bowls no se suman dos veces.`,formulas:(i,j)=>j===2?`SUMIFS('Pedidos'!$I$8:$I$${last},'Pedidos'!$G$8:$G$${last},A${i+8},'Pedidos'!$H$8:$H$${last},B${i+8},'Pedidos'!$J$8:$J$${last},"Entregado")`:null,kpis:[['G8',meta.guests??'—'],['G9',summary.delivered,sum('Entregado')],['G10',summary.pending,`${sum('Por preparar')}+${sum('En preparación')}+${sum('Listo')}`],['G11',summary.cancelled,sum('Cancelado')]]});
   const f=extractFinances(snapshot),revenue=f.revenue,logistics=f.logistics,totalCost=f.totalCost,count=costs.length;
   const costRows=[...costs.map(r=>[r.name,r.formula,r.qty,r.unitCost,r.qty*r.unitCost]),['','','','',''],['Ingreso del evento','','','',revenue],['Logística','','','',logistics],['Total insumos','','','',totalCost],['Resultado neto','','','',revenue-logistics-totalCost]];
   await fillSheet(zip,3,costRows,{title,subtitle:'Uso interno. Configuración de este dispositivo. Incluye cobro shawarmas + servicio adicional y logística.',formulas:(i,j)=>j!==4?null:i<count?`C${i+8}*D${i+8}`:i===count+3?(count?`SUM(E8:E${count+7})`:'0'):i===count+4?`E${count+9}-E${count+10}-E${count+11}`:null});
   const workbook=xmlDocument(await zip.file('xl/workbook.xml').async('string'));let calc=elements(workbook,'calcPr')[0];if(!calc){calc=workbook.createElementNS(ns,'calcPr');workbook.documentElement.appendChild(calc);}calc.setAttribute('fullCalcOnLoad','1');calc.setAttribute('forceFullCalc','1');zip.file('xl/workbook.xml',new XMLSerializer().serializeToString(workbook));
   return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
 }
 proto.openInteractiveReport=async function(customSnapshot,selectedEventId){
   try{
     if(typeof this.fetchVaultArchives==='function'){
       await this.fetchVaultArchives().catch(()=>{});
     }
     const entries=buildAllReportEntries(customSnapshot);
     let currentId=selectedEventId?String(selectedEventId):(entries[0]?.id||'');
     if(!entries.some(e=>e.id===currentId))currentId=entries[0]?.id||'';
     const initialEntry=entries.find(e=>e.id===currentId)||entries[0];
     const initDate=initialEntry?new Date(initialEntry.isoDate):new Date();
     let calYear=initDate.getFullYear(),calMonth=initDate.getMonth();
     let selectedDateKey=initialEntry?initialEntry.dateKey:'';

     let modal=document.getElementById('interactive-report-modal');
     if(!modal){
       modal=document.createElement('div');
       modal.id='interactive-report-modal';
       modal.style.cssText='position:fixed;inset:0;z-index:100020;background:rgba(0,0,0,0.86);display:flex;flex-direction:column;padding:12px;box-sizing:border-box;';
       document.body.appendChild(modal);
     }
     modal.innerHTML=`
       <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:#111114;border:1px solid rgba(255,255,255,0.12);border-bottom:none;border-radius:12px 12px 0 0;">
         <div style="display:flex;align-items:center;gap:10px;min-width:0;">
           <strong style="color:#FAFAFA;font-size:13.5px;font-weight:700;white-space:nowrap;">Calendario y Reportes Financieros</strong>
           <span id="ir-count-pill" style="font-size:11.5px;color:#A1A1AA;background:#18181C;border:1px solid rgba(255,255,255,0.1);padding:2px 9px;border-radius:99px;">${entries.length} ${entries.length===1?'evento':'eventos'}</span>
         </div>
         <div style="display:flex;gap:8px;align-items:center;">
           <button type="button" id="ir-btn-download" style="height:32px;padding:0 12px;border-radius:7px;border:1px solid rgba(255,255,255,0.16);background:#18181C;color:#FAFAFA;font-size:12px;font-weight:600;cursor:pointer;">Descargar HTML</button>
           <button type="button" id="ir-btn-close" style="height:32px;padding:0 12px;border-radius:7px;border:none;background:#D41473;color:#FFFFFF;font-size:12px;font-weight:700;cursor:pointer;">Cerrar ✕</button>
         </div>
       </div>
       <div id="ir-shell" style="flex:1 1 auto;min-height:0;display:grid;grid-template-columns:286px minmax(0,1fr);border:1px solid rgba(255,255,255,0.12);border-radius:0 0 12px 12px;overflow:hidden;background:#09090B;">
         <aside style="background:#111114;border-right:1px solid rgba(255,255,255,0.10);display:flex;flex-direction:column;min-height:0;overflow-y:auto;padding:14px;gap:14px;">
           <div>
             <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
               <button type="button" id="ir-cal-prev" style="width:28px;height:28px;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:#18181C;color:#FAFAFA;cursor:pointer;">‹</button>
               <strong id="ir-cal-title" style="font-size:13px;color:#FAFAFA;text-transform:capitalize;"></strong>
               <button type="button" id="ir-cal-next" style="width:28px;height:28px;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:#18181C;color:#FAFAFA;cursor:pointer;">›</button>
             </div>
             <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:10px;font-weight:700;color:#71717A;margin-bottom:4px;">
               <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
             </div>
             <div id="ir-cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;"></div>
           </div>
           <div style="border-top:1px solid rgba(255,255,255,0.09);padding-top:12px;display:flex;flex-direction:column;gap:8px;">
             <div style="display:flex;align-items:center;justify-content:space-between;">
               <span id="ir-list-label" style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#71717A;">Eventos guardados</span>
               <button type="button" id="ir-show-all" style="font-size:11px;color:#D41473;background:none;border:none;cursor:pointer;font-weight:600;display:none;">Ver todos</button>
             </div>
             <div id="ir-evt-list" style="display:flex;flex-direction:column;gap:6px;"></div>
           </div>
         </aside>
         <iframe id="ir-iframe" title="Reporte interactivo del evento" style="width:100%;height:100%;border:none;background:#09090B;"></iframe>
       </div>
     `;

     const byDate=new Map();
     entries.forEach(e=>{
       if(!byDate.has(e.dateKey))byDate.set(e.dateKey,[]);
       byDate.get(e.dateKey).push(e);
     });

     const iframe=modal.querySelector('#ir-iframe');
     let currentHtml='';
     let currentFileName='Shawarma_Reporte_Interactivo.html';

     const loadEntry=(entry)=>{
       if(!entry)return;
       currentId=entry.id;
       currentHtml=makeInteractiveReportHTML(entry.snapshot);
       const slug=entry.owner.replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,32)||'Evento';
       currentFileName=`Shawarma_Reporte_${slug}_${entry.dateKey}.html`;
       iframe.srcdoc=currentHtml;
       renderList();
     };

     const renderCalendar=()=>{
       const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
       modal.querySelector('#ir-cal-title').textContent=`${months[calMonth]} ${calYear}`;
       const firstDay=new Date(calYear,calMonth,1).getDay();
       const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
       let cells='';
       for(let i=0;i<firstDay;i++)cells+='<div></div>';
       for(let d=1;d<=daysInMonth;d++){
         const key=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
         const dayEvts=byDate.get(key)||[];
         const has=dayEvts.length>0;
         const isSel=selectedDateKey===key;
         const bg=isSel?'#D41473':(has?'rgba(212,20,115,0.18)':'transparent');
         const bd=isSel?'#D41473':(has?'rgba(212,20,115,0.45)':'rgba(255,255,255,0.05)');
         const colTxt=isSel?'#FFFFFF':(has?'#FAFAFA':'#71717A');
         cells+=`<button type="button" data-cal-day="${key}" style="position:relative;height:32px;border-radius:7px;border:1px solid ${bd};background:${bg};color:${colTxt};font-size:12px;font-weight:${has?'700':'500'};cursor:${has?'pointer':'default'};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">
           <span>${d}</span>
           ${has?`<span style="width:4px;height:4px;border-radius:50%;background:${isSel?'#fff':'#D41473'};"></span>`:''}
         </button>`;
       }
       const grid=modal.querySelector('#ir-cal-grid');
       grid.innerHTML=cells;
       grid.querySelectorAll('[data-cal-day]').forEach(btn=>{
         btn.onclick=()=>{
           const k=btn.getAttribute('data-cal-day');
           const evs=byDate.get(k)||[];
           if(!evs.length)return;
           selectedDateKey=k;
           renderCalendar();
           loadEntry(evs[0]);
         };
       });
     };

     const renderList=()=>{
       const filtered=selectedDateKey?(byDate.get(selectedDateKey)||entries):entries;
       const showAllBtn=modal.querySelector('#ir-show-all');
       if(showAllBtn)showAllBtn.style.display=selectedDateKey?'inline':'none';
       modal.querySelector('#ir-list-label').textContent=selectedDateKey?`Eventos del ${selectedDateKey}`:`Todos los eventos (${entries.length})`;
       const listEl=modal.querySelector('#ir-evt-list');
       listEl.innerHTML=filtered.map(e=>{
         const active=e.id===currentId;
         return `<button type="button" data-ir-evt="${esc(e.id)}" style="text-align:left;padding:9px 10px;border-radius:8px;border:1px solid ${active?'#D41473':'rgba(255,255,255,0.09)'};background:${active?'rgba(212,20,115,0.14)':'#18181C'};color:#FAFAFA;cursor:pointer;display:flex;flex-direction:column;gap:3px;">
           <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
             <strong style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(e.owner)}</strong>
             ${e.isActive?'<span style="font-size:9.5px;font-weight:700;color:#34D399;text-transform:uppercase;">En vivo</span>':''}
           </div>
           <span style="font-size:11px;color:#A1A1AA;font-variant-numeric:tabular-nums;">${esc(e.dateKey)} · ${e.units} uds · Costo $${e.totalCost.toFixed(2)}</span>
         </button>`;
       }).join('');
       listEl.querySelectorAll('[data-ir-evt]').forEach(btn=>{
         btn.onclick=()=>{
           const found=entries.find(x=>x.id===btn.getAttribute('data-ir-evt'));
           if(found)loadEntry(found);
         };
       });
     };

     modal.querySelector('#ir-cal-prev').onclick=()=>{calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCalendar();};
     modal.querySelector('#ir-cal-next').onclick=()=>{calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCalendar();};
     modal.querySelector('#ir-show-all').onclick=()=>{selectedDateKey='';renderCalendar();renderList();};
     modal.querySelector('#ir-btn-close').onclick=()=>{modal.style.display='none';};
     modal.querySelector('#ir-btn-download').onclick=()=>{if(currentHtml)s.download(new Blob([currentHtml],{type:'text/html;charset=utf-8'}),currentFileName);};
     if(window.innerWidth<820){
       modal.querySelector('#ir-shell').style.gridTemplateColumns='1fr';
       modal.querySelector('#ir-shell').style.gridTemplateRows='270px 1fr';
     }
     renderCalendar();
     if(initialEntry)loadEntry(initialEntry);
     modal.style.display='flex';
   }catch(e){
     this.showToast('No se pudo abrir el reporte interactivo.','error');
   }
 };
 proto.exportEventExcel=async function(){if(this.serviceExportBusy)return;this.serviceExportBusy=true;try{const snap=capture(),bytes=await makeWorkbook(snap);s.download(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'Shawarma_Evento.xlsx');this.showToast(s.t('Excel generado. Comprueba el archivo en Descargas.','Excel generated. Check your Downloads.'));return true;}catch{this.showToast(s.t('No se pudo crear el Excel. Conserva el respaldo JSON.','Could not create Excel. Keep the JSON backup.'),'error');return false;}finally{this.serviceExportBusy=false;}};
 proto.downloadEventBundle=async function(){if(this.serviceExportBusy)return false;this.serviceExportBusy=true;try{const snap=capture(),xlsx=await makeWorkbook(snap),reportHtml=makeInteractiveReportHTML(snap),zip=new JSZip();zip.file('Shawarma_Reporte_Interactivo.html',reportHtml);zip.file('Shawarma_Evento.xlsx',xlsx);zip.file('Shawarma_Respaldo.json',JSON.stringify(snap.backup,null,2));zip.file('LEEME.txt','Privado: contiene nombres e información financiera del negocio.\n- Shawarma_Reporte_Interactivo.html: ábrelo en Safari o Chrome para ver costos, rentabilidad, simulador y comandas de forma interactiva.\n- Shawarma_Evento.xlsx: hoja de cálculo Excel.\n- Shawarma_Respaldo.json: recuperación completa del evento.\n');const bytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE'});s.download(new Blob([bytes],{type:'application/zip'}),`Shawarma_Respaldo_${new Date().toISOString().replace(/[:.]/g,'-')}.zip`);this.showToast(s.t('Respaldo ZIP generado (Reporte Interactivo HTML + Excel + JSON).','ZIP backup generated (Interactive HTML Report + Excel + JSON).'));return true;}catch{this.showToast(s.t('No se pudo crear el ZIP. Descarga el JSON y no cierres el evento.','Could not create the ZIP. Download JSON and do not close the event.'),'error');return false;}finally{this.serviceExportBusy=false;}};
 function validateBackup(value){
   if(!value||value.format!=='shawarma-recovery'||value.version!==1)throw Error('Formato no reconocido');
   const events=[value.current_event,...(Array.isArray(value.archived_events)?value.archived_events.map(e=>({event_info:{id:e.id,name:e.name,created_at:e.date,timer:e.timer},orders:e.orders})):[])];
   for(const db of events){if(!db||!db.event_info||typeof db.event_info.id!=='string'||!Array.isArray(db.orders)||db.orders.length>10000)throw Error('Evento incompleto');const ids=new Set();for(const o of db.orders){if(!o||typeof o.id!=='string'||ids.has(o.id)||!Number.isSafeInteger(o.turn)||o.turn<1||!['pending','preparing','ready','delivered','cancelled'].includes(o.status))throw Error('Pedidos inválidos');ids.add(o.id);if(o.is_group&&(!Array.isArray(o.items)||!o.items.length))throw Error('Grupo incompleto');for(const item of (o.is_group?o.items:[o])){if(!item||typeof item.protein!=='string'||!Array.isArray(item.ingredients)||!item.ingredients.every(x=>typeof x==='string')||(item.quantity!=null&&(!Number.isSafeInteger(item.quantity)||item.quantity<1)))throw Error('Receta inválida');}}}
   return events;
 }
 proto.openRecoveryFile=function(){$('s-recovery-file')?.click();};
 proto.inspectRecoveryFile=async function(file){if(!file)return;try{if(file.size>20*1024*1024)throw Error('Elige un JSON menor a 20 MB');const content=JSON.parse(await file.text()),events=validateBackup(content);this.serviceRecovery={content,events};const box=$('s-recovery-preview');box.hidden=false;box.innerHTML=`<strong>${s.t('Respaldo válido','Valid backup')}</strong><p>${s.t('Selecciona un evento. Restaurarlo respaldará primero el evento activo en el servidor.','Select an event. Restoring it first backs up the active server event.')}</p><select id="s-recovery-event" aria-label="Evento del respaldo">${events.map((db,i)=>`<option value="${i}">${esc(db.event_info.name||db.event_info.id)} · ${db.orders.length} turnos</option>`).join('')}</select><div class="u-actions"><button class="u-button" type="button" onclick="app.archiveRecoveredEvent()">${s.t('Guardar copia en historial local','Save copy to local history')}</button><button class="u-button u-primary" type="button" onclick="app.restoreRecoveredEvent()">${s.t('Restaurar como evento activo','Restore as active event')}</button></div>`;}catch(error){this.serviceRecovery=null;$('s-recovery-preview').hidden=true;this.showToast(s.t('No se abrió el respaldo. Elige el JSON original válido; no se modificaron datos.','Could not open backup. Choose a valid original JSON; no data changed.'),'error');}};
 proto.restoreRecoveredEvent=async function(){const selected=this.serviceRecovery?.events[Number($('s-recovery-event')?.value)];if(!selected)return;const orderCount=selected.orders.length;if(!confirm(s.t(`¿Restaurar "${selected.event_info.name||'Evento'}" con ${orderCount} pedidos como evento activo? El servidor guardará una copia del evento actual antes de reemplazarlo.`,`Restore "${selected.event_info.name||'Event'}" with ${orderCount} orders as the active event? The server will back up the current event before replacing it.`)))return;try{const response=await fetch('/api/event/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:selected})});const result=await response.json();if(!response.ok)throw Error(result.error||'No se pudo restaurar el evento');this.handleCleanEventReset(result.data);await this.fetchVaultArchives();this.showToast(s.t('Evento restaurado. El evento anterior quedó respaldado en el servidor.','Event restored. The previous event was backed up on the server.'),'success');}catch(error){this.showToast(error.message||'No se pudo restaurar el evento. Los datos activos siguen sin cambios.','error');}};
 proto.archiveRecoveredEvent=function(){const selected=this.serviceRecovery?.events[Number($('s-recovery-event')?.value)];if(!selected)return;const db=copy(selected);if(!confirm(s.t('¿Añadir una copia al historial de este dispositivo? Los pedidos activos no cambiarán.','Add a copy to this device’s history? Active orders will not change.')))return;try{const archives=readArchives(),id='recovered_'+db.event_info.id+'_'+Date.now();archives.push({id,source_event_id:db.event_info.id,name:db.event_info.name,date:db.event_info.created_at||new Date().toISOString(),orders:db.orders,timer:db.event_info.timer,total_orders:db.orders.length,operator:'Respaldo importado',service_metadata:this.serviceRecovery.content.service_metadata?.[db.event_info.id]||{},cost_config:this.serviceRecovery.content.cost_config||{}});localStorage.setItem('shawarma_event_vault_archives',JSON.stringify(archives));this.renderAdmin();this.showToast(s.t('Copia guardada en historial. No se enviaron pedidos al servidor.','Copy saved to history. No orders were sent to the server.'));}catch{this.showToast(s.t('No se pudo guardar la copia. Conserva el JSON original.','Could not save copy. Keep the original JSON.'),'error');}};
 window.ShawarmaReports={makeWorkbook,validateBackup,excelDate,capture};
})();
