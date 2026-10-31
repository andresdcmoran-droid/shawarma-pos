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
  const metric=(id,label,glyph)=>`<div class="u-metric">${glyph?(glyph.startsWith('<')?glyph:icon(glyph)):''}<strong id="${id}">0</strong><span>${label}</span></div>`;
  const card=(content,cls='')=>`<section class="pos-card u-card ${cls}">${content}</section>`;
  function adminTemplate() {
    return `<div class="u-page-heading"><div><span class="p-eyebrow">Configuración y servicio</span><h1>Administración</h1></div><p>El mismo sistema. Todo en su lugar.</p></div>
    <div class="u-admin-grid">
      ${card(heading('Apariencia','settings','La misma interfaz en Mac, iPad y celular.')+`<div class="u-theme-options">${[['noche','Noche','monitor'],['dia','Día','check'],['auto','Automático','settings']].map(([id,label,glyph])=>`<button type="button" class="u-button" id="btn-theme-${id}" onclick="app.setTheme('${id}')">${icon(glyph)}${label}</button>`).join('')}</div><div class="u-language-setting"><span id="u-language-label">Idioma de este dispositivo</span><div class="u-language-options" role="group" aria-labelledby="u-language-label"><button type="button" class="u-button" id="u-language-es" lang="es" data-i18n-ignore onclick="app.setLanguage('es')" aria-pressed="true">Español</button><button type="button" class="u-button" id="u-language-en" lang="en" data-i18n-ignore onclick="app.setLanguage('en')" aria-pressed="false">English</button></div></div>`)}
      ${card(heading('Dispositivo y operador','person')+`<div class="u-between"><div><strong id="admin-operator-display">Andrés</strong><p class="u-muted">Selecciona el equipo o identifica quién envía mensajes y toma pedidos.</p></div>${button('Otro nombre','edit','app.promptChangeOperator()')}</div><div class="p-operator-presets-row" role="group" aria-label="Equipos predeterminados"><button type="button" class="u-button" data-operator-preset="Andrés" onclick="app.selectOperatorPreset('Andrés')">${icon('person')}<span>Andrés</span></button><button type="button" class="u-button" data-operator-preset="Anaíz" onclick="app.selectOperatorPreset('Anaíz')">${icon('person')}<span>Anaíz</span></button><button type="button" class="u-button" data-operator-preset="Leandro" onclick="app.selectOperatorPreset('Leandro')">${icon('person')}<span>Leandro</span></button></div>`)}
      ${card(heading('Conexión entre pantallas','monitor','Pedidos, cocina y monitor deben usar el mismo servidor.')+`<div class="u-address" id="admin-url-text"></div><p class="u-muted" id="u-network-note"></p>`,'u-full')}
      ${card(heading('Resumen del evento','order')+`<div class="u-metrics u-event-metrics">${metric('stat-total','Total unidades','order')}${metric('stat-mixto','Mixto',proteinIcon('Mixto','white'))}${metric('stat-pollo','Pollo',proteinIcon('Pollo','white'))}${metric('stat-carne','Carne',proteinIcon('Carne','white'))}${metric('stat-falafel','Falafel',proteinIcon('Falafel','white'))}${metric('stat-bowls','Bowls · sin pan','bowl')}</div><p class="u-stats-note">Las proteínas incluyen los bowls. Bowls es un dato adicional, no se suma otra vez al total.</p><div class="u-actions">${button('Resumen para el cliente','order','app.showClientInvoiceModal()','u-primary')}${button('Exportar pedidos CSV','list','app.exportRawCSV()')}</div>`,'u-full')}
      ${card(heading('Código QR de Reseña','qr','Muestra el código QR oficial para que los comensales califiquen el servicio directamente.')+`<div class="u-actions">${button('Mostrar QR de Reseña','star','app.showGoogleReviewQRModal()','u-primary')}</div><p class="u-muted">Pide a los clientes que escaneen el código desde su celular para calificar directamente en segundos.</p>`,'u-full')}
      <section id="finance-locked-card" class="pos-card u-card u-full u-between"><div>${heading('Costos y rentabilidad','settings')}<p class="u-muted">Accede con el PIN financiero configurado en este dispositivo.</p></div>${button('Abrir módulo financiero','settings','app.promptUnlockFinance()')}</section>
      <section id="finance-unlocked-card" class="pos-card u-card u-full" style="display:none">
        <div class="u-between">${heading('Costos y rentabilidad','settings')}<div class="u-actions">${button('Cambiar PIN','edit','app.changeFinancePinPrompt()')}${button('Bloquear','close','app.lockFinance()')}</div></div>
        <div class="u-actions">${button('Editar insumos y empaques','edit','app.toggleCostSettingsModal(true)')}${button('Agregar renglón','plus','app.addSupplyRow()')}${button('Exportar costos CSV','list','app.exportFinancialCSV()')}</div>
        <div class="u-finance-inputs"><label>Cantidad de shawarmas<input type="number" min="0" step="1" id="cost-input-shawarmas" placeholder="0" oninput="app.recalculateCosts()"></label><label>Ingreso del evento ($)<input type="number" step="0.01" min="0" id="cost-input-revenue" placeholder="0.00" oninput="app.recalculateCosts()"></label><label>Logística y otros gastos ($)<input type="number" step="0.01" min="0" id="cost-input-logistics" placeholder="0.00" oninput="app.recalculateCosts()"></label></div>
        <div class="u-metrics">${metric('kpi-cost-total','Costo de insumos')}${metric('kpi-profit-net','Resultado neto')}${metric('kpi-margin-pct','Margen')}${metric('kpi-cost-per-unit','Costo por unidad')}${metric('kpi-single-plate-cost','Mixto estándar')}</div>
        <h3 class="u-subheading">Insumos y empaques</h3><div class="u-table-scroll" tabindex="0" role="region" aria-label="Desglose de costos"><table class="u-table"><thead><tr><th>Insumo</th><th>Uso</th><th>Cantidad</th><th>Costo unitario</th><th>Subtotal</th></tr></thead><tbody id="cost-breakdown-tbody"></tbody></table></div>
      </section>
      ${card(heading('Historial de eventos archivados','box','Consulta los eventos guardados anteriormente y descarga su historial.')+`<div class="u-metrics u-two-metrics">${metric('vault-total-orders','Comandas guardadas')}${metric('vault-total-events','Eventos archivados')}</div><div id="vault-events-list" class="u-archive-list"></div><div class="u-actions">${button('Exportar historial CSV','list','app.exportVaultCSV()')}</div>`,'u-full')}
      ${card(heading('Copia de seguridad del evento activo','box','Descarga una copia completa en archivo ZIP que contiene el Excel para consulta y el JSON para resguardo.')+`<p class="u-muted" id="u-safety-storage">Copias de recuperación del dispositivo: activo.</p><p class="u-muted" id="u-safety-wake">Pantalla activa: disponible.</p><div class="u-actions">${button('Descargar copia de seguridad (Excel + JSON)','box','app.downloadEventBundle()','u-primary')}${button('Mantener pantalla activa','monitor','app.toggleScreenAwake()')}${button('Importar y restaurar respaldo','box','app.openRecoveryFile()')}</div><input id="s-recovery-file" type="file" accept="application/json,.json" hidden onchange="app.inspectRecoveryFile(this.files[0]); this.value=''"><div id="s-recovery-preview" class="s-recovery-preview" hidden></div>`,'u-full')}
      ${card(heading('Gestión y Cierre del Evento','alert','Cierra el evento con respaldo completo para comenzar el siguiente desde el Turno #1, o descarta pedidos de prueba.')+`<div class="u-actions">${button('Cerrar este evento, respaldar y próximo evento','check','app.closeEventBackupAndStartNext()','u-primary')}${button('Cerrar evento sin guardar','trash','app.closeEventWithoutSaving()','u-danger s-clear-button')}${button('Ver resumen / Reporte del evento','list','app.showClientInvoiceModal()')}</div><p class="u-muted"><strong>Cerrar este evento, respaldar y próximo evento:</strong> Guarda automáticamente la copia completa en Excel y JSON, muestra el resumen con el desglose de comandas servidas y reinicia todo el sistema limpiamente en el <strong>Turno #1</strong> para tu siguiente catering.</p><p class="u-muted"><strong>Cerrar evento sin guardar:</strong> Diseñado exclusivamente para pruebas de conexión y rendimiento previas al evento. Descarta todos los pedidos de prueba sin generar respaldos y deja el sistema 100% limpio en el <strong>Turno #1</strong> listo para el catering real.</p>`,'u-full')}
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
    const isDelivered=order.status==='delivered';
    const entries=orderUnits(order),item=entries[0]?.item || order,total=units(order);
    const isBowl=item=>item.is_bowl||item.preset==='bowl';
    const shortName=item=>`${isBowl(item)?'Bowl · ':''}${item.protein||'Shawarma'}`;
    const bowls=entries.filter(({item})=>isBowl(item)).reduce((n,{quantity})=>n+quantity,0);
    const countLabel=bowls===0?`${total} shawarmas`:bowls===total?`${total} bowls`:`${total-bowls} shawarmas · ${bowls} bowls`;
    const composition=new Map();
    entries.forEach(({item,quantity})=>{const name=shortName(item);composition.set(name,(composition.get(name)||0)+quantity);});
    const product=entries.length===1?`${total>1?total+' × ':''}${shortName(item)}`:`${countLabel} · ${[...composition].map(([name,quantity])=>`${quantity} ${name}`).join(' + ')}`;
    const fullProduct=entries.length===1?`${total>1?total+' × ':''}${title(item)}`:product;
    const {birthday,kids}=ui.specialOrder(order);
    const guest=birthday
      ? `⭐ ${ui.formatBirthdayName ? ui.formatBirthdayName(order.guest_name, order.notes) : 'Cumpleañero ' + (order.guest_name||'')}`
      : (order.guest_name||'Sin nombre');
    const identity=order.table?`${guest} · ${order.table}`:guest;
    const status=isDelivered?'Entregado':ready?'Listo':order.status==='preparing'?'Preparando':'En cola';
    const statusDescription=isDelivered?'Entregado al comensal':ready?'Listo para retirar':statusText[order.status]||'Revisar estado';
    const special=specialLabelsHTML(order);
    const accessibleLabel=`Ver detalle del turno ${order.turn}, ${identity}, ${fullProduct}, ${statusDescription}${birthday?', Cumpleañero':''}${kids?', Infantil':''}`;
    return `<button type="button" class="u-turn-card ${ready?'u-ready':''} ${isDelivered?'u-delivered':''} ${specialClasses(order)}" data-p-action="detail" data-id="${esc(order.id)}" aria-haspopup="dialog" aria-controls="order-detail-modal" aria-label="${esc(accessibleLabel)}">
      <span class="u-turn-index"><span class="u-turn-label">Turno</span><strong class="u-turn-number">#${esc(order.turn)}</strong></span>
      <span class="u-turn-main"><strong class="u-turn-guest" title="${esc(identity)}">${esc(identity)}</strong><span class="u-turn-product" title="${esc(fullProduct)}">${icon(entries.length>1?'group':isBowl(item)?'bowl':proteinIcon(item.protein))}<span>${esc(product)}</span></span></span>
      <span class="u-turn-end"><span class="u-turn-status p-status p-status-${esc(order.status)}" title="${esc(statusDescription)}">${esc(status)}</span><span class="u-turn-open">Ver detalle</span></span>
      ${special?`<span class="u-turn-highlights">${special}</span>`:''}
    </button>`;
  }

  proto.getContractedQty=function() {
    const serverVal=Number(this.db?.event_info?.contracted_qty);
    if(Number.isFinite(serverVal)&&serverVal>0)return serverVal;
    const evtId=String(this.db?.event_info?.id||'default');
    const localVal=Number(localStorage.getItem('shawarma_contracted_'+evtId));
    return Number.isFinite(localVal)&&localVal>=0?localVal:0;
  };

  proto.getEventOwnerName=function() {
    const serverOwner=String(this.db?.event_info?.owner_name||'').trim();
    if(serverOwner)return serverOwner;
    const evtId=String(this.db?.event_info?.id||'default');
    const localOwner=String(localStorage.getItem('shawarma_owner_'+evtId)||'').trim();
    if(localOwner)return localOwner;
    try {
      const meta=JSON.parse(localStorage.getItem('shawarma_service_metadata_v1')||'{}');
      if(meta&&typeof meta.client==='string'&&meta.client.trim())return meta.client.trim();
    } catch(e){}
    return '';
  };

  proto.saveEventMeta=async function({qty, ownerName}={}) {
    window.soundEngine?.playClick?.();
    const finalQty = qty !== undefined ? Math.max(0,Math.round(Number(qty)||0)) : this.getContractedQty();
    const finalOwner = ownerName !== undefined ? String(ownerName||'').trim() : this.getEventOwnerName();
    this.db.event_info ||= {};
    this.db.event_info.contracted_qty = finalQty;
    this.db.event_info.owner_name = finalOwner;
    if(finalOwner) this.db.event_info.name = `Evento · ${finalOwner}`;
    const evtId=String(this.db?.event_info?.id||'default');
    try {
      localStorage.setItem('shawarma_contracted_'+evtId,String(finalQty));
      localStorage.setItem('shawarma_owner_'+evtId,finalOwner);
      const meta=JSON.parse(localStorage.getItem('shawarma_service_metadata_v1')||'{}');
      meta.client=finalOwner;
      localStorage.setItem('shawarma_service_metadata_v1',JSON.stringify(meta));
    } catch(e){}
    const inpQty=$('monitor-contracted-input');
    if(inpQty && document.activeElement!==inpQty)inpQty.value=finalQty>0?String(finalQty):'';
    const inpOwner=$('monitor-owner-input');
    if(inpOwner && document.activeElement!==inpOwner)inpOwner.value=finalOwner;
    const svcClientInp=$('service-client');
    if(svcClientInp && document.activeElement!==svcClientInp)svcClientInp.value=finalOwner;
    this.renderDisplay();
    try {
      const res=await fetch('/api/event/meta',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contracted_qty:finalQty, owner_name:finalOwner})
      });
      if(res.ok){
        const data=await res.json();
        if(data.event_info)this.db.event_info=data.event_info;
      }
    } catch(e){}
    this.syncData(this.db,true);
    const msgParts=[];
    if(finalOwner)msgParts.push(`Dueño/Evento: ${finalOwner}`);
    if(finalQty>0)msgParts.push(`${finalQty} shawarmas contratados`);
    this.showToast(msgParts.length?`Registro guardado · ${msgParts.join(' · ')}`:'Datos del evento actualizados.','info');
  };

  proto.setContractedQty=async function(val) {
    const ownerInp=$('monitor-owner-input');
    const ownerVal=ownerInp?ownerInp.value:this.getEventOwnerName();
    return this.saveEventMeta({qty:val, ownerName:ownerVal});
  };

  proto.adjustContractedQty=function(delta) {
    const current=this.getContractedQty();
    this.setContractedQty(Math.max(0,current+Number(delta)));
  };

  proto.saveContractedQtyFromInput=function() {
    const inpQty=$('monitor-contracted-input');
    const inpOwner=$('monitor-owner-input');
    this.saveEventMeta({
      qty: inpQty ? inpQty.value : this.getContractedQty(),
      ownerName: inpOwner ? inpOwner.value : this.getEventOwnerName()
    });
  };

  proto.renderDisplay=function() {
    ui.syncSpecialMotion();
    const orders=[...(this.db.orders||[])].filter(o=>o.status!=='cancelled').sort((a,b)=>Number(a.turn)-Number(b.turn));
    const delivered=orders.filter(o=>o.status==='delivered').sort((a,b)=>Number(a.turn)-Number(b.turn));
    const prep=orders.filter(o=>['pending','preparing'].includes(o.status));
    const ready=orders.filter(o=>o.status==='ready');
    const inKitchen=[...ready,...prep];

    const sumUnits=list=>list.reduce((sum,o)=>sum+units(o),0);
    const deliveredUnits=sumUnits(delivered);
    const prepUnits=sumUnits(prep);
    const readyUnits=sumUnits(ready);
    const inKitchenUnits=prepUnits+readyUnits;
    const totalOrderedUnits=deliveredUnits+inKitchenUnits;
    const contracted=this.getContractedQty();
    const ownerName=this.getEventOwnerName();

    const remainingToDeliver=contracted>0?Math.max(0,contracted-deliveredUnits):0;
    const extraDelivered=contracted>0&&deliveredUnits>contracted?(deliveredUnits-contracted):0;
    const remainingToOrder=contracted>0?Math.max(0,contracted-totalOrderedUnits):0;
    const pctDelivered=contracted>0?Math.min(100,Math.round((deliveredUnits/contracted)*100)):0;
    const pctInKitchen=contracted>0?Math.min(100-pctDelivered,Math.round((inKitchenUnits/contracted)*100)):0;

    const topBar=$('event-monitor-top-bar');
    if(topBar && !topBar.querySelector('#monitor-contracted-input')) {
      topBar.innerHTML=`
        <div class="p-monitor-contract-bar">
          <div class="p-monitor-contract-title">
            ${icon('order')}
            <div>
              <strong>Registro del Evento · Dueño y Cantidad Contratada</strong>
              <span>Guarda el nombre de la persona/dueño del evento y la cantidad de shawarmas contratados</span>
            </div>
          </div>
          <div class="p-monitor-contract-controls">
            <div class="p-monitor-owner-field">
              ${icon('person')}
              <input type="text" id="monitor-owner-input" class="text-input-pos p-owner-input" placeholder="Dueño / Evento (ej: Andrés)" value="${esc(ownerName)}" maxlength="100" onkeydown="if(event.key==='Enter')app.saveContractedQtyFromInput()">
            </div>
            <button type="button" class="u-button" onclick="app.adjustContractedQty(-5)">-5</button>
            <input type="number" id="monitor-contracted-input" class="text-input-pos p-contract-input" min="0" step="1" placeholder="Cant. (40)" value="${contracted>0?contracted:''}" onkeydown="if(event.key==='Enter')app.saveContractedQtyFromInput()">
            <button type="button" class="u-button" onclick="app.adjustContractedQty(5)">+5</button>
            <button type="button" class="u-button" onclick="app.adjustContractedQty(10)">+10</button>
            <button type="button" class="u-button u-primary" onclick="app.saveContractedQtyFromInput()">${icon('check')}<span>Guardar evento</span></button>
          </div>
        </div>
      `;
    } else if (topBar) {
      const inp=$('monitor-contracted-input');
      if(inp && document.activeElement!==inp) inp.value=contracted>0?String(contracted):'';
      const inpOwner=$('monitor-owner-input');
      if(inpOwner && document.activeElement!==inpOwner) inpOwner.value=ownerName;
    }

    const delivItems=delivered.flatMap(orderUnits);
    const byProt={Mixto:0,Pollo:0,Carne:0,Falafel:0,Bowls:0};
    delivItems.forEach(({item,quantity})=>{
      if(byProt[item.protein]!==undefined)byProt[item.protein]+=quantity;
      if(item.is_bowl||item.preset==='bowl')byProt.Bowls+=quantity;
    });

    const deliveredSummaryHTML=`
      <div class="p-monitor-delivered-summary">
        <span class="p-deliv-chip"><strong>${deliveredUnits}</strong> Total entregados</span>
        <span class="p-deliv-chip">Mixto: <strong>${byProt.Mixto}</strong></span>
        <span class="p-deliv-chip">Pollo: <strong>${byProt.Pollo}</strong></span>
        <span class="p-deliv-chip">Carne: <strong>${byProt.Carne}</strong></span>
        <span class="p-deliv-chip">Falafel: <strong>${byProt.Falafel}</strong></span>
        ${byProt.Bowls?`<span class="p-deliv-chip">Bowls: <strong>${byProt.Bowls}</strong></span>`:''}
      </div>
    `;

    html('display-prep-list', deliveredSummaryHTML + (delivered.length
      ? delivered.map(renderMonitorCard).join('')
      : `<div class="p-empty">${icon('box')}<h2>Aún no hay entregados</h2><p>Los pedidos que marques como entregados aparecerán aquí con su conteo exacto.</p></div>`));

    const balanceStatusBanner = contracted <= 0
      ? `<div class="p-balance-banner is-neutral">${icon('alert')}<span>Escribe arriba la cantidad de shawarmas que contrató el cliente (ej. <strong>40</strong>) para activar el descuento automático de faltantes.</span></div>`
      : extraDelivered > 0
        ? `<div class="p-balance-banner is-complete">${icon('check')}<span>¡Meta de <strong>${contracted} shawarmas</strong> cumplida! Se han entregado <strong>+${extraDelivered} adicionales</strong> (${deliveredUnits} en total).</span></div>`
        : remainingToDeliver === 0
          ? `<div class="p-balance-banner is-complete">${icon('check')}<span>¡Meta exacta alcanzada! Se entregaron los <strong>${contracted} shawarmas</strong> contratados.</span></div>`
          : remainingToDeliver <= 5
            ? `<div class="p-balance-banner is-warning">${icon('alert')}<span>¡Atención! Solo faltan <strong>${remainingToDeliver} shawarmas</strong> por entregar para completar los ${contracted} contratados.</span></div>`
            : `<div class="p-balance-banner is-active">${icon('clock')}<span>Se han entregado <strong>${deliveredUnits} de ${contracted}</strong> shawarmas contratados (${pctDelivered}%). Faltan <strong>${remainingToDeliver}</strong> por entregar.</span></div>`;

    const ownerBadgeHTML = ownerName
      ? `<div class="p-balance-owner-badge">${icon('person')}<span>Evento / Dueño: <strong>${esc(ownerName)}</strong></span></div>`
      : '';

    const balanceDashboardHTML = `
      <div class="p-balance-card">
        ${ownerBadgeHTML}
        ${balanceStatusBanner}
        <div class="p-balance-kpis">
          <div class="p-balance-kpi">
            <span>Contratados</span>
            <strong>${contracted > 0 ? contracted : '—'}</strong>
            <small>Meta del evento</small>
          </div>
          <div class="p-balance-kpi is-delivered">
            <span>Ya entregados</span>
            <strong>${deliveredUnits}</strong>
            <small>${delivered.length} ${delivered.length===1?'turno entregado':'turnos entregados'}</small>
          </div>
          <div class="p-balance-kpi is-remaining">
            <span>Faltan por entregar</span>
            <strong>${contracted > 0 ? remainingToDeliver : '—'}</strong>
            <small>${extraDelivered > 0 ? `+${extraDelivered} sobre contrato` : 'Segun lo entregado'}</small>
          </div>
          <div class="p-balance-kpi is-kitchen">
            <span>Faltan por pedir</span>
            <strong>${contracted > 0 ? remainingToOrder : '—'}</strong>
            <small>${inKitchenUnits} ahora en cocina</small>
          </div>
        </div>
        ${contracted > 0 ? `
          <div class="p-balance-progress-wrap">
            <div class="p-balance-progress-labels">
              <span>Avance de entregas: <strong>${pctDelivered}%</strong> (${deliveredUnits}/${contracted})</span>
              <span>En preparación/listos ahora: <strong>${inKitchenUnits} uds</strong></span>
            </div>
            <div class="p-balance-progress-track">
              <div class="p-balance-progress-fill is-delivered" style="width:${pctDelivered}%"></div>
              <div class="p-balance-progress-fill is-kitchen" style="width:${pctInKitchen}%"></div>
            </div>
          </div>
        ` : ''}
      </div>
      <div class="p-balance-in-progress">
        <h3 class="p-balance-subtitle">${icon('kitchen')}<span>En preparación y listos ahora (${inKitchenUnits} shawarmas en ${inKitchen.length} turnos)</span></h3>
        ${inKitchen.length ? `<div class="p-balance-active-list">${inKitchen.map(renderMonitorCard).join('')}</div>` : `<p class="u-muted" style="padding:8px 0;">No hay pedidos activos en cocina en este momento.</p>`}
      </div>
    `;

    html('display-ready-list', balanceDashboardHTML);
    document.querySelectorAll('#view-display .turn-column-header').forEach((el,i)=>{
      el.innerHTML=`${icon(i?'monitor':'box')}<span>${i?'Balance de los que faltan':'Entregados'}</span><strong class="u-count">${i?(contracted>0?`${remainingToDeliver} faltan`:`${totalOrderedUnits} pedidos`):`${deliveredUnits} uds`}</strong>`;
    });
  };
  function fillDetail(state,order) {
    ui.syncSpecialMotion();
    const dialog=$('order-detail-modal').querySelector('.u-detail-dialog');
    if(dialog)dialog.className=`u-dialog u-detail-dialog ${order.status==='ready'?'u-ready-detail':''} ${specialClasses(order)}`;
    html('u-detail-special',specialLabelsHTML(order));
    text('modal-turn-title',`Turno #${order.turn}`);
    text('modal-guest-name',order.guest_name||'Sin nombre');
    html('modal-table-name',order.table?`${icon('pin')}${esc(order.table)}`:'');
    text('u-detail-status',statusText[order.status]||'Revisar estado');
    $('u-detail-status').className=`p-status p-status-${order.status}`;
    let timeStr='—';
    const date=new Date(order.created_at);
    if(Number.isFinite(date.getTime())){let h=date.getHours();const m=String(date.getMinutes()).padStart(2,'0');const ampm=h>=12?'pm':'am';h=h%12||12;timeStr=`${h}:${m} ${ampm}`;}
    text('modal-time-detail',`Recibido ${timeStr} · ${units(order)} ${units(order)===1?'shawarma':'shawarmas'}`);
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
    if(this.isFinanceUnlocked){this.recalculateCosts();this.loadFixedFinances?.();}
    const archives=this.getVaultArchives();text('vault-total-orders',this.getVaultOrders().length);text('vault-total-events',archives.length);
    const clearHeader = archives.length ? `<div style="display:flex;justify-content:flex-end;margin-bottom:12px;">${button('Vaciar toda la Bóveda ('+archives.length+' eventos)','trash','app.clearVaultPrompt()','u-danger')}</div>` : '';
    html('vault-events-list',clearHeader + (archives.length?archives.map((evt,index)=>{
      const d=new Date(evt.date),date=Number.isFinite(d.getTime())?d.toLocaleString('es',{dateStyle:'short',timeStyle:'short'}):'Fecha no registrada';
      return `<article class="u-archive"><div><h3>${icon('box')}${esc(evt.name||'Evento de catering')}</h3><p>${esc(date)} · ${esc(evt.total_orders||evt.orders?.length||0)} pedidos · ${esc(evt.operator||'Dispositivo 1')}</p></div><div class="u-actions">${button('Exportar CSV','list',`app.exportSingleEventCSV(${index})`)}${button('Eliminar','trash',`app.deleteArchivedEventPrompt(${index})`,'u-danger')}</div></article>`;
    }).join(''):'<p class="u-empty-message">No hay eventos archivados. Al cerrar un evento con respaldo aparecerá aquí.</p>'));
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
    ['order-detail-modal','finance-pin-modal','cost-settings-modal','client-invoice-modal','order-qr-modal','google-review-modal'].forEach(id=>$(id)?.classList.add('u-overlay'));
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      prepareTemplates();
      if (app && app.currentView === 'admin') app.renderAdmin?.();
      if (app && app.currentView === 'display') app.renderDisplay?.();
    });
  } else {
    prepareTemplates();
    if (app && app.currentView === 'admin') app.renderAdmin?.();
    if (app && app.currentView === 'display') app.renderDisplay?.();
  }
  window.ShawarmaUnified={adminTemplate,detailTemplate,costTemplate,pinTemplate,renderMonitorCard,prepareTemplates,fillDetail};
})();
