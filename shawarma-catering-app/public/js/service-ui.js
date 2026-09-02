/* Final service controls. No backend replacement; canonical order data stays Spanish. */
(() => {
  'use strict';
  const app=window.app, proto=Object.getPrototypeOf(app), ui=window.ShawarmaPremium;
  const $=id=>document.getElementById(id), {esc,icon,orderUnits}=ui;
  const META='shawarma_service_metadata_v1', copy=x=>JSON.parse(JSON.stringify(x));
  const names=['Cumpleañero','Carlos','Camilo','César','Carolina','Camila','Carmen','Catalina','Cristian','Claudia','Ana','Andrés','Andrea','Antonio','Alejandro','Alejandra','Adriana','Alberto','Ángel','Beatriz','Bruno','Daniel','Daniela','David','Diego','Diana','Eduardo','Elena','Emilia','Enrique','Esteban','Eva','Felipe','Fernanda','Fernando','Francisco','Gabriel','Gabriela','Gloria','Guillermo','Héctor','Hugo','Isabel','Isabella','Iván','Javier','Jesús','Jorge','José','Juan','Julia','Juliana','Julio','Karen','Laura','Leonardo','Liliana','Lorena','Lucía','Luis','Luisa','Manuel','María','Mariana','Mario','Marta','Mateo','Matías','Mauricio','Miguel','Mónica','Natalia','Nicolás','Óscar','Pablo','Patricia','Paula','Pedro','Rafael','Ramón','Raúl','Ricardo','Roberto','Rodrigo','Rosa','Samuel','Sandra','Santiago','Sara','Sebastián','Sofía','Sonia','Susana','Teresa','Tomás','Valentina','Valeria','Verónica','Víctor','Victoria','Walter','William','Ximena','Yolanda','Zoe'];
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const suggest=query=>{const q=normalize(query);return q?names.filter(n=>normalize(n).startsWith(q)).slice(0,5):[];};
  const en=()=>app.invoiceLang==='en'||document.documentElement?.lang==='en';
  const t=(es,english)=>en()?english:es;
  function measureMobileChrome(){
    if(!window.matchMedia?.('(max-width:767px)').matches)return;
    const style=document.body?.style;if(typeof style?.setProperty!=='function')return;
    for(const [selector,property] of [['.tabs-nav','--s-nav-height'],['.p-mobile-review','--s-review-height'],['.header-bar','--s-header-height']]){
      const node=document.querySelector(selector);const height=node?.getBoundingClientRect?.().height;
      if(Number.isFinite(height)&&height>0){const value=Math.ceil(height)+'px';if(style.getPropertyValue(property)!==value)style.setProperty(property,value);}
    }
  }
  let isSummaryVisible = false;
  function updateMobileActionButton(visible){
    isSummaryVisible = !!visible;
    const reviewTray = document.querySelector('.p-mobile-review');
    if(reviewTray) {
      reviewTray.classList.toggle('is-hidden', isSummaryVisible);
    }
    const button=$('p-review-order'),label=$('p-mobile-action-text');if(!button||!label)return;
    const tr=text=>window.ShawarmaI18n?.translate(text)||text;
    const editing=!!app.editingOrderId;
    const text=tr(isSummaryVisible?(editing?'Guardar cambios':'Enviar a cocina'):(editing?'Revisar cambios':'Revisar pedido'));
    if(label.textContent!==text)label.textContent=text;
    button.dataset.mobileAction=isSummaryVisible?'submit':'review';
    button.disabled=isSummaryVisible&&!!($('btn-submit-order')?.disabled||app.premiumSubmitting||app.safetyClosing);
    const accessible=isSummaryVisible?tr(editing?'Guardar cambios':'Confirmar y enviar a cocina'):text;
    if(button.getAttribute('aria-label')!==accessible)button.setAttribute('aria-label',accessible);
  }
  function refreshMobileReview(){
    updateMobileActionButton(isSummaryVisible);
    return isSummaryVisible;
  }
  function confirmMobileReview(){
    if(!isSummaryVisible)return false;
    const submit=$('btn-submit-order');if(!submit)return false;
    if(!$('p-review-order').disabled)submit.click();
    return true;
  }
  function setupMobileChrome(){
    if(app.mobileChromeInstalled)return;app.mobileChromeInstalled=true;
    const schedule=()=>{measureMobileChrome();refreshMobileReview();};
    if(typeof window.ResizeObserver==='function'){
      app.mobileChromeObserver=new ResizeObserver(schedule);
      for(const selector of ['.tabs-nav','.p-mobile-review','.header-bar']){const node=document.querySelector(selector);if(node)app.mobileChromeObserver.observe(node);}
    }
    window.addEventListener('resize',schedule);
    window.addEventListener('orientationchange',schedule);
    window.visualViewport?.addEventListener('resize',schedule);
    
    // IntersectionObserver fluido para detectar el resumen sin recalcular en scroll
    if(typeof window.IntersectionObserver==='function'){
      const summaryNode=document.querySelector('.summary-card-pos');
      if(summaryNode){
        const obs=new IntersectionObserver((entries)=>{
          for(const entry of entries){
            updateMobileActionButton(entry.isIntersecting);
          }
        },{threshold:0.15});
        obs.observe(summaryNode);
        app.mobileSummaryObserver=obs;
      }
    }
    schedule();
  }
  const sendOrder=proto.submitOrder;
  proto.submitOrder=async function(...args){
    try{const pending=sendOrder.apply(this,args);refreshMobileReview();return await pending;}
    finally{refreshMobileReview();}
  };
  function setupNames() {
    const input=$('guest-name');if(!input||$('guest-suggestions'))return;
    const list=document.createElement('div');list.id='guest-suggestions';list.className='s-name-list';list.hidden=true;
    list.setAttribute('role','listbox');list.setAttribute('data-i18n-ignore','');
    input.parentElement?.classList.add('s-name-field');input.parentElement?.appendChild(list);
    input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');input.setAttribute('autocomplete','off');
    let matches=[],active=-1;
    function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
    function draw(){list.innerHTML=matches.map((name,i)=>`<button type="button" role="option" id="guest-option-${i}" data-name-index="${i}" aria-selected="${i===active}" tabindex="-1">${esc(name)}</button>`).join('');list.hidden=!matches.length;input.setAttribute('aria-expanded',String(!!matches.length));if(active>=0)input.setAttribute('aria-activedescendant','guest-option-'+active);else input.removeAttribute('aria-activedescendant');}
    function select(i){if(!matches[i])return;input.value=matches[i];close();app.updatePreviewAndTurn();input.focus();}
    input.addEventListener('input',()=>{matches=suggest(input.value);active=-1;draw();});
    input.addEventListener('keydown',event=>{if(event.key==='Escape'){close();return;}if(list.hidden)return;if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();active=active<0?(event.key==='ArrowDown'?0:matches.length-1):(active+(event.key==='ArrowDown'?1:-1)+matches.length)%matches.length;draw();}else if(event.key==='Enter'&&active>=0){event.preventDefault();select(active);}});
    list.addEventListener('pointerdown',event=>event.preventDefault());
    list.addEventListener('click',event=>{const item=event.target.closest('[data-name-index]');if(item)select(Number(item.dataset.nameIndex));});
    input.addEventListener('blur',close);
  }
  const legacyPreset=proto.applyPreset;
  proto.applyPreset=function(preset) {
    if(!['con-todo','bowl','ninos','sin-salsas'].includes(preset))return legacyPreset.call(this,preset);
    const prior=this.selectedPreset;
    if(preset==='con-todo') {INGREDIENTS_CONFIG.forEach(i=>this.ingredientPreferences[i.id]=i.id!=='picante');this.selectedPreset=prior==='bowl'?'bowl':'con-todo';}
    if(preset==='bowl')this.selectedPreset=prior==='bowl'?'custom':'bowl';
    if(preset==='ninos') {if(prior==='ninos')this.selectedPreset='custom';else {this.selectedPreset='ninos';INGREDIENTS_CONFIG.forEach(i=>this.ingredientPreferences[i.id]=false);}}
    if(preset==='sin-salsas') {this.ingredientPreferences.ajo=false;this.ingredientPreferences.ajonjoli=false;if(!['bowl','ninos'].includes(prior))this.selectedPreset='sin-salsas';}
    this.updatePresetPills();this.renderIngredientsMatrix();this.updatePreviewAndTurn();
  };
  const updatePills=proto.updatePresetPills;
  proto.updatePresetPills=function(){updatePills.call(this);const complete=INGREDIENTS_CONFIG.every(i=>!!this.ingredientPreferences[i.id]===(i.id!=='picante'));$('preset-con-todo')?.classList.toggle('active',complete);$('preset-sin-salsas')?.classList.toggle('active',!this.ingredientPreferences.ajo&&!this.ingredientPreferences.ajonjoli);};
  async function timerAction(action) {
    if(app.safetyConflict||app.safetyClosing||app.serviceTimerBusy)return;
    if(action==='reset'&&!confirm(t('¿Reiniciar solo el reloj? No borra pedidos ni cambia sus horas.','Reset only the timer? Orders and their timestamps will not change.')))return;
    const eventId=String(app.db.event_info?.id||'');app.serviceTimerBusy=true;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
    try {
      const res=await fetch('/api/event/timer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action}),signal:controller.signal});
      if(!res.ok)throw Error('Timer unconfirmed');const data=await res.json();
      if(!data.event_info?.timer||String(data.event_info.id||'')!==eventId||String(app.db.event_info?.id||'')!==eventId)throw Error('Different event');
      app.syncData({...app.db,event_info:data.event_info},true);app.updateEventTimerDisplay();
    } catch {app.showToast(t('No se confirmó el cambio del reloj. Comprueba la conexión antes de repetir.','Timer change was not confirmed. Check the connection before retrying.'),'error');}
    finally{clearTimeout(timeout);app.serviceTimerBusy=false;}
  }
  proto.toggleEventTimer=()=>timerAction('toggle_pause');proto.resetEventTimer=()=>timerAction('reset');
  function readMeta(){const raw=localStorage.getItem(META);if(!raw)return {};const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid metadata');return value;}
  proto.getServiceMeta=function(id=this.db.event_info?.id){try{return readMeta()[String(id)]||{};}catch{this.showToast(t('No se pudieron leer los datos del resumen. No se han sobrescrito.','Report information could not be read. Nothing was overwritten.'),'error');return {};}};
  proto.saveServiceMeta=function(){
    if(String(this.serviceReportEvent)!==String(this.db.event_info?.id))return this.showToast(t('El evento cambió. Abre nuevamente el resumen.','The event changed. Reopen the report.'),'error');
    const guests=$('s-report-guests').value.trim(),num=Number(guests);
    if(guests&&(!Number.isSafeInteger(num)||num<0))return this.showToast(t('Revisa la cantidad de invitados.','Check the guest count.'),'error');
    const meta={client:$('s-report-client').value.trim().slice(0,160),guests:guests?num:null,responsible:$('s-report-responsible').value.trim().slice(0,160),notes:$('s-report-notes').value.trim().slice(0,1000)};
    try{const all=readMeta();Object.defineProperty(all,String(this.serviceReportEvent),{value:meta,enumerable:true,configurable:true,writable:true});localStorage.setItem(META,JSON.stringify(all));this.serviceReportDirty=false;this.renderInvoiceContent();this.showToast(t('Datos del resumen guardados en este dispositivo y en sus próximos respaldos.','Report information saved on this device and included in future backups.'));}catch{this.showToast(t('No se pudieron guardar los datos. Conserva el formulario abierto.','Could not save. Keep the form open.'),'error');}
  };
  const statuses={pending:'Por preparar',preparing:'En preparación',ready:'Listo',delivered:'Entregado',cancelled:'Cancelado'};
  function eventRows(db) {
    return (db.orders||[]).flatMap(order=>orderUnits(order).map(({item,quantity},i)=>({event:String(db.event_info?.id||''),id:String(order.id||''),turn:order.turn,index:i+1,guest:order.guest_name||'',table:order.table||'',protein:item.protein||'Sin especificar',format:item.is_bowl||item.preset==='bowl'?'Bowl':item.preset==='ninos'?'Infantil':'Shawarma',quantity,status:order.status,ingredients:Array.isArray(item.ingredients)?item.ingredients:[],removed:Array.isArray(item.removed_ingredients)?item.removed_ingredients:[],notes:item.notes||'',groupNotes:order.is_group?order.notes||'':'',operator:order.operator||'',created_at:order.created_at||'',prepared_at:order.prepared_at||'',delivered_at:order.delivered_at||'',updated_at:order.updated_at||'',guest_ack:!!order.guest_ack})));
  }
  function summarize(db) {
    const rows=eventRows(db),delivered=rows.filter(r=>r.status==='delivered'),sum=list=>list.reduce((n,r)=>n+r.quantity,0),breakdown=new Map();
    for(const r of delivered){const key=r.protein+' · '+r.format;breakdown.set(key,(breakdown.get(key)||0)+r.quantity);}
    return {rows,delivered:sum(delivered),pending:sum(rows.filter(r=>['pending','preparing','ready'].includes(r.status))),cancelled:sum(rows.filter(r=>r.status==='cancelled')),total:sum(rows),breakdown:[...breakdown]};
  }
  function time(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleTimeString(en()?'en':'es',{hour:'2-digit',minute:'2-digit'}):'—';}
  function date(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString(en()?'en':'es',{year:'numeric',month:'long',day:'numeric'}):'—';}
  function timerSeconds(db){const timer=db.event_info?.timer;if(!timer?.started_at)return 0;return Math.max(0,Math.floor(((timer.is_paused?Date.parse(timer.paused_at):Date.now())-Date.parse(timer.started_at))/1000))||0;}
  function reportMarkup(db,meta) {
    const summary=summarize(db),times=summary.rows.map(r=>r.created_at).filter(x=>Number.isFinite(Date.parse(x))).sort(),ends=summary.rows.filter(r=>r.status==='delivered').map(r=>r.delivered_at).filter(x=>Number.isFinite(Date.parse(x))).sort();
    const product=label=>en()?label.replace('Mixto','Mixed').replace('Pollo','Chicken').replace('Carne','Beef').replace('Infantil','Kids'):label;
    return `<article class="s-client-report" data-i18n-ignore><header><img src="images/shawarma-logo-light.png" alt="SHAWARMA en casa"><span>${esc(date(db.event_info?.created_at||times[0]))}</span></header><p class="s-report-eyebrow">${t('RESUMEN DEL SERVICIO','SERVICE SUMMARY')}</p><h1>${esc(meta.client||db.event_info?.name||t('Evento','Event'))}</h1><p class="s-report-sub">${t('Preparado con dedicación para tu celebración.','Prepared with care for your celebration.')}</p><div class="s-report-kpis"><div><span>${t('Invitados informados','Guests reported')}</span><strong>${meta.guests??'—'}</strong></div><div><span>${t('Unidades entregadas','Units delivered')}</span><strong>${summary.delivered}</strong></div></div><h2>${t('Lo que servimos','What we served')}</h2><table><thead><tr><th>${t('Producto y presentación','Product and format')}</th><th>${t('Cantidad','Quantity')}</th></tr></thead><tbody>${summary.breakdown.map(([label,n])=>`<tr><td>${esc(product(label))}</td><td>${n}</td></tr>`).join('')||`<tr><td colspan="2">${t('Aún no hay entregas confirmadas.','No confirmed deliveries yet.')}</td></tr>`}</tbody><tfoot><tr><th>Total</th><th>${summary.delivered}</th></tr></tfoot></table>${summary.pending||summary.cancelled?`<p class="s-report-sub">${t('Pendientes de entrega','Awaiting delivery')}: ${summary.pending} · ${t('Canceladas','Cancelled')}: ${summary.cancelled}. ${t('No incluidas en el total servido.','Not included in the served total.')}</p>`:''}<div class="s-report-reference"><p>${t('Primer pedido','First order')}: ${time(times[0])}</p><p>${t('Última entrega','Last delivery')}: ${time(ends.at(-1))}</p><p>${t('Tiempo de servicio (sin pausas)','Service time (excluding pauses)')}: ${ui.duration(timerSeconds(db))}</p><p>${t('Responsable','Responsible')}: ${esc(meta.responsible||app.operatorName||'—')}</p></div>${meta.notes?`<p class="s-report-notes">${esc(meta.notes)}</p>`:''}<footer><strong>${t('Gracias por dejarnos ser parte de este día.','Thank you for letting us be part of your day.')}</strong><p>“Y ahora, que toda la Gloria sea para Dios...”<br>Efesios 3:20 NTV</p><small>${t('Resumen informativo del servicio. No es una factura fiscal.','Informational service summary. Not a tax invoice.')}</small></footer></article>`;
  }
  proto.showClientInvoiceModal=function(){this.serviceReportEvent=this.db.event_info?.id;this.serviceReportDirty=false;const meta=this.getServiceMeta();const modal=$('client-invoice-modal');modal.innerHTML=`<section class="s-report-dialog" role="dialog" aria-modal="true" aria-label="${t('Resumen del servicio','Service summary')}"><div class="s-report-tools no-print"><div class="u-actions"><button type="button" class="u-button" onclick="app.printServiceReport()">${icon('order')}${t('Imprimir / PDF','Print / PDF')}</button><button type="button" class="u-button" onclick="app.copyInvoiceToClipboard()">${t('Copiar resumen','Copy summary')}</button><button type="button" class="u-button" onclick="app.closeClientInvoiceModal()">${t('Cerrar','Close')}</button></div><details><summary>${t('Datos del cliente y evento','Client and event information')}</summary><p>${t('Datos locales de este dispositivo; se incluyen en el respaldo. No cambian los pedidos.','Local to this device; included in its backup. Orders are unchanged.')}</p><div class="s-report-fields"><label>${t('Cliente / celebración','Client / celebration')}<input id="s-report-client" maxlength="160" value="${esc(meta.client||'')}" data-i18n-ignore></label><label>${t('Invitados','Guests')}<input id="s-report-guests" type="number" min="0" step="1" inputmode="numeric" value="${meta.guests??''}"></label><label>${t('Responsable','Responsible')}<input id="s-report-responsible" maxlength="160" value="${esc(meta.responsible||this.operatorName||'')}" data-i18n-ignore></label><label>${t('Observaciones','Notes')}<textarea id="s-report-notes" maxlength="1000" data-i18n-ignore>${esc(meta.notes||'')}</textarea></label></div><button type="button" class="u-button u-primary" onclick="app.saveServiceMeta()">${t('Guardar datos','Save information')}</button></details></div><div id="s-report-content"></div></section>`;modal.style.display='flex';modal.querySelector('.s-report-fields')?.addEventListener('input',()=>{this.serviceReportDirty=true;});this.renderInvoiceContent();modal.querySelector('button')?.focus();};
  proto.renderInvoiceContent=function(){if($('s-report-content'))$('s-report-content').innerHTML=reportMarkup(this.db,this.getServiceMeta());};
  proto.setInvoiceLang=function(value){if(['es','en'].includes(value)){this.invoiceLang=value;this.renderInvoiceContent();}};
  proto.closeClientInvoiceModal=function(){if(this.serviceReportDirty&&!confirm(t('¿Cerrar sin guardar los datos del resumen?','Close without saving report information?')))return;$('client-invoice-modal').style.display='none';};
  proto.printServiceReport=function(){if(this.serviceReportDirty)return this.showToast(t('Guarda primero los datos del resumen.','Save report information first.'),'info');this.renderInvoiceContent();window.print();};
  proto.copyInvoiceToClipboard=async function(){if(this.serviceReportDirty)return this.showToast(t('Guarda primero los datos del resumen.','Save report information first.'),'info');try{await navigator.clipboard.writeText($('s-report-content').innerText);this.showToast(t('Resumen copiado.','Summary copied.'));}catch{this.showToast(t('No se pudo copiar. Usa Imprimir / PDF.','Could not copy. Use Print / PDF.'),'error');}};
  const backup=proto.buildSafetyBackup;
  proto.buildSafetyBackup=function(){const result=backup.call(this);result.service_metadata=readMeta();const legacy=JSON.parse(localStorage.getItem('shawarma_permanent_vault_v2')||'[]');if(!Array.isArray(legacy))throw Error('Invalid legacy vault; do not overwrite');result.legacy_vault_orders=legacy;result.financial_inputs={revenue:$('cost-input-revenue')?.value||'',logistics:$('cost-input-logistics')?.value||''};return result;};
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  const columns=['Evento','ID pedido','Turno','Ítem','Invitado','Mesa','Proteína','Formato','Cantidad','Estado','Incluye','Sin','Notas ítem','Notas grupo','Operador','Pedido UTC','Listo UTC','Entrega UTC','Actualizado UTC','Aviso invitado'];
  const cells=row=>[row.event,row.id,row.turn,row.index,row.guest,row.table,row.protein,row.format,row.quantity,statuses[row.status]||row.status,row.ingredients.join(', '),row.removed.join(', '),row.notes,row.groupNotes,row.operator,row.created_at,row.prepared_at,row.delivered_at,row.updated_at,row.guest_ack?'Sí':'No'];
  function exportCSV(db,name){const csv=[columns,...eventRows(db).map(cells)].map(row=>row.map(window.ShawarmaSupplies.csvCell).join(',')).join('\r\n');download(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),name);}
  proto.exportRawCSV=function(){exportCSV(this.db,'shawarma_pedidos_completos.csv');};
  proto.exportSingleEventCSV=function(index){const e=this.getVaultArchives()[index];if(e)exportCSV({event_info:{id:e.id},orders:e.orders||[]},'shawarma_historial.csv');};
  proto.exportVaultCSV=function(){const archives=this.getVaultArchives();const covered=new Set(archives.flatMap(e=>(e.orders||[]).map(o=>String(o.id))));const remaining=this.getVaultOrders().filter(o=>!covered.has(String(o.id)));const rows=[...archives.flatMap(e=>eventRows({event_info:{id:e.id},orders:e.orders||[]})),...eventRows({event_info:{id:'Bóveda anterior · evento no identificado'},orders:remaining})];download(new Blob(['\uFEFF'+[columns,...rows.map(cells)].map(r=>r.map(window.ShawarmaSupplies.csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),'shawarma_historial_completo.csv');};
  proto.clearEventWithoutSaving=async function(){
    if(this.serviceClearing||this.safetyClosing||this.premiumSubmitting||this.safetyDeleting||this.safetyStatusPending?.size||this.serviceTimerBusy||this.serviceExportBusy)return false;
    if(this.safetyConflict||this.safetyUnconfirmed){this.showToast(t('Revisa primero el cambio de evento o el envío sin confirmar.','Review the event change or unconfirmed submission first.'),'info');return false;}
    const original=copy(this.db),eventId=String(original.event_info?.id||''),targets=original.orders||[];
    if(!eventId){this.showToast(t('Primero conecta con el servidor para identificar el evento.','Connect to the server to identify the event first.'),'info');return false;}
    if(!targets.length){this.showToast(t('No hay pedidos que limpiar. El evento continúa abierto.','There are no orders to clear. The event remains open.'),'info');return false;}
    const count=targets.reduce((n,o)=>n+orderUnits(o).reduce((a,x)=>a+x.quantity,0),0);
    if(!confirm(t(`¿Limpiar sin guardar ${targets.length} pedidos (${count} unidades) del evento actual? Incluye todos sus estados y descarta el formulario. No descarga Excel/JSON ni archiva el evento. Mantiene el reloj, la numeración de turnos y el historial anterior. Las copias de recuperación existentes se conservan. Detén la toma de pedidos en los otros equipos mientras se limpia.`,`Clear ${targets.length} orders (${count} units) from the current event without saving? Includes all statuses and discards the form. No Excel/JSON download or event archive. The timer, order numbering, previous history and existing recovery copies remain. Stop taking orders on other devices while clearing.`)))return false;
    // Retain auxiliary recovery already used by normal deletion; no download/archive.
    if(!window.ShawarmaSafety.savePoint(this.db)){this.showToast(t('No se pudo comprobar la protección local. No se limpiaron pedidos.','Local protection could not be verified. No orders were cleared.'),'error');return false;}
    const context={eventId,inFlight:null,confirmed:new Set()};this.serviceClearing=context;this.safetyClosing=true;this.renderAdmin();
    const currentEvent=()=>String(this.db.event_info?.id||'')===eventId&&!this.safetyConflict;
    async function request(path,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const res=await fetch(path,{...options,cache:'no-store',signal:controller.signal});if(!res.ok)throw Error('Unconfirmed request');return await res.json();}finally{clearTimeout(timer);}}
    async function readCurrent(){const data=await request('/api/orders');if(!data||String(data.event_info?.id||'')!==eventId||!Array.isArray(data.orders)||!currentEvent())throw Error('Event changed');return data;}
    try {
      this.showToast(t('Limpiando pedidos. No tomes pedidos en otros equipos hasta terminar.','Clearing orders. Do not take orders on other devices until finished.'),'info');
      for(const target of targets){
        // Recheck each exact target. Never delete an order added after confirmation.
        const current=await readCurrent(),found=current.orders.find(o=>String(o.id)===String(target.id));
        if(!found||JSON.stringify(found)!==JSON.stringify(target))throw Error('Order changed; confirm again');
        context.inFlight=String(target.id);
        const result=await request('/api/orders/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:target.id})});
        if(String(result.deleted_id)!==String(target.id)||!currentEvent())throw Error('Deletion unconfirmed');
        context.confirmed.add(String(target.id));
        const next=copy(this.db);next.orders=next.orders.filter(o=>String(o.id)!==String(target.id));this.syncData(next,true);context.inFlight=null;
        if(!currentEvent())throw Error('Unexpected update');
      }
      const latest=await readCurrent();
      if(latest.orders.some(o=>context.confirmed.has(String(o.id))))throw Error('Deletion not reflected by server');
      if(latest.orders.length===0){
        if(!latest.event_info)latest.event_info={};
        latest.event_info.turn_counter=0;
        try{await request('/api/event/reset_turns',{method:'POST'});}catch(e){}
      }
      this.syncData(latest,true);if(!currentEvent())throw Error('Unexpected update');
      this.resetForm();
      this.updatePreviewAndTurn();
      this.showToast(latest.orders.length?t('Se limpiaron los pedidos confirmados. Los pedidos nuevos se conservaron. El evento sigue abierto.','Confirmed orders cleared. New orders were kept. The event remains open.'):t('Pedidos limpiados y contador reiniciado al Turno #1.','Orders cleared and counter reset to Turn #1.'),'success');return true;
    } catch {
      this.showToast(t('Limpieza incompleta o sin confirmar. Se detuvo; no se cerró el evento. Algunos pedidos pueden haberse eliminado. Revisa cocina y la conexión antes de repetir.','Clearing was incomplete or unconfirmed and has stopped. The event was not closed. Some orders may have been deleted. Check the kitchen and connection before retrying.'),'error');return false;
    } finally {this.serviceClearing=null;this.safetyClosing=false;this.renderAdmin();}
  };
  const renderAdmin=proto.renderAdmin;
  proto.renderAdmin=function(...args){renderAdmin.apply(this,args);const button=document.querySelector('.s-clear-button');if(button)button.disabled=!!this.serviceClearing;};
  const openReport=proto.showClientInvoiceModal,closeReport=proto.closeClientInvoiceModal;
  proto.showClientInvoiceModal=function(){this.serviceReportReturnFocus=document.activeElement;openReport.call(this);};
  proto.closeClientInvoiceModal=function(){closeReport.call(this);if($('client-invoice-modal').style.display==='none')this.serviceReportReturnFocus?.focus?.();};
  document.addEventListener('keydown',event=>{const modal=$('client-invoice-modal');if(modal?.style.display!=='flex')return;if(event.key==='Escape'){event.preventDefault();app.closeClientInvoiceModal();}if(event.key==='Tab'){const nodes=[...modal.querySelectorAll('button,input,textarea,summary')].filter(n=>!n.disabled&&n.getClientRects?.().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
  const start=proto.init;
  proto.init=function(...args){start.apply(this,args);setupNames();setupMobileChrome();for(const key of ['solo-carnes','sin-cebolla','sin-pepinillo','sin-tomate'])if($('preset-'+key))$('preset-'+key).hidden=true;$('preset-bowl')?.setAttribute('title','Toca de nuevo para volver a shawarma');this.updatePresetPills();};
  window.ShawarmaService={suggest,normalize,eventRows,summarize,reportMarkup,timerSeconds,columns,cells,download,META,t,measureMobileChrome,refreshMobileReview,confirmMobileReview};
})();
