/* Editable supplies within the existing local cost configuration. No backend migration. */
(() => {
  'use strict';
  const app=window.app,proto=Object.getPrototypeOf(app),{esc,stripEmoji,icon}=window.ShawarmaPremium;
  const $=id=>document.getElementById(id),copy=x=>JSON.parse(JSON.stringify(x));
  const custom=key=>!Object.prototype.hasOwnProperty.call(DEFAULT_COST_CONFIG,key);
  const eventKey=state=>String(state.db?.event_info?.id || 'local:'+String(state.db?.event_info?.name||'evento'));
  const safeNumber=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  let serial=0;
  function beginDraft(state) {
    state.supplyDraft=copy(state.costConfig||DEFAULT_COST_CONFIG);
    state.supplyDraftEventKey=eventKey(state);state.supplyDraftDirty=false;
  }
  function collectDraft(state) {
    if(!state.supplyDraft)beginDraft(state);
    for(const [key,item] of Object.entries(state.supplyDraft)) {
      for(const [prefix,prop] of [['name','name'],['description','qty_formula'],['price','pack_price'],['qty','pack_qty']]) {
        const node=$(`cfg-${prefix}-${key}`);if(node)item[prop]=node.value;
      }
      if(custom(key)) {
        const node=$(`cfg-used-${key}`);
        if(node)item.usage_by_event={...(item.usage_by_event||{}),[state.supplyDraftEventKey]:node.value};
      }
    }
    return state.supplyDraft;
  }
  function validateDraft(draft,key) {
    const result=copy(draft);
    for(const [id,item] of Object.entries(result)) {
      const name=String(item.name||'').trim(),description=String(item.qty_formula||'').trim();
      const price=Number(item.pack_price),qty=Number(item.pack_qty);
      if(!name || name.length>160)return {error:'Escribe un nombre de hasta 160 caracteres.',field:`cfg-name-${id}`};
      if(description.length>240)return {error:'La descripción debe tener como máximo 240 caracteres.',field:`cfg-description-${id}`};
      if(String(item.pack_price).trim()==='' || !Number.isFinite(price) || price<0)return {error:`Revisa el precio de ${name}. Debe ser cero o mayor.`,field:`cfg-price-${id}`};
      if(String(item.pack_qty).trim()==='' || !Number.isFinite(qty) || qty<=0)return {error:`Revisa el rendimiento de ${name}. Debe ser mayor que cero.`,field:`cfg-qty-${id}`};
      const unit=price/qty;if(!Number.isFinite(unit))return {error:`Revisa el precio y rendimiento de ${name}.`,field:`cfg-qty-${id}`};
      Object.assign(item,{name,qty_formula:description,pack_price:price,pack_qty:qty,unit_cost:unit});
      if(custom(id)) {
        const value=item.usage_by_event?.[key] ?? 0,used=Number(value);
        if(String(value).trim()==='' || !Number.isFinite(used) || used<0 || !Number.isFinite(used*unit))return {error:`Revisa la cantidad usada de ${name}. Debe ser cero o mayor.`,field:`cfg-used-${id}`};
        item.is_custom=true;item.usage_by_event={...(item.usage_by_event||{}),[key]:used};
      }
    }
    return {config:result};
  }
  proto.toggleCostSettingsModal=function(show) {
    if(show) {
      beginDraft(this);this.renderCostSettingsInputs();$('cost-settings-modal').style.display='flex';
    } else {
      if(this.supplyDraftDirty && !confirm('¿Cerrar sin guardar los cambios de insumos?'))return;
      $('cost-settings-modal').style.display='none';this.supplyDraft=null;this.supplyDraftDirty=false;
    }
  };
  proto.renderCostSettingsInputs=function() {
    if(!this.supplyDraft)beginDraft(this);
    $('cost-settings-inputs-list').innerHTML=Object.entries(this.supplyDraft).map(([key,item])=>{
      const isCustom=custom(key),id=esc(key),name=esc(stripEmoji(item.name));
      const price=item.pack_price ?? item.unit_cost ?? 0,qty=item.pack_qty ?? 1;
      const unit=safeNumber(qty)>0?safeNumber(price)/safeNumber(qty):null;
      return `<section class="u-supply-row" data-supply-key="${id}"><div class="u-supply-labels"><label>Nombre<input type="text" id="cfg-name-${id}" maxlength="160" value="${name}" data-supply-field></label><label>Descripción de uso<input type="text" id="cfg-description-${id}" maxlength="240" value="${esc(item.qty_formula||'')}" data-supply-field></label></div><div class="u-supply-numbers"><label>Precio del paquete ($)<input type="number" step="any" min="0" id="cfg-price-${id}" value="${esc(price)}" data-u-cost-key="${id}" data-supply-field></label><label>Unidades / porciones<input type="number" step="any" min="0.0001" id="cfg-qty-${id}" value="${esc(qty)}" data-u-cost-key="${id}" data-supply-field></label><div class="u-unit-cost"><span>Costo unitario</span><strong id="live-unit-cost-${id}">${unit===null?'—':'$'+unit.toFixed(4)}</strong></div></div>${isCustom?`<div class="u-supply-usage"><label>Usadas en este evento<input type="number" step="any" min="0" id="cfg-used-${id}" value="${esc(item.usage_by_event?.[this.supplyDraftEventKey]??0)}" data-supply-field></label><p class="u-muted">Cantidad manual. No se añade al menú de Pedidos.</p></div>`:'<p class="u-supply-rule">Consumo automático original. Editar su descripción no cambia la cantidad calculada.</p>'}</section>`;
    }).join('');
  };
  proto.addSupplyRow=function() {
    if($('cost-settings-modal').style.display!=='flex')this.toggleCostSettingsModal(true);
    collectDraft(this);
    let key;do{key='custom_'+Date.now().toString(36)+'_'+(++serial);}while(this.supplyDraft[key]);
    this.supplyDraft[key]={name:'',qty_formula:'',pack_price:0,pack_qty:1,unit_cost:0,is_custom:true,usage_by_event:{[this.supplyDraftEventKey]:0}};
    this.supplyDraftDirty=true;this.renderCostSettingsInputs();
    $(`cfg-name-${key}`)?.focus();$(`cfg-name-${key}`)?.scrollIntoView({block:'nearest'});
    return key;
  };
  proto.saveCostSettingsFromModal=function() {
    if(!this.supplyDraft)return false;
    if(eventKey(this)!==this.supplyDraftEventKey){this.showToast('El evento cambió. Cierra el editor y vuelve a abrirlo antes de guardar.','info');return false;}
    const result=validateDraft(collectDraft(this),this.supplyDraftEventKey);
    if(result.error){this.showToast(result.error,'danger');$(result.field)?.focus();return false;}
    // One atomic browser-storage write; memory and UI change only after it succeeds.
    try{localStorage.setItem('shawarma_cost_config_v2',JSON.stringify(result.config));}
    catch{this.showToast('No se pudieron guardar los insumos en este navegador. Tus cambios siguen abiertos.','danger');return false;}
    this.costConfig=result.config;this.supplyDraftDirty=false;this.toggleCostSettingsModal(false);
    this.recalculateCosts();this.showToast('Insumos, nombres y cantidades guardados.');return true;
  };
  proto.resetCostConfigToDefault=function() {
    if(!confirm('¿Restablecer nombres, descripciones y precios originales? Los renglones nuevos se conservarán. Después debes pulsar Guardar.'))return;
    const draft=collectDraft(this),extras=Object.fromEntries(Object.entries(draft).filter(([key])=>custom(key)));
    this.supplyDraft={...copy(DEFAULT_COST_CONFIG),...extras};this.supplyDraftDirty=true;this.renderCostSettingsInputs();
  };
  proto.extendCostBreakdown=function(breakdown) {
    const cfg=this.costConfig||DEFAULT_COST_CONFIG;
    for(const row of breakdown) {
      if(cfg[row.key]?.name)row.name=stripEmoji(cfg[row.key].name);
      if(cfg[row.key]?.qty_formula!==undefined)row.formula=cfg[row.key].qty_formula;
    }
    for(const [key,item] of Object.entries(cfg)) {
      if(!custom(key))continue;
      const qty=Math.max(0,safeNumber(item.usage_by_event?.[eventKey(this)]));
      const unitCost=Math.max(0,safeNumber(item.unit_cost,safeNumber(item.pack_price)/Math.max(.0001,safeNumber(item.pack_qty,1))));
      breakdown.push({key,name:stripEmoji(item.name),formula:item.qty_formula||'Cantidad manual de este evento',qty,unitCost});
    }
    this.lastCostBreakdown=copy(breakdown);
  };
  function csvCell(value) {
    let s=String(value??'');
    if(typeof value==='string' && /^[\s]*[=+@-]/.test(s))s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }
  proto.buildFinancialCSV=function() {
    this.recalculateCosts();
    const breakdown=this.lastCostBreakdown||[];
    const total=breakdown.reduce((sum,r)=>sum+r.qty*r.unitCost,0);
    const revenue=safeNumber($('cost-input-revenue')?.value),logistics=safeNumber($('cost-input-logistics')?.value);
    const rows=[['Concepto','Descripción de uso','Cantidad','Costo unitario USD','Subtotal USD'],...breakdown.map(r=>[stripEmoji(r.name),r.formula,r.qty,r.unitCost,Number((r.qty*r.unitCost).toFixed(2))]),[],['Ingreso del evento','','','',revenue],['Insumos','','','',Number(total.toFixed(2))],['Logística','','','',logistics],['Resultado neto','','','',Number((revenue-total-logistics).toFixed(2))],['Margen %','','','',revenue>0?Number(((revenue-total-logistics)/revenue*100).toFixed(1)):0],['Costo por unidad','','','',$('kpi-cost-per-unit')?.textContent||''],['Mixto estándar (receta original, sin insumos manuales)','','','',$('kpi-single-plate-cost')?.textContent||'']];
    return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
  };
  proto.exportFinancialCSV=function() {
    const blob=new Blob([this.buildFinancialCSV()],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=`shawarma_costos_${new Date().toISOString().slice(0,10)}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    this.showToast('Desglose de insumos exportado con tus nombres y renglones.');
  };
  document.addEventListener('input',event=>{if(event.target.hasAttribute?.('data-supply-field'))app.supplyDraftDirty=true;});
  window.ShawarmaSupplies={validateDraft,collectDraft,eventKey,custom,csvCell};
})();
