/* Extiende la primera apariencia Premium. Conserva AppState, API y datos. */
(() => {
  'use strict';
  const app=window.app, proto=Object.getPrototypeOf(app), ui=window.ShawarmaPremium;
  const {icon,esc,title,recipeHTML,orderUnits,proteinIcon,elapsed,duration,stripEmoji,specialClasses,specialLabelsHTML}=ui;
  const $=id=>document.getElementById(id);
  const text=(id,value)=>{if($(id))$(id).textContent=value;};
  const html=(id,value)=>{if($(id))$(id).innerHTML=value;};
  const statusText={pending:'Por preparar',preparing:'En preparación',ready:'Listo para entregar',delivered:'Entregado',cancelled:'Cancelado'};
  const units=o=>orderUnits(o).reduce((sum,x)=>sum+x.quantity,0);
  const button=(label,glyph,action,extra='')=>`<button type="button" class="u-button ${extra}" onclick="${action}">${icon(glyph)}<span>${label}</span></button>`;
  const heading=(label,glyph,sub='')=>`<div class="u-section-title"><h2>${icon(glyph)}${label}</h2>${sub?`<p>${sub}</p>`:''}</div>`;
  const metric=(id,label,glyph)=>`<div class="u-metric">${glyph?icon(glyph):''}<strong id="${id}">0</strong><span>${label}</span></div>`;
  const card=(content,cls='')=>`<section class="pos-card u-card ${cls}">${content}</section>`;
  function adminTemplate() {
    return `<div class="u-page-heading"><div><span class="p-eyebrow">Configuración y servicio</span><h1>Administración</h1></div><p>El mismo sistema. Todo en su lugar.</p></div>
    <div class="u-admin-grid">
      ${card(heading('Apariencia','settings','La misma interfaz en Mac, iPad y celular.')+`<div class="u-theme-options">${[['noche','Noche','monitor'],['dia','Día','check'],['auto','Automático','settings']].map(([id,label,glyph])=>`<button type="button" class="u-button" id="btn-theme-${id}" onclick="app.setTheme('${id}')">${icon(glyph)}${label}</button>`).join('')}</div><div class="u-language-setting"><span id="u-language-label">Idioma de este dispositivo</span><div class="u-language-options" role="group" aria-labelledby="u-language-label"><button type="button" class="u-button" id="u-language-es" lang="es" data-i18n-ignore onclick="app.setLanguage('es')" aria-pressed="true">Español</button><button type="button" class="u-button" id="u-language-en" lang="en" data-i18n-ignore onclick="app.setLanguage('en')" aria-pressed="false">English</button></div></div>`)}
      ${card(heading('Dispositivo y operador','person')+`<div class="u-between"><div><strong id="admin-operator-display">Dispositivo 1</strong><p class="u-muted">Identifica quién toma los pedidos.</p></div>${button('Cambiar nombre','edit','app.promptChangeOperator()')}</div>`)}
      ${card(heading('Conexión entre pantallas','monitor','Pedidos, cocina y monitor deben usar el mismo servidor.')+`<div class="u-address" id="admin-url-text"></div><p class="u-muted" id="u-network-note"></p>`,'u-full')}
      ${card(heading('Resumen del evento','order')+`<div class="u-metrics u-event-metrics">${metric('stat-total','Total unidades','order')}${metric('stat-mixto','Mixto','wrap')}${metric('stat-pollo','Pollo','chicken')}${metric('stat-carne','Carne','meat')}${metric('stat-falafel','Falafel','falafel')}${metric('stat-bowls','Bowls · sin pan','bowl')}</div><p class="u-stats-note">Las proteínas incluyen los bowls. Bowls es un dato adicional, no se suma otra vez al total.</p><div class="u-actions">${button('Resumen para el cliente','order','app.showClientInvoiceModal()','u-primary')}${button('Exportar pedidos CSV','list','app.exportRawCSV()')}</div>`,'u-full')}
      <section id="finance-locked-card" class="pos-card u-card u-full u-between"><div>${heading('Costos y rentabilidad','settings')}<p class="u-muted">Accede con el PIN financiero configurado en este dispositivo.</p></div>${button('Abrir módulo financiero','settings','app.promptUnlockFinance()')}</section>
      <section id="finance-unlocked-card" class="pos-card u-card u-full" style="display:none">
        <div class="u-between">${heading('Costos y rentabilidad','settings')}<div class="u-actions">${button('Cambiar PIN','edit','app.changeFinancePinPrompt()')}${button('Bloquear','close','app.lockFinance()')}</div></div>
        <div class="u-actions">${button('Editar insumos y empaques','edit','app.toggleCostSettingsModal(true)')}${button('Agregar renglón','plus','app.addSupplyRow()')}${button('Exportar costos CSV','list','app.exportFinancialCSV()')}</div>
        <div class="u-finance-inputs"><label>Ingreso del evento ($)<input type="number" step="0.01" min="0" id="cost-input-revenue" placeholder="0.00" oninput="app.recalculateCosts()"></label><label>Logística y otros gastos ($)<input type="number" step="0.01" min="0" id="cost-input-logistics" placeholder="0.00" oninput="app.recalculateCosts()"></label></div>
        <div class="u-metrics">${metric('kpi-cost-total','Costo de insumos')}${metric('kpi-profit-net','Resultado neto')}${metric('kpi-margin-pct','Margen')}${metric('kpi-cost-per-unit','Costo por unidad')}${metric('kpi-single-plate-cost','Mixto estándar')}</div>
        <h3 class="u-subheading">Insumos y empaques</h3><div class="u-table-scroll" tabindex="0" role="region" aria-label="Desglose de costos"><table class="u-table"><thead><tr><th>Insumo</th><th>Uso</th><th>Cantidad</th><th>Costo unitario</th><th>Subtotal</th></tr></thead><tbody id="cost-breakdown-tbody"></tbody></table></div>
      </section>
      ${card(heading('Historial y respaldos','box','Consulta los eventos archivados y descarga una copia.')+`<div class="u-metrics u-two-metrics">${metric('vault-total-orders','Comandas guardadas')}${metric('vault-total-events','Eventos archivados')}</div><div id="vault-events-list" class="u-archive-list"></div><div class="u-actions">${button('Exportar historial CSV','list','app.exportVaultCSV()')}${button('Abrir respaldo JSON','box','app.openRecoveryFile()')}</div><input id="s-recovery-file" type="file" accept="application/json,.json" hidden onchange="app.inspectRecoveryFile(this.files[0]);this.value=''"><div id="s-recovery-preview" class="s-recovery-preview" hidden data-i18n-ignore></div><p class="u-muted">Abrir un respaldo permite consultarlo y archivarlo. No restaura pedidos al servidor.</p>`,'u-full')}
      ${card(heading('Protección del evento','box','El respaldo descargado es independiente del navegador. La permanencia del servidor debe verificarse en Render.')+`<p class="u-muted" id="u-safety-storage">Copias de recuperación del dispositivo: sin comprobar.</p><p class="u-muted" id="u-safety-wake">Pantalla activa: sin comprobar.</p><div class="u-actions">${button('Respaldar Excel + JSON','box','app.downloadEventBundle()','u-primary')}${button('Descargar Excel','list','app.exportEventExcel()')}${button('Descargar respaldo JSON','box','app.downloadSafetyBackup()')}${button('Activar / desactivar pantalla activa','monitor','app.toggleScreenAwake()')}</div>`,'u-full')}
      ${card(heading('Cerrar o limpiar evento','alert','Cierra con respaldo o limpia los pedidos de prueba para continuar en el mismo evento.')+`<div class="u-actions">${button('Respaldar y cerrar evento','check','app.closeEventAndStartNext()','u-primary')}${button('Limpiar evento con respaldo','reset','app.closeEventAndStartNext()')}${button('Limpiar sin guardar','trash','app.clearEventWithoutSaving()','u-danger s-clear-button')}</div><p class="u-muted">Limpiar sin guardar no descarga archivos ni archiva el evento. Conserva el historial anterior y continúa la numeración de turnos.</p><p class="u-muted">No hay borrado automático por inactividad. El reloj empieza con el primer pedido o con el botón de inicio; recargar no reinicia el servicio.</p>`,'u-full')}
    </div>`;
  }
  function detailTemplate() {
    return `<section class="u-dialog u-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-turn-title" tabindex="-1">
      <header class="u-dialog-heading"><div><span class="p-eyebrow">Detalle del pedido</span><h2 id="modal-turn-title"></h2></div><button type="button" class="p-icon-button" data-u-action="close-detail" aria-label="Cerrar detalle">${icon('close')}</button></header>
      <div class="p-guest-line"><strong id="modal-guest-name"></strong><span id="modal-table-name"></span></div>
      <div class="u-between"><span id="u-detail-status" class="p-status"></span><span class="u-muted" id="modal-time-detail"></span></div><div id="u-detail-special"></div>
      <div id="modal-ingredients-body" class="u-detail-items"></div>
      <footer class="u-dialog-footer"><button type="button" id="modal-btn-prev" class="u-button" data-u-action="previous-detail">Anterior</button><button type="button" class="u-button u-primary" data-u-action="close-detail">Cerrar detalle</button><button type="button" id="modal-btn-next" class="u-button" data-u-action="next-detail">Siguiente</button></footer>
    </section>`;
  }
  function costTemplate() {
    return `<section class="u-dialog u-supplies-dialog" role="dialog" aria-modal="true" aria-labelledby="u-cost-title"><header class="u-dialog-heading"><h2 id="u-cost-title">${icon('settings')}Insumos y empaques</h2>${button('Cerrar','close','app.toggleCostSettingsModal(false)')}</header><p class="u-muted">Edita nombres, descripción y precios. La descripción es informativa: no cambia el cálculo automático existente. En renglones nuevos, indica cuántas unidades o porciones usaste en este evento.</p><p class="u-muted">Los ajustes se guardan en este navegador; no se sincronizan con otros dispositivos.</p><div class="u-actions">${button('Agregar renglón','plus','app.addSupplyRow()')}</div><div id="cost-settings-inputs-list" class="u-cost-list"></div><footer class="u-dialog-footer">${button('Restablecer originales','reset','app.resetCostConfigToDefault()')}${button('Guardar y recalcular','check','app.saveCostSettingsFromModal()','u-primary')}</footer></section>`;
  }
  function pinTemplate() {
    return `<section class="u-dialog u-pin-dialog" role="dialog" aria-modal="true" aria-labelledby="u-pin-title"><header class="u-dialog-heading"><h2 id="u-pin-title">Acceso financiero</h2></header><p class="u-muted">Ingresa el PIN de cuatro dígitos de este dispositivo.</p><label class="u-pin-label">PIN<input type="password" inputmode="numeric" autocomplete="off" id="input-finance-pin" maxlength="4" placeholder="••••" onkeydown="if(event.key==='Enter') app.submitFinancePin()"></label><div class="u-actions">${button('Cancelar','close','app.closeFinancePinModal()')}${button('Entrar','check','app.submitFinancePin()','u-primary')}</div>${button('Restablecer PIN','reset','app.resetFinancePinPrompt()','u-text-button')}</section>`;
  }
  function renderMonitorCard(order) {
    const ready=order.status==='ready';
    const entries=orderUnits(order),item=entries[0]?.item || order,total=units(order);
    const isBowl=item=>item.is_bowl||item.preset==='bowl';
    const shortName=item=>`${isBowl(item)?'Bowl · ':''}${item.protein||'Shawarma'}`;
    const bowls=entries.filter(({item})=>isBowl(item)).reduce((n,{quantity})=>n+quantity,0);
    const countLabel=bowls===0?`${total} shawarmas`:bowls===total?`${total} bowls`:`${total-bowls} shawarmas · ${bowls} bowls`;
    const composition=new Map();
    entries.forEach(({item,quantity})=>{const name=shortName(item);composition.set(name,(composition.get(name)||0)+quantity);});
    const product=entries.length===1?`${total>1?total+' × ':''}${shortName(item)}`:`${countLabel} · ${[...composition].map(([name,quantity])=>`${quantity} ${name}`).join(' + ')}`;
    const fullProduct=entries.length===1?`${total>1?total+' × ':''}${title(item)}`:product;
    const guest=order.guest_name||'Sin nombre',identity=order.table?`${guest} · ${order.table}`:guest;
    const status=ready?'Listo':order.status==='preparing'?'Preparando':'En cola';
    const statusDescription=ready?'Listo para retirar':statusText[order.status]||'Revisar estado';
    const special=specialLabelsHTML(order);
    const {birthday,kids}=ui.specialOrder(order);
    const accessibleLabel=`Ver detalle del turno ${order.turn}, ${identity}, ${fullProduct}, ${statusDescription}${birthday?', Cumpleañero':''}${kids?', Infantil':''}`;
    return `<button type="button" class="u-turn-card ${ready?'u-ready':''} ${specialClasses(order)}" data-p-action="detail" data-id="${esc(order.id)}" aria-haspopup="dialog" aria-controls="order-detail-modal" aria-label="${esc(accessibleLabel)}">
      <span class="u-turn-index"><span class="u-turn-label">Turno</span><strong class="u-turn-number">#${esc(order.turn)}</strong></span>
      <span class="u-turn-main"><strong class="u-turn-guest" title="${esc(identity)}">${esc(identity)}</strong><span class="u-turn-product" title="${esc(fullProduct)}">${icon(entries.length>1?'group':isBowl(item)?'bowl':proteinIcon(item.protein))}<span>${esc(product)}</span></span></span>
      <span class="u-turn-end"><span class="u-turn-status p-status p-status-${esc(order.status)}" title="${esc(statusDescription)}">${esc(status)}</span><span class="u-turn-open">Ver detalle</span></span>
      ${special?`<span class="u-turn-highlights">${special}</span>`:''}
    </button>`;
  }
  proto.renderDisplay=function() {
    ui.syncSpecialMotion();
    const orders=[...(this.db.orders||[])].sort((a,b)=>Number(a.turn)-Number(b.turn));
    const prep=orders.filter(o=>['pending','preparing'].includes(o.status)),ready=orders.filter(o=>o.status==='ready');
    html('display-prep-list',prep.length?prep.map(renderMonitorCard).join(''):`<div class="p-empty">${icon('kitchen')}<h2>Cocina al día</h2><p>No hay pedidos en preparación.</p></div>`);
    html('display-ready-list',ready.length?ready.map(renderMonitorCard).join(''):`<div class="p-empty">${icon('check')}<h2>Aquí aparecerán los listos</h2><p>Espera a que cocina confirme la preparación.</p></div>`);
    document.querySelectorAll('#view-display .turn-column-header').forEach((el,i)=>{el.innerHTML=`${icon(i?'check':'kitchen')}<span>${i?'Listos para entregar':'En preparación'}</span><strong class="u-count">${i?ready.length:prep.length}</strong>`;});
  };
  function fillDetail(state,order) {
    ui.syncSpecialMotion();
    const dialog=$('order-detail-modal').querySelector('.u-detail-dialog');
    if(dialog)dialog.className=`u-dialog u-detail-dialog ${specialClasses(order)}`;
    html('u-detail-special',specialLabelsHTML(order));
    text('modal-turn-title',`Turno #${order.turn}`);
    text('modal-guest-name',order.guest_name||'Sin nombre');
    html('modal-table-name',order.table?`${icon('pin')}${esc(order.table)}`:'');
    text('u-detail-status',statusText[order.status]||'Revisar estado');
    $('u-detail-status').className=`p-status p-status-${order.status}`;
    const date=new Date(order.created_at);
    text('modal-time-detail',`Recibido ${Number.isFinite(date.getTime())?date.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}):'—'} · ${units(order)} ${units(order)===1?'shawarma':'shawarmas'}`);
    const recipeMarkup=orderUnits(order).map(({item,quantity},i)=>`<section class="p-ticket-item"><h3>${icon(proteinIcon(item.protein))}${order.is_group?`<span class="p-item-number">${i+1}</span>`:''}${quantity>1?`${quantity} × `:''}${esc(title(item))}</h3>${recipeHTML(item,true)}${item.notes?`<p class="p-note">${icon('edit')}${esc(item.notes)}</p>`:''}<p class="u-preparation">${icon(item.is_bowl||item.preset==='bowl'?'bowl':'wrap')}${item.is_bowl||item.preset==='bowl'?'Servido en plato, sin pan':'Envuelto y tostado en plancha'}</p></section>`).join('');
    const body=$('modal-ingredients-body'),recipeKey=String(order.id)+'|'+recipeMarkup;
    if(body.dataset.recipeKey!==recipeKey){body.innerHTML=recipeMarkup;body.dataset.recipeKey=recipeKey;}
    const orders=[...(state.db.orders||[])].sort((a,b)=>Number(a.turn)-Number(b.turn));
    const index=orders.indexOf(order);
    $('modal-btn-prev').disabled=index<=0;$('modal-btn-next').disabled=index>=orders.length-1;
  }
  proto.openModal=function(id) {
    const order=(this.db.orders||[]).find(o=>String(o.id)===String(id)) || (this.db.orders||[]).find(o=>String(o.turn)===String(id));
    if(!order)return;
    const modal=$('order-detail-modal');
    if(modal.style.display!=='flex')this.uReturnFocus=document.activeElement;
    this.currentModalOrderId=order.id;fillDetail(this,order);
    modal.style.display='flex';document.body.classList.add('u-modal-open');
    modal.querySelector('[data-u-action="close-detail"]')?.focus();
  };
  proto.navigateModal=function(direction) {
    const orders=[...(this.db.orders||[])].sort((a,b)=>Number(a.turn)-Number(b.turn));
    const index=orders.findIndex(o=>String(o.id)===String(this.currentModalOrderId));
    if(index>=0 && orders[index+direction])this.openModal(orders[index+direction].id);
  };
  proto.closeModal=function(event) {
    if(event && event.target!==$('order-detail-modal'))return;
    if($('order-detail-modal').style.display!=='flex')return;
    $('order-detail-modal').style.display='none';document.body.classList.remove('u-modal-open');this.currentModalOrderId=null;
    this.uReturnFocus?.focus?.();this.uReturnFocus=null;
  };
  proto.renderAdmin=function() {
    const all=(this.db.orders||[]).filter(o=>o.status!=='cancelled').flatMap(orderUnits);
    text('stat-total',all.reduce((sum,x)=>sum+x.quantity,0));
    text('stat-bowls',all.filter(x=>x.item.is_bowl||x.item.preset==='bowl').reduce((sum,x)=>sum+x.quantity,0));
    ['Mixto','Pollo','Carne','Falafel'].forEach(p=>text('stat-'+p.toLowerCase(),all.filter(x=>x.item.protein===p).reduce((sum,x)=>sum+x.quantity,0)));
    this.updateOperatorDisplay();
    $('finance-locked-card').style.display=this.isFinanceUnlocked?'none':'flex';
    $('finance-unlocked-card').style.display=this.isFinanceUnlocked?'block':'none';
    if(this.isFinanceUnlocked)this.recalculateCosts();
    const archives=this.getVaultArchives();text('vault-total-orders',this.getVaultOrders().length);text('vault-total-events',archives.length);
    html('vault-events-list',archives.length?archives.map((evt,index)=>{
      const d=new Date(evt.date),date=Number.isFinite(d.getTime())?d.toLocaleString('es',{dateStyle:'short',timeStyle:'short'}):'Fecha no registrada';
      return `<article class="u-archive"><div><h3>${icon('box')}${esc(evt.name||'Evento de catering')}</h3><p>${esc(date)} · ${esc(evt.total_orders||evt.orders?.length||0)} pedidos · ${esc(evt.operator||'Dispositivo 1')}</p></div><div class="u-actions">${button('Exportar CSV','list',`app.exportSingleEventCSV(${index})`)}${button('Eliminar','trash',`app.deleteArchivedEventPrompt(${index})`,'u-danger')}</div></article>`;
    }).join(''):'<p class="u-empty-message">No hay eventos archivados. Al cerrar un evento con respaldo aparecerá aquí.</p>');
    const origin=window.location.origin;
    text('admin-url-text',this.isLocalPreview?'Prueba local · este navegador':/^https?:\/\//.test(origin)?origin:'Abre la aplicación desde su servidor');
    text('u-network-note',this.isLocalPreview?'No sincroniza otros dispositivos. Los datos de prueba se borran al recargar.':/^http:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(origin)?'Esta dirección sirve en este equipo. En iPad o celular usa la IP local del Mac y el mismo puerto, dentro de la misma red.':'Para el servicio local, conecta los dispositivos a la misma red y utiliza la dirección del Mac servidor.');
  };
  proto.renderCostSettingsInputs=function() {
    const cfg=this.costConfig||DEFAULT_COST_CONFIG;
    html('cost-settings-inputs-list',Object.entries(cfg).map(([key,item])=>{
      const price=parseFloat(item.pack_price ?? item.unit_cost ?? 0),qty=parseFloat(item.pack_qty||1);
      return `<div class="u-cost-row"><div class="u-cost-name"><strong>${esc(stripEmoji(item.name))}</strong><p class="u-muted">${esc(item.qty_formula||'')}</p></div><label>Precio ($)<input type="number" step="0.01" min="0" id="cfg-price-${esc(key)}" data-u-cost-key="${esc(key)}" value="${Number.isFinite(price)?price.toFixed(2):'0.00'}"></label><label>Unidades<input type="number" step="0.01" min="0.1" id="cfg-qty-${esc(key)}" data-u-cost-key="${esc(key)}" value="${qty>0?qty:1}"></label><div class="u-unit-cost"><span>Por unidad</span><strong id="live-unit-cost-${esc(key)}">$${(price/(qty>0?qty:1)).toFixed(4)}</strong></div></div>`;
    }).join(''));
  };
  const setTheme=proto.setTheme;
  proto.setTheme=function(value,...args) {
    setTheme.call(this,value,...args);
    ['noche','dia','auto'].forEach(v=>$('btn-theme-'+v)?.setAttribute('aria-pressed',String(v===value)));
  };
  const sync=proto.syncData;
  proto.syncData=function(...args) {
    sync.apply(this,args);
    if($('order-detail-modal')?.style.display==='flex') {
      const order=(this.db.orders||[]).find(o=>String(o.id)===String(this.currentModalOrderId));
      if(order)fillDetail(this,order);else this.closeModal();
    }
  };
  const switchView=proto.switchView;
  proto.switchView=function(...args) {this.closeModal();switchView.apply(this,args);};
  const showQR=proto.showOrderQRModal;
  proto.showOrderQRModal=function(...args) {this.closeModal();showQR.apply(this,args);};
  function prepareTemplates() {
    html('view-admin',adminTemplate());html('order-detail-modal',detailTemplate());
    html('finance-pin-modal',pinTemplate());html('cost-settings-modal',costTemplate());
    ['order-detail-modal','finance-pin-modal','cost-settings-modal','client-invoice-modal','order-qr-modal'].forEach(id=>$(id)?.classList.add('u-overlay'));
    // The printable report remains a white document; its controls match the app.
    const invoice=$('client-invoice-modal');
    if(invoice) {
      const bar=invoice.querySelector('.no-print');
      if(bar)bar.innerHTML=`<div class="u-actions"><button type="button" id="btn-lang-es" class="u-button" onclick="app.setInvoiceLang('es')">Español</button><button type="button" id="btn-lang-en" class="u-button" onclick="app.setInvoiceLang('en')">English</button></div><div class="u-actions"><button type="button" class="u-button" onclick="window.print()">${icon('order')}<span id="btn-print-label">Imprimir / PDF</span></button><button type="button" class="u-button" onclick="app.copyInvoiceToClipboard()">${icon('list')}<span id="btn-whatsapp-label">Copiar WhatsApp</span></button>${button('Cerrar','close','app.closeClientInvoiceModal()')}</div>`;
    }
    document.addEventListener('input',event=>{const key=event.target.dataset?.uCostKey;if(key)app.updateLiveUnitCost(key);});
    document.addEventListener('click',event=>{
      const action=event.target.closest('[data-u-action]')?.dataset.uAction;
      if(action==='close-detail')app.closeModal();
      if(action==='previous-detail')app.navigateModal(-1);
      if(action==='next-detail')app.navigateModal(1);
    });
    document.addEventListener('keydown',event=>{
      const modal=$('order-detail-modal');if(modal.style.display!=='flex')return;
      if(event.key==='Escape'){event.preventDefault();app.closeModal();}
      if(event.key==='Tab') {
        const nodes=[...modal.querySelectorAll('button:not([disabled]),summary,[tabindex="0"]')];
        const first=nodes[0],last=nodes[nodes.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
      }
    });
  }
  const init=proto.init;
  proto.init=function() {prepareTemplates();init.call(this);this.renderDisplay();this.renderAdmin();};
  window.ShawarmaUnified={adminTemplate,detailTemplate,costTemplate,pinTemplate,renderMonitorCard,prepareTemplates,fillDetail};
})();
