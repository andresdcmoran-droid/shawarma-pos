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
    return `<div class="u-page-heading"><div><span class="p-eyebrow">Configuración, costos y respaldos</span><h1>Administración</h1></div><p>Control financiero, respaldos y ajustes del servicio.</p></div>
    <div class="u-admin-grid">
      ${card(heading('Dispositivo y operador','person','Identifica quién opera este equipo y ajusta idioma o tema automático.')+`<div class="u-between"><div><strong id="admin-operator-display">Andrés</strong><p class="u-muted">Operador activo en este dispositivo.</p></div>${button('Otro nombre','edit','app.promptChangeOperator()')}</div><div class="p-operator-presets-row" role="group" aria-label="Equipos predeterminados"><button type="button" class="u-button" data-operator-preset="Andrés" onclick="app.selectOperatorPreset('Andrés')">${icon('person')}<span>Andrés</span></button><button type="button" class="u-button" data-operator-preset="Anaíz" onclick="app.selectOperatorPreset('Anaíz')">${icon('person')}<span>Anaíz</span></button><button type="button" class="u-button" data-operator-preset="Leandro" onclick="app.selectOperatorPreset('Leandro')">${icon('person')}<span>Leandro</span></button></div><div class="u-language-setting"><span id="u-language-label">Idioma y tema</span><div class="u-language-options" role="group" aria-labelledby="u-language-label"><button type="button" class="u-button" id="u-language-es" lang="es" data-i18n-ignore onclick="app.setLanguage('es')" aria-pressed="true">Español</button><button type="button" class="u-button" id="u-language-en" lang="en" data-i18n-ignore onclick="app.setLanguage('en')" aria-pressed="false">English</button><button type="button" class="u-button" id="btn-theme-auto" onclick="app.setTheme('auto')" title="Seguir el modo Día/Noche del sistema">${icon('settings')}<span>Auto</span></button></div></div>`)}
      ${card(heading('Acceso, evento y reseñas','order','Edita el anfitrión y meta del evento, gestiona la clave de acceso o muestra el QR de reseña.')+`<div class="u-actions">${button('Configurar evento','order','app.openWelcomeScreen()','u-primary')}${button('QR de reseña','qr','app.showGoogleReviewQRModal()')}${button('Cambiar clave','edit','app.changeAccessPinPrompt()')}${button('Bloquear','close','app.lockAppGate()')}</div><div class="u-admin-mini-conn"><span class="u-muted">Servidor local:</span><code class="u-address-inline" id="admin-url-text"></code></div><p class="u-muted" id="u-network-note"></p>`)}

      <section id="finance-locked-card" class="pos-card u-card u-full u-between"><div>${heading('Costos, escandallo y rentabilidad','settings','Calcula costos reales o cotiza un evento por adelantado. Protegido con PIN.')}<p class="u-muted">Accede con tu PIN financiero (por defecto 1234).</p></div>${button('Abrir módulo financiero','settings','app.promptUnlockFinance()','u-primary')}</section>
      <section id="finance-unlocked-card" class="pos-card u-card u-full f-shell" style="display:none">
        <div class="f-header">
          <div class="f-header-title">
            <span class="m-eyebrow">Finanzas y escandallo</span>
            <div class="f-title-row">
              <h2>${icon('settings')}Costos y rentabilidad</h2>
              <span id="f-event-badge" class="f-event-badge" style="display:none"></span>
            </div>
          </div>
          <div class="f-header-controls">
            <div class="f-mode-seg" role="group" aria-label="Modo de cálculo">
              <button type="button" id="f-mode-real" class="f-seg-btn" onclick="app.applyFinancePresetMode('real')">Pedidos reales</button>
              <button type="button" id="f-mode-sim" class="f-seg-btn is-active" onclick="app.applyFinancePresetMode('contracted')">Evento contratado</button>
            </div>
            <div class="f-sec-actions">
              ${button('PIN','edit','app.changeFinancePinPrompt()')}
              ${button('Bloquear','close','app.lockFinance()')}
            </div>
          </div>
        </div>

        <div class="f-pnl-grid">
          <div class="f-inputs-panel">
            <div class="f-panel-label">Parámetros del evento</div>
            <div class="f-field-row">
              <label class="f-field">
                <span>Unidades</span>
                <div class="f-input-wrap">
                  <input type="number" min="0" step="1" id="cost-input-shawarmas" placeholder="Reales" oninput="app.onFinanceUnitsOrPriceChange()">
                  <span class="f-suffix">uds</span>
                </div>
              </label>
              <label class="f-field">
                <span>Precio / shawarma</span>
                <div class="f-input-wrap has-prefix">
                  <span class="f-prefix">$</span>
                  <input type="number" step="0.50" min="0" id="cost-input-unit-price" value="23" placeholder="23.00" oninput="app.onFinanceUnitsOrPriceChange()">
                </div>
              </label>
            </div>
            <div class="f-field-row">
              <label class="f-field">
                <span>Cobro shawarmas</span>
                <div class="f-input-wrap has-prefix">
                  <span class="f-prefix">$</span>
                  <input type="number" step="0.01" min="0" id="cost-input-revenue" placeholder="0.00" oninput="app.onFinanceManualRevenueInput()">
                </div>
              </label>
              <label class="f-field">
                <span>Servicio adicional</span>
                <div class="f-input-wrap has-prefix">
                  <span class="f-prefix">$</span>
                  <input type="number" step="0.01" min="0" id="cost-input-service" placeholder="0.00" oninput="app.recalculateCosts()">
                </div>
              </label>
            </div>
            <label class="f-field">
              <span>Logística y otros gastos</span>
              <div class="f-input-wrap has-prefix">
                <span class="f-prefix">$</span>
                <input type="number" step="0.01" min="0" id="cost-input-logistics" placeholder="0.00" oninput="app.recalculateCosts()">
              </div>
            </label>
          </div>

          <div class="f-scorecard">
            <div class="f-hero-kpis">
              <div class="f-hero-kpi is-profit">
                <div class="f-hero-top">
                  <span>Ganancia neta</span>
                  <strong class="f-margin-pill" id="kpi-margin-pct">0%</strong>
                </div>
                <strong class="f-hero-val" id="kpi-profit-net">$0.00</strong>
                <small id="f-profit-sub">Ingreso menos insumos y logística</small>
              </div>
              <div class="f-hero-kpi">
                <div class="f-hero-top">
                  <span>Costo evento + logística</span>
                </div>
                <strong class="f-hero-val" id="kpi-cost-total">$0.00</strong>
                <small id="f-cost-sub">Calculado en tiempo real</small>
              </div>
            </div>

            <div class="f-sub-kpis">
              <div class="f-sub-kpi">
                <span>Costo / unidad</span>
                <strong id="kpi-cost-per-unit">$0.00</strong>
              </div>
              <div class="f-sub-kpi">
                <span id="f-shawarmas-cost-label">Costo shawarmas (0 uds)</span>
                <strong id="kpi-shawarmas-total">$0.00</strong>
              </div>
              <div class="f-sub-kpi">
                <span>Punto de equilibrio</span>
                <strong id="kpi-breakeven-units">—</strong>
              </div>
            </div>

            <div class="f-mix-block" id="f-cost-mix-bar"></div>
          </div>
        </div>

        <div class="f-table-bar">
          <div>
            <h3>Desglose de insumos y empaques</h3>
            <p class="u-muted">Agrupado por categoría con participación exacta sobre el costo total.</p>
          </div>
          <div class="u-actions">
            ${button('Editar precios','edit','app.toggleCostSettingsModal(true)')}
            ${button('Agregar renglón','plus','app.addSupplyRow()')}
            ${button('Exportar CSV','list','app.exportFinancialCSV()')}
          </div>
        </div>

        <div class="u-table-scroll f-table-wrap" tabindex="0" role="region" aria-label="Desglose de costos">
          <table class="u-table f-table">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Fórmula de uso</th>
                <th class="is-num">Cant.</th>
                <th class="is-num">Unitario</th>
                <th class="is-num">% Costo</th>
                <th class="is-num">Subtotal</th>
              </tr>
            </thead>
            <tbody id="cost-breakdown-tbody"></tbody>
          </table>
        </div>
      </section>

      ${card(heading('Historial de eventos archivados','box','Cada evento cerrado conserva sus pedidos, unidades y balance financiero (ingreso, costo y ganancia neta).')+`<div class="u-metrics u-two-metrics"><div class="u-metric"><strong id="vault-total-orders">0</strong><span>Comandas guardadas</span></div><div class="u-metric"><strong id="vault-total-events">0</strong><span>Eventos archivados</span></div></div><div id="vault-events-list" class="u-archive-list"></div><div class="u-actions">${button('Exportar historial completo CSV','list','app.exportVaultCSV()')}${button('Exportar pedidos actuales CSV','list','app.exportRawCSV()')}</div><div id="admin-deleted-orders-container" class="u-deleted-orders-section" style="margin-top:14px; border-top:1px dashed var(--border-color); padding-top:12px;"></div>`,'u-full')}

      ${card(heading('Copia de seguridad y pantalla','box','Descarga un ZIP con el Excel para cliente y el JSON de recuperación completa.')+`<p class="u-muted" id="u-safety-storage">Copias de recuperación del dispositivo: activo.</p><p class="u-muted" id="u-safety-wake">Pantalla activa: disponible.</p><div class="u-actions">${button('Descargar respaldo (Excel + JSON)','box','app.downloadEventBundle()','u-primary')}${button('Mantener pantalla activa','monitor','app.toggleScreenAwake()')}${button('Restaurar respaldo JSON','box','app.openRecoveryFile()')}</div><input id="s-recovery-file" type="file" accept="application/json,.json" hidden onchange="app.inspectRecoveryFile(this.files[0]); this.value=''"><div id="s-recovery-preview" class="s-recovery-preview" hidden></div>`)}

      ${card(heading('Cierre del evento','alert','Archiva con respaldo completo y reinicia en Turno #1 para el próximo servicio, o limpia pedidos de prueba.')+`<div class="u-actions">${button('Cerrar, respaldar y próximo evento','check','app.closeEventBackupAndStartNext()','u-primary')}${button('Cerrar sin guardar (pruebas)','trash','app.closeEventWithoutSaving()','u-danger s-clear-button')}</div><p class="u-muted"><strong>Con respaldo:</strong> guarda Excel + JSON + finanzas y reinicia limpio en <strong>Turno #1</strong>.</p><p class="u-muted"><strong>Sin guardar:</strong> solo para pruebas previas al servicio; descarta los turnos sin archivar.</p>`)}
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
      ? `${ui.formatBirthdayName ? ui.formatBirthdayName(order.guest_name, order.notes) : 'Cumpleañero ' + (order.guest_name||'')}`
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
    // Sincronizar automáticamente la cantidad contratada y el evento con Costos y Rentabilidad
    if (finalQty > 0) {
      try {
        localStorage.setItem('shawarma_finance_mode_v1', 'contracted');
        localStorage.setItem('shawarma_manual_qty_calc', String(finalQty));
      } catch(e){}
      const calcQtyInp = $('cost-input-shawarmas');
      if (calcQtyInp && document.activeElement !== calcQtyInp) calcQtyInp.value = String(finalQty);
      this._manualRevOverride = false;
    }
    if (typeof this.recalculateCosts === 'function') this.recalculateCosts();
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
    const contracted=this.getContractedQty();
    const ownerName=this.getEventOwnerName();
    const deletedList=(this.db?.deleted_orders||[]).slice().sort((a,b)=>Number(a.turn)-Number(b.turn));
    const deletedCount=deletedList.length;
    const langKey=document.documentElement?.lang||'es';
    const dispSig=`${langKey}|${contracted}|${ownerName}|${deletedCount}|`+orders.map(o=>`${o.id}:${o.turn}:${o.status}:${o.updated_at||''}:${o.guest_ack?1:0}:${o.guest_name||''}:${o.items_count||1}`).join(';');
    if(this._lastDisplaySig===dispSig && $('display-prep-list')?.childElementCount>0)return;
    this._lastDisplaySig=dispSig;

    const delivered=orders.filter(o=>o.status==='delivered').sort((a,b)=>Number(b.turn)-Number(a.turn));
    const pending=orders.filter(o=>o.status==='pending');
    const preparing=orders.filter(o=>o.status==='preparing');
    const ready=orders.filter(o=>o.status==='ready');
    const inKitchen=[...ready,...preparing,...pending];

    const sumUnits=list=>list.reduce((sum,o)=>sum+units(o),0);
    const deliveredUnits=sumUnits(delivered);
    const pendingUnits=sumUnits(pending);
    const planchaUnits=sumUnits(preparing)+sumUnits(ready);
    const inKitchenUnits=pendingUnits+planchaUnits;
    const totalOrderedUnits=deliveredUnits+inKitchenUnits;

    const remainingToDeliver=contracted>0?Math.max(0,contracted-deliveredUnits):0;
    const extraDelivered=contracted>0&&deliveredUnits>contracted?(deliveredUnits-contracted):0;
    const remainingToOrder=contracted>0?Math.max(0,contracted-totalOrderedUnits):0;
    const extraOrdered=contracted>0&&totalOrderedUnits>contracted?(totalOrderedUnits-contracted):0;
    const pctDelivered=contracted>0?Math.min(100,Math.round((deliveredUnits/contracted)*100)):0;
    const pctInKitchen=contracted>0?Math.min(100-pctDelivered,Math.round((inKitchenUnits/contracted)*100)):0;

    // Event-wide protein breakdown
    const byProt={Mixto:0,Pollo:0,Carne:0,Falafel:0,Bowls:0};
    orders.flatMap(orderUnits).forEach(({item,quantity})=>{
      if(byProt[item.protein]!==undefined)byProt[item.protein]+=quantity;
      if(item.is_bowl||item.preset==='bowl')byProt.Bowls+=quantity;
    });

    // Live Event Health Pulse (deterministic real-time telemetry)
    const overdueOrders=inKitchen.filter(o=>{const s=elapsed(o);return s!==null&&s>=15*60;});
    let pulseCls='is-healthy';
    let pulseText=`Servicio en curso · ${pendingUnits} por armar, ${planchaUnits} en plancha/listos`;
    if(contracted<=0){
      pulseCls='is-neutral';
      pulseText='Configura el anfitrión y la cantidad contratada para activar el balance automático.';
    } else if(overdueOrders.length>0){
      pulseCls='is-warn';
      pulseText=`Atención: ${overdueOrders.length} ${overdueOrders.length===1?'pedido supera':'pedidos superan'} 15 min (${overdueOrders.slice(0,3).map(o=>'#'+o.turn).join(', ')})`;
    } else if(extraDelivered>0){
      pulseCls='is-complete';
      pulseText=`Meta de ${contracted} cumplida · +${extraDelivered} adicionales entregados`;
    } else if(remainingToDeliver===0){
      pulseCls='is-complete';
      pulseText=`Meta exacta completada · ${contracted} de ${contracted} entregados`;
    } else if(remainingToOrder<=5 && remainingToOrder>0){
      pulseCls='is-warn';
      pulseText=`Cierre próximo · Solo faltan ${remainingToOrder} por pedir para completar ${contracted}`;
    } else if(inKitchenUnits===0 && deliveredUnits>0){
      pulseCls='is-healthy';
      pulseText=`Cocina al día · ${deliveredUnits} entregados · Faltan ${remainingToOrder} por pedir`;
    }

    const topBar=$('event-monitor-top-bar');
    if(topBar){
      topBar.innerHTML=`
        <section class="m-telemetry-shell" aria-label="Resumen ejecutivo del evento">
          <div class="m-telemetry-head">
            <div class="m-telemetry-identity">
              <span class="m-eyebrow">Monitor en vivo</span>
              <div class="m-title-row">
                <h1>${esc(ownerName || 'Evento sin nombre')}</h1>
                <span class="m-pulse-pill ${pulseCls}"><span class="m-pulse-dot"></span>${esc(pulseText)}</span>
              </div>
            </div>
            <div class="m-telemetry-actions">
              <button type="button" class="u-button" onclick="app.openWelcomeScreen()">${icon('edit')}<span>Editar evento</span></button>
              <button type="button" class="u-button u-primary" onclick="app.showClientInvoiceModal()">${icon('order')}<span>Resumen cliente</span></button>
            </div>
          </div>

          <div class="m-kpi-strip">
            <div class="m-kpi">
              <span class="m-kpi-label">Contratados</span>
              <strong class="m-kpi-val">${contracted>0?contracted:'—'}</strong>
              <small class="m-kpi-sub">Meta del evento</small>
            </div>
            <div class="m-kpi is-delivered">
              <span class="m-kpi-label">Entregados</span>
              <strong class="m-kpi-val">${deliveredUnits}</strong>
              <small class="m-kpi-sub">${contracted>0?`${pctDelivered}% · `:''}${delivered.length} ${delivered.length===1?'turno':'turnos'}</small>
            </div>
            <div class="m-kpi is-kitchen">
              <span class="m-kpi-label">En cocina ahora</span>
              <strong class="m-kpi-val">${inKitchenUnits}</strong>
              <small class="m-kpi-sub">${pendingUnits} armar · ${planchaUnits} plancha</small>
            </div>
            <div class="m-kpi is-remaining">
              <span class="m-kpi-label">${extraOrdered>0?'Adicionales':'Faltan por pedir'}</span>
              <strong class="m-kpi-val">${contracted>0?(extraOrdered>0?`+${extraOrdered}`:remainingToOrder):'—'}</strong>
              <small class="m-kpi-sub">${contracted>0?`${remainingToDeliver} por entregar`:'Sin meta definida'}</small>
            </div>
            <div class="m-kpi ${deletedCount>0?'is-deleted':''}">
              <span class="m-kpi-label">Eliminados</span>
              <strong class="m-kpi-val">${deletedCount}</strong>
              <small class="m-kpi-sub">${deletedCount>0?'Ver auditoría abajo':'Sin descartes'}</small>
            </div>
          </div>

          <div class="m-progress-footer">
            <div class="m-progress-bar-col">
              <div class="m-progress-meta">
                <span>Avance total: <strong>${deliveredUnits}</strong> entregados + <strong>${inKitchenUnits}</strong> en cocina${contracted>0?` de <strong>${contracted}</strong>`:''}</span>
                ${contracted>0?`<strong>${pctDelivered}% entregado</strong>`:''}
              </div>
              <div class="p-balance-progress-track m-track">
                <div class="p-balance-progress-fill is-delivered" style="width:${pctDelivered}%"></div>
                <div class="p-balance-progress-fill is-kitchen" style="width:${pctInKitchen}%"></div>
              </div>
            </div>
            <div class="m-protein-mix">
              <span class="m-prot-item"><span class="b-pdot b-pdot-mixto"></span>Mixto <strong>${byProt.Mixto}</strong></span>
              <span class="m-prot-item"><span class="b-pdot b-pdot-pollo"></span>Pollo <strong>${byProt.Pollo}</strong></span>
              <span class="m-prot-item"><span class="b-pdot b-pdot-carne"></span>Carne <strong>${byProt.Carne}</strong></span>
              <span class="m-prot-item"><span class="b-pdot b-pdot-falafel"></span>Falafel <strong>${byProt.Falafel}</strong></span>
              ${byProt.Bowls?`<span class="m-prot-item"><span class="b-pdot b-pdot-bowl"></span>Bowls <strong>${byProt.Bowls}</strong></span>`:''}
            </div>
          </div>
        </section>
      `;
    }

    // Left Column (Priority #1): Active Orders In Kitchen Right Now
    html('display-prep-list', inKitchen.length
      ? inKitchen.map(renderMonitorCard).join('')
      : `<div class="p-empty">${icon('check')}<h2>Cocina al día</h2><p>No hay comandas pendientes ni en plancha en este momento.</p></div>`);

    // Right Column (History + Deleted Audit): Delivered + Deleted Orders
    const deletedAuditHTML = deletedList.length ? `
      <div class="m-deleted-audit">
        <div class="m-deleted-head">
          <span>${icon('trash')} Turnos eliminados (${deletedList.length})</span>
          <small>Registro de auditoría</small>
        </div>
        <div class="m-deleted-list">
          ${deletedList.map(d=>{
            const prod=d.protein?(d.is_bowl?`Bowl ${d.protein}`:`Shawarma ${d.protein}`):'Shawarma';
            return `<div class="m-deleted-row"><span class="m-del-turn">#${esc(d.turn)}</span><strong>${esc(d.guest_name||'Invitado')}</strong>${d.table?`<span class="m-del-meta">${esc(d.table)}</span>`:''}<span class="m-del-prod">${esc(prod)}</span><span class="m-del-tag">Eliminado</span></div>`;
          }).join('')}
        </div>
      </div>
    ` : '';

    html('display-ready-list', deletedAuditHTML + (delivered.length
      ? delivered.map(renderMonitorCard).join('')
      : `<div class="p-empty">${icon('box')}<h2>Aún no hay entregados</h2><p>Cada pedido entregado aparecerá aquí en orden cronológico inverso.</p></div>`));

    document.querySelectorAll('#view-display .turn-column-header').forEach((el,i)=>{
      el.innerHTML = i === 0
        ? `${icon('kitchen')}<span>En curso ahora</span><strong class="u-count">${inKitchenUnits} uds · ${inKitchen.length} ${inKitchen.length===1?'turno':'turnos'}</strong>`
        : `${icon('box')}<span>Entregados${deletedCount>0?` · ${deletedCount} eliminados`:''}</span><strong class="u-count">${deliveredUnits} uds</strong>`;
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
    this.renderDeletedOrdersSection?.();
    if($('finance-locked-card'))$('finance-locked-card').style.display=this.isFinanceUnlocked?'none':'flex';
    if($('finance-unlocked-card'))$('finance-unlocked-card').style.display=this.isFinanceUnlocked?'block':'none';
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
  proto.renderDeletedOrdersSection=function() {
    const box = $('admin-deleted-orders-container');
    if (!box) return;
    const deleted = (this.db?.deleted_orders || []).slice().sort((a,b) => Number(a.turn) - Number(b.turn));
    if (!deleted.length) {
      box.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:13px; color:var(--text-dim);">
          <span style="display:inline-flex; align-items:center; gap:6px;">${icon('trash')}<strong>Pedidos eliminados del evento:</strong> Ninguno (secuencia limpia de turnos)</span>
          <span style="font-size:11px; opacity:0.75;">0 eliminados</span>
        </div>
      `;
      return;
    }

    const rows = deleted.map(d => {
      let timeStr = '—';
      const dt = new Date(d.deleted_at || d.created_at);
      if (Number.isFinite(dt.getTime())) {
        let h = dt.getHours();
        const m = String(dt.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        timeStr = `${h}:${m} ${ampm}`;
      }
      const prod = d.protein ? (d.is_bowl ? `Bowl · ${d.protein}` : `Shawarma · ${d.protein}`) : 'Shawarma';
      return `
        <div class="u-deleted-order-item" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; padding:8px 12px; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:8px; font-size:13px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="background:#ef4444; color:#ffffff; font-weight:900; font-size:12px; padding:2px 8px; border-radius:6px; letter-spacing:0.3px;">Turno #${esc(d.turn)}</span>
            <strong style="color:var(--text-white);">${esc(d.guest_name || 'Comensal')}</strong>
            ${d.table ? `<span style="color:var(--text-dim); font-size:12px;">(${esc(d.table)})</span>` : ''}
            <span style="color:#fca5a5; font-size:12px;">• ${esc(prod)}</span>
          </div>
          <div style="font-size:11.5px; color:var(--text-dim);">
            <span>Eliminado a las <strong>${timeStr}</strong></span>
            ${d.operator ? `<span> por ${esc(d.operator)}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    box.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
        <span style="font-size:13px; font-weight:800; color:#f87171; display:inline-flex; align-items:center; gap:6px;">
          ${icon('trash')} Registro de Turnos Eliminados (${deleted.length})
        </span>
        <span style="font-size:11.5px; color:var(--text-dim);">Explica saltos en la secuencia de turnos</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px;">
        ${rows}
      </div>
    `;
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
