/* Supplemental recovery, never a substitute for durable SERVER storage.
 * No timer deletes records. No automatic restore/merge into the server.
 * The existing Ruby server still requires the production audit's corrections.
 */
(() => {
  'use strict';
  const app=window.app,proto=Object.getPrototypeOf(app),ui=window.ShawarmaPremium;
  const KEY='shawarma_recovery_points_v1',DRAFT_KEY='shawarma_unconfirmed_submission_v1';
  const $=id=>document.getElementById(id),copy=x=>JSON.parse(JSON.stringify(x));
  const valid=x=>!!x && typeof x==='object' && x.event_info && Array.isArray(x.orders);
  const eventId=x=>String(x?.event_info?.id||'legacy-event');
  function readPoints(){const points=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(points))throw Error('Invalid recovery storage');return points;}
  function savePoint(state) {
    if(!valid(state)||!state.orders.length)return true;
    try {
      const points=readPoints(),id=eventId(state),index=points.findIndex(p=>p.id===id),previous=points[index];
      const point={id,updated_at:new Date().toISOString(),latest:copy(state)};
      if(previous?.beforeReduction)point.beforeReduction=previous.beforeReduction;
      if(previous?.latest?.orders?.length>state.orders.length)point.beforeReduction=previous.latest;
      if(index<0)points.push(point);else points[index]=point;
      localStorage.setItem(KEY,JSON.stringify(points));
      app.safetyStorageError=false;return true;
    } catch(error) {app.safetyStorageError=true;return false;}
  }
  function showSafetyState() {
    if($('u-safety-storage'))$('u-safety-storage').textContent=app.isLocalPreview?'Demostración temporal: se borra al recargar.':app.safetyStorageError?'No se pudo guardar la copia del dispositivo. Descarga un JSON y revisa el almacenamiento.':'Copia auxiliar en este navegador; no sustituye el disco persistente ni el respaldo descargado.';
    if($('u-safety-wake'))$('u-safety-wake').textContent=app.safetyWakeMessage||'Pantalla activa: pendiente de comprobar.';
    const box=$('u-safety-notice');if(!box)return;
    box.hidden=!(app.safetyConflict||app.safetyStorageError||app.safetyUnconfirmed);
    if(app.safetyUnconfirmed && !app.safetyConflict){box.innerHTML='<strong>Hay un envío sin confirmar.</strong><p>No se ha creado un turno local ni se reenviará automáticamente. Conservamos el formulario. Comprueba en cocina si llegó antes de repetirlo.</p><div class="u-actions"><button type="button" class="u-button" onclick="app.downloadSafetyBackup()">Descargar respaldo JSON</button><button type="button" class="u-button" onclick="app.reviewUnconfirmedSubmission()">Ya revisé el envío en cocina</button></div>';return;}
    if(!box.hidden)box.innerHTML=`<strong>${app.safetyConflict?'El servidor devolvió otro evento o faltan pedidos.':'No se confirmó el guardado local.'}</strong><p>${app.safetyConflict?'Conservamos en pantalla la información anterior. No se mezclará ni se enviará automáticamente al servidor. Revisa antes de continuar.':'No borres datos ni cierres el evento hasta disponer de un respaldo verificable.'}</p><div class="u-actions"><button type="button" class="u-button" onclick="app.downloadSafetyBackup()">Descargar respaldo JSON</button>${app.safetyConflict?'<button type="button" class="u-button" onclick="app.acceptServerEvent()">Revisar cambio de evento</button>':''}</div>`;
  }
  function refresh(state) {
    state.updatePreviewAndTurn();
    if(state.currentView==='kitchen')state.renderKDS();
    if(state.currentView==='display')state.renderDisplay();
    if(state.currentView==='admin')state.renderAdmin();
    if(state.currentView==='guest')state.renderGuestView();
    const badge=$('badge-kds-count');if(badge)badge.textContent=(state.db.orders||[]).filter(o=>['pending','preparing'].includes(o.status)).length;
    if($('order-detail-modal')?.style.display==='flex') {
      const order=state.db.orders.find(o=>String(o.id)===String(state.currentModalOrderId));
      if(order)window.ShawarmaUnified.fillDetail(state,order);else state.closeModal();
    }
    showSafetyState();
  }
  proto.syncData=function(data,saveCache=true) {
    if(!valid(data))return;
    const previous=this.db,previousHasOrders=valid(previous)&&previous.orders.length>0;
    if(previousHasOrders)savePoint(previous);
    const receivedIds=new Set(data.orders.map(o=>String(o.id)));
    const unexpected=previousHasOrders && (eventId(previous)!==eventId(data)||previous.orders.some(o=>!receivedIds.has(String(o.id))));
    // During an explicit clear, only the single requested deletion may disappear.
    // Other missing orders or a changed event still require manual review.
    const clearing=this.serviceClearing;
    const expectedClear=clearing && eventId(data)===clearing.eventId && eventId(previous)===clearing.eventId && previous.orders.filter(o=>!receivedIds.has(String(o.id))).every(o=>String(o.id)===clearing.inFlight||clearing.confirmed.has(String(o.id)));
    if(unexpected && !this.safetyAcceptOnce && !expectedClear) {
      this.safetyConflict=copy(data);showSafetyState();return;
    }
    this.safetyAcceptOnce=false;this.safetyConflict=null;
    this.db=data;
    savePoint(data);
    this.recordInVault(data.orders);
    if(saveCache) {
      try {localStorage.setItem('shawarma_db_v6',JSON.stringify(data));}catch(error){this.safetyStorageError=true;}
      if(this.broadcast)this.broadcast.postMessage({db:data});
    }
    refresh(this);
  };
  proto.buildSafetyBackup=function() {
    let points=[];try{points=readPoints();}catch(error){this.safetyStorageError=true;}
    return {format:'shawarma-recovery',version:1,exported_at:new Date().toISOString(),current_event:copy(this.db),unconfirmed_submission:this.safetyUnconfirmed||null,recovery_points:points,archived_events:this.getVaultArchives(),cost_config:copy(this.costConfig||{}),note:'Contiene datos del negocio y nombres. Guarda este archivo de forma privada. No contiene el PIN.'};
  };
  proto.downloadSafetyBackup=function() {
    try {
      savePoint(this.db);
      const blob=new Blob([JSON.stringify(this.buildSafetyBackup(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`shawarma_respaldo_${new Date().toISOString().replace(/[:.]/g,'-')}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      this.showToast('Se solicitó descargar el JSON. Comprueba que el archivo exista antes de borrar o cerrar el evento.','info');return true;
    } catch(error){this.showToast('No se pudo generar el respaldo. No borres el evento.','error');return false;}
  };
  proto.acceptServerEvent=function() {
    if(!this.safetyConflict)return;
    const incoming=this.safetyConflict;
    if(!confirm(`Conservas ${this.db.orders.length} pedidos en pantalla. El servidor propone “${incoming.event_info?.name||'otro evento'}” con ${incoming.orders.length}. ¿Ya descargaste el respaldo y quieres ver el estado del servidor?`))return;
    if(!savePoint(this.db)){showSafetyState();return;}
    this.safetyAcceptOnce=true;this.syncData(incoming,true);
  };
  // A legacy helper must never restore an unscoped vault automatically.
  proto.pushOrdersToServer=async function(){this.showToast('La restauración automática está desactivada para no mezclar eventos. Descarga el respaldo y revisa el servidor.','info');};
  proto.restoreVaultToServer=async function(){this.showToast('Restauración masiva detenida por seguridad: primero verifica el evento de destino y el respaldo JSON.','info');};
  const oldRecord=proto.recordInVault;
  proto.recordInVault=function(orders) {
    // Preserve original compatibility, but make quota errors visible via the checkpoint.
    oldRecord.call(this,orders);if(valid(this.db))savePoint(this.db);
  };
  const oldAdmin=proto.renderAdmin;
  proto.renderAdmin=function(...args){oldAdmin.apply(this,args);showSafetyState();};
  async function post(path,payload) {
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
    try {
      const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      if(!res.ok)throw Error('Request not acknowledged');
      return await res.json();
    } finally {clearTimeout(timeout);}
  }
  function applyConfirmed(order,expectedEvent) {
    if(!order?.id || eventId(app.db)!==expectedEvent || app.safetyConflict)throw Error('Invalid or obsolete acknowledgement');
    const data=copy(app.db),index=data.orders.findIndex(o=>String(o.id)===String(order.id));
    if(index<0)data.orders.push(order);else data.orders[index]=order;
    data.event_info.turn_counter=Math.max(Number(data.event_info.turn_counter)||0,Number(order.turn)||0);
    app.syncData(data,true);
  }
  proto.updateStatus=async function(id,status) {
    if(!['pending','preparing','ready','delivered'].includes(status))return false;
    this.safetyStatusPending ||= new Set();if(this.safetyStatusPending.has(id))return false;
    this.safetyStatusPending.add(id);const event=eventId(this.db);
    try {
      const result=await post('/api/orders/status',{id,status});
      if(String(result.order?.id)!==String(id)||result.order.status!==status)throw Error('Unexpected order');
      applyConfirmed(result.order,event);return true;
    } catch(error){this.showToast('Cambio sin confirmar. Conservamos el estado anterior; revisa cocina y la conexión.','error');return false;}
    finally {this.safetyStatusPending.delete(id);}
  };
  proto.deleteOrderPrompt=async function(id,turn) {
    if(this.safetyDeleting)return;
    if(!confirm(`¿Eliminar la comanda Turno #${turn}? Conservaremos un punto de recuperación local. No se quitará de pantalla sin confirmación del servidor.`))return;
    if(!savePoint(this.db)){showSafetyState();return;}
    this.safetyDeleting=true;const event=eventId(this.db);
    try {
      const result=await post('/api/orders/delete',{id});
      if(String(result.deleted_id)!==String(id)||eventId(this.db)!==event)throw Error('Delete not confirmed');
      const next=copy(this.db);next.orders=next.orders.filter(o=>String(o.id)!==String(id));
      this.safetyAcceptOnce=true;this.syncData(next,true);
      this.showToast(`Turno #${turn}: eliminación confirmada. Hay una copia en el respaldo de recuperación.`,'info');
    } catch(error){this.showToast('Eliminación sin confirmar. No quitamos la copia local; revisa el servidor antes de repetir.','error');}
    finally{this.safetyDeleting=false;}
  };
  const oldEdit=proto.editOrder;
  proto.editOrder=function(id){const order=this.db.orders.find(o=>String(o.id)===String(id));if(order?.is_group){this.showToast('La edición de grupos necesita un editor por integrante. No se modificará solo el encabezado.','info');return;}return oldEdit.call(this,id);};
  proto.reviewUnconfirmedSubmission=function() {
    if(!this.safetyUnconfirmed)return;
    if(!confirm('Comprueba el nombre, receta y turno en cocina. Si llegó, NO vuelvas a enviarlo: limpia el formulario. ¿Ya lo verificaste y quieres desbloquear el formulario?'))return;
    try{localStorage.removeItem(DRAFT_KEY);}catch(error){this.safetyStorageError=true;showSafetyState();return;}
    this.safetyUnconfirmed=null;showSafetyState();
  };
  proto.submitOrder=async function() {
    if(this.premiumSubmitting)return;
    if(this.safetyUnconfirmed){this.showToast('Hay un envío pendiente de verificar. Revisa el aviso de seguridad y confirma en cocina antes de repetir.','info');showSafetyState();return;}
    const name=$('guest-name')?.value.trim(),table=$('guest-table')?.value.trim()||'',notes=$('order-notes')?.value.trim()||'';
    if(!name&&!table){this.showToast('Escribe un nombre o una referencia para identificar la entrega.','info');$('guest-name')?.focus();return;}
    const editing=this.editingOrderId,target=this.db.orders.find(o=>o.id===editing);
    if(editing&&(!target||target.is_group)){this.showToast('No se puede editar ese pedido con el editor individual.','info');return;}
    const item={protein:this.selectedProtein,preset:this.selectedPreset,is_bowl:this.selectedPreset==='bowl',ingredients:this.getActive(),removed_ingredients:this.getRemoved(),notes};
    const items=[...this.currentGroupItems,item],group=items.length>1,event=eventId(this.db);
    const payload=editing?{id:editing,guest_name:name||'Comensal',table,...item}:{guest_name:name||'Comensal',table,...item,protein:group?items.map(i=>i.protein).join(' + '):item.protein,preset:group?'grupo':item.preset,is_bowl:items.some(i=>i.is_bowl),is_group:group,items_count:items.length,items,quantity:items.length,operator:this.operatorName||'Dispositivo 1',created_at:new Date().toISOString()};
    this.premiumSubmitting=true;if($('btn-submit-order'))$('btn-submit-order').disabled=true;
    try {
      // Store the intended request before sending; a missing response is ambiguous.
      this.safetyUnconfirmed={event_id:event,editing:editing||null,payload:copy(payload),created_at:new Date().toISOString()};
      try{localStorage.setItem(DRAFT_KEY,JSON.stringify(this.safetyUnconfirmed));}catch(error){this.safetyStorageError=true;}
      const result=await post(editing?'/api/orders/update':'/api/orders',payload);
      if(editing&&String(result.order?.id)!==String(editing))throw Error('Unexpected edit');
      applyConfirmed(result.order,event);
      this.safetyUnconfirmed=null;try{localStorage.removeItem(DRAFT_KEY);}catch(error){this.safetyStorageError=true;}
      this.currentGroupItems=[];this.updateGroupTrayUI();
      if(editing){this.cancelEditOrder();this.switchView('kitchen');}else this.resetForm();
      this.showToast(`Turno #${result.order.turn}: ${editing?'cambio':'recepción'} confirmado por el servidor.`, 'success');
    } catch(error){this.showToast('Envío sin confirmar. No repetimos ni creamos un turno local. Revisa cocina antes de intentarlo otra vez.','error');}
    finally {this.premiumSubmitting=false;if($('btn-submit-order'))$('btn-submit-order').disabled=false;showSafetyState();}
  };
  async function closeEvent() {
    if(app.safetyClosing || app.premiumSubmitting)return;
    if(app.safetyConflict||app.safetyUnconfirmed){showSafetyState();return;}
    if(!confirm('¿Cerrar este evento y comenzar otro? Primero se generará un respaldo. El evento no se vaciará localmente si el servidor no confirma.'))return;
    const beforeExport=JSON.stringify(app.db);
    if(!savePoint(app.db) || !(app.downloadEventBundle?await app.downloadEventBundle():app.downloadSafetyBackup())){showSafetyState();return;}
    if(beforeExport!==JSON.stringify(app.db)){app.showToast('El evento cambió mientras se generaba el respaldo. Descárgalo de nuevo antes de cerrar.','info');return;}
    if(!confirm('Abre Descargas y comprueba que puedes abrir el respaldo y que contiene tus pedidos. ¿Confirmas que ya lo guardaste y deseas cerrar el evento?'))return;
    const original=copy(app.db);
    app.safetyClosing=true;
    try {
      // Recheck the event before a destructive request. This is not server-side authorization.
      const check=await fetch('/api/orders',{cache:'no-store'});
      if(!check.ok)throw Error('Cannot verify server');
      const current=await check.json();
      if(!valid(current)||eventId(current)!==eventId(original))throw Error('Different event');
      if(JSON.stringify(current.orders)!==JSON.stringify(original.orders))throw Error('Orders changed; refresh and export again');
      if(!savePoint(current))throw Error('No local recovery copy');
      const archives=JSON.parse(localStorage.getItem('shawarma_event_vault_archives')||'[]');if(!Array.isArray(archives))throw Error('Invalid archive; do not overwrite');
      const entry={id:eventId(original),name:original.event_info.name||'Evento',date:new Date().toISOString(),orders:original.orders,total_orders:original.orders.length,operator:app.operatorName,timer:original.event_info.timer,service_metadata:app.getServiceMeta?.()||{},cost_config:copy(app.costConfig||{})};
      const previous=archives.findIndex(e=>e.id===entry.id);if(previous<0)archives.push(entry);else archives[previous]=entry;
      localStorage.setItem('shawarma_event_vault_archives',JSON.stringify(archives));
      const res=await fetch('/api/event/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:`Evento ${new Date().toLocaleDateString()}`})});
      if(!res.ok)throw Error('Reset not acknowledged');
      const result=await res.json();if(!valid(result.data))throw Error('Invalid acknowledgement');
      app.safetyAcceptOnce=true;app.syncData(result.data,true);app.resetForm();app.switchView('order');
      app.showToast('El servidor confirmó el cierre. Conserva y verifica tu respaldo JSON.','success');
    } catch(error) {
      app.showToast('No se confirmó el cierre completo. No se ha vaciado la copia local. Revisa el servidor antes de repetir.','error');
      showSafetyState();
    } finally {app.safetyClosing=false;}
  }
  proto.closeEventAndStartNext=closeEvent;
  proto.clearEventWithoutSaving=async function(){this.showToast('El borrado sin respaldo está desactivado. Usa cerrar evento con respaldo.','info');};
  // Block operations on a retained, possibly obsolete event until explicitly resolved.
  for(const name of ['submitOrder','updateStatus','deleteOrderPrompt','markNextBatchReady','toggleEventTimer','resetEventTimer']) {
    const original=proto[name];
    proto[name]=function(...args){if(this.safetyConflict||this.safetyClosing){this.showToast('Resuelve el cambio o cierre de evento antes de modificar pedidos.','info');showSafetyState();return;}savePoint(this.db);return original.apply(this,args);};
  }
  proto.requestScreenAwake=async function() {
    if(!this.safetyWakeEnabled || this.isLocalPreview){this.safetyWakeMessage=this.isLocalPreview?'La protección de pantalla se comprueba en la app real HTTPS.':'Pantalla activa: desactivada.';showSafetyState();return;}
    if(this.safetyWakePending || this.safetyWakeLock&&!this.safetyWakeLock.released)return;
    if(document.visibilityState==='hidden'){this.safetyWakeMessage='Pantalla activa: pausada mientras la página está oculta.';showSafetyState();return;}
    if(!window.isSecureContext || !navigator.wakeLock?.request){this.safetyWakeMessage='Pantalla activa no disponible: requiere navegador compatible y HTTPS (o localhost).';showSafetyState();return;}
    this.safetyWakePending=true;
    try {
      const sentinel=await navigator.wakeLock.request('screen');
      if(!this.safetyWakeEnabled){await sentinel.release();return;}
      this.safetyWakeLock=sentinel;this.safetyWakeMessage='Pantalla activa: permiso concedido por el navegador.';
      sentinel.addEventListener('release',()=>{if(this.safetyWakeLock===sentinel){this.safetyWakeLock=null;this.safetyWakeMessage='El dispositivo liberó la pantalla. Revisa batería, bloqueo o visibilidad.';showSafetyState();}});
    } catch(error){this.safetyWakeMessage='No se pudo mantener la pantalla activa. Revisa el bloqueo automático y la batería.';}
    finally{this.safetyWakePending=false;showSafetyState();}
  };
  proto.toggleScreenAwake=async function(){this.safetyWakeEnabled=!this.safetyWakeEnabled;if(!this.safetyWakeEnabled&&this.safetyWakeLock)await this.safetyWakeLock.release();await this.requestScreenAwake();};
  const oldInit=proto.init;
  proto.init=function(...args) {
    try{this.safetyUnconfirmed=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');}catch(error){this.safetyStorageError=true;}
    oldInit.apply(this,args);
    if(!$('u-safety-notice')){const node=document.createElement('aside');node.id='u-safety-notice';node.className='u-safety-notice';node.hidden=true;node.setAttribute('role','status');document.body.prepend(node);}
    this.safetyWakeEnabled=true;
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible'){
        this.requestScreenAwake();
        if(typeof this.fetchServer==='function')this.fetchServer();
      }
    });
    window.addEventListener('pageshow',()=>{if(typeof this.fetchServer==='function')this.fetchServer();});
    document.addEventListener('click',()=>this.requestScreenAwake());
    this.requestScreenAwake();showSafetyState();
  };
  window.ShawarmaSafety={savePoint,readPoints,eventId,valid,showSafetyState,KEY};
})();
