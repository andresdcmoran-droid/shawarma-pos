/* Shawarma en Casa · presentación profesional, sin dependencias externas.
 * Se carga después de AppState y antes de DOMContentLoaded.
 * No sustituye el servidor, las rutas API ni el formato de los pedidos.
 */
(() => {
  'use strict';
  const app = window.app;
  const proto = Object.getPrototypeOf(app);
  const originals = {};
  const WARN_WAIT_MINUTES = 15; // Aviso visual, no promesa de tiempo de servicio.
  const paths = {
    order: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2h6v4H9zM9 10h6M9 14h6M9 18h3"/>',
    kitchen: '<path d="M4 10h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2ZM2 10h20M8 7c-3-3 3-3 0-6M14 7c-3-3 3-3 0-6"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v4M7 21h10"/>',
    settings: '<path d="m9 3 1-2h4l1 2 2 1 2-.2 2 3-1 2v3l1 2-2 3-2-.2-2 1-1 2h-4l-1-2-2-1-2 .2-2-3 1-2V9L3 7l2-3 2 .2Z"/><circle cx="12" cy="10" r="3"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m7.5 12 3 3 6-6"/>',
    star: '<path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.4l6.3-.9Z"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6M12 2v3"/>',
    pause: '<path d="M7 4.5v15M15 4.5v15"/>',
    play: '<polygon points="7 4.5 19 12 7 19.5 7 4.5"/>',
    reset: '<path d="M5 12a7 7 0 1 0 7-7 7 7 0 0 0-5.2 2.3L4 10"/><path d="M4 5v5h5"/>',
    person: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
    pin: '<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 0 1 14 0Z"/><circle cx="12" cy="9" r="2"/>',
    wrap: '<path d="m5 7 4 14h6l4-14M6 10l11 4M8 16l8 3"/><ellipse cx="12" cy="6" rx="7" ry="4"/><path d="m8 6 2-2 3 3 3-2"/>',
    // Drumstick, Lucide. ISC license reproduced at the end of this file.
    chicken: '<path d="M7.1 13.1C5.8 10.5 7.5 5.5 12 3.2c4.8-1.7 9.5 1.3 9.5 6.8 0 3.8-3.3 6.2-7.3 6.8-1.4.2-2.2.6-2.9.5M7.1 13.1l4.2 4.2M8 14l-2.4 2.4c-1.1-1.1-3.1-.4-3.6 1.2-.5 1.6.8 3.2 2.4 3.2.8 0 1.4-.6 1.8-1.4.4.8 1 1.4 1.8 1.4 1.6 0 2.9-1.6 2.4-3.2-.5-1.6-2.5-2.3-3.6-1.2L10.4 16.4"/><circle cx="17" cy="7.8" r=".9" fill="currentColor" stroke="none"/><circle cx="15.2" cy="10.2" r=".9" fill="currentColor" stroke="none"/><circle cx="18.2" cy="10.2" r=".9" fill="currentColor" stroke="none"/>',
    meat: '<path d="M4 7.2C6.5 4.5 12.2 3.2 17 4.5c3.5 1 5.2 4 5.2 7.5 0 4-2.7 7.5-7.2 9-2.5.8-5.2-.5-7-3-1.2-1.8-.8-4.5-2.8-6.8C2.8 8.8 2.2 8 4 7.2Z"/><path d="M5.8 8.5C7.8 6.2 12 5 16.2 6c2.8.8 4.3 3.2 4.3 6.2 0 3.3-2.5 6-6.3 7.3-2.2.7-4.4-.3-6-2.5-.7-1-1.4-2-2.2-3.2"/><circle cx="9.8" cy="8.2" r="1.6"/><path d="m8.2 8.2-3.4-.4M10.8 9.5c1.4 1.7 2.7 4.3 4.4 7.3m-3-5.3c2-1.7 4.6-2.7 7.6-2.7M6.8 11.2l1.7 1"/>',
    falafel: '<circle cx="8" cy="15" r="5"/><circle cx="16" cy="15" r="5"/><circle cx="12" cy="6" r="4"/><path d="M10 5h.01M13 7h.01M6 15h.01M9 17h.01M16 13h.01M18 16h.01"/>',
    bowl: '<path d="M3 10h18c0 7-4 10-9 10S3 17 3 10ZM8 22h8M8 6l2-3 3 4 4-4"/>',
    child: '<circle cx="12" cy="9" r="6"/><path d="M10 8h.01M14 8h.01M10 11q2 2 4 0M5 22v-2a7 7 0 0 1 14 0v2"/>',
    sauce: '<path d="M9 2h6v5l3 3v10H6V10l3-3ZM6 13h12M10 2v-1"/>',
    onion: '<path d="M10 6 9 2M14 6l2-4M12 6c-8 3-11 8-8 12 3 5 13 5 16 0 3-4 0-9-8-12ZM12 6c-6 9-5 14 0 16M12 6c6 9 5 14 0 16"/>',
    pickle: '<path d="M17 3c6 3 2 12-4 16-7 5-13 0-8-4 4-3 4-8 7-10 2-2 3-3 5-2Z"/><path d="M14 7h.01M16 11h.01M10 13h.01M8 18h.01"/>',
    tomato: '<path d="M8 7C0 5 1 21 11 21s14-14 6-14M12 7 8 3l4 1 4-2-1 4 5 2-6 1-3 3Z"/>',
    turnip: '<path d="M12 8c-11-3-12 10 0 14 12-4 11-17 0-14ZM12 8V1M12 6c-4 0-6-2-6-4 4 0 6 2 6 4M12 7c0-4 2-6 6-6 0 4-2 6-6 6"/>',
    garlic: '<path d="M12 2c2 7 8 8 8 13 0 9-16 9-16 0 0-5 6-6 8-13ZM12 7c-6 9-4 14 0 14M12 7c6 9 4 14 0 14"/>',
    chili: '<path d="M17 7c4 8-5 15-15 13 10-3 10-10 12-13ZM14 7h5M17 7c-1-4 1-5 4-5"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    minus: '<path d="M5 12h14"/>',
    send: '<path d="m22 2-7 20-4-9-9-4ZM11 13l7-7"/>',
    edit: '<path d="m14 5 5 5M3 21l1-6L16 3a2 2 0 0 1 5 5L9 20ZM13 21h9"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
    qr: '<path d="M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h3v3h-3ZM20 14v3M14 20h3M20 20h1"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    group: '<circle cx="8" cy="7" r="3"/><path d="M2 21v-4a6 6 0 0 1 12 0v4M16 4a3 3 0 0 1 0 6M17 13a5 5 0 0 1 5 5v3"/>',
    box: '<path d="m3 7 9-5 9 5v11l-9 4-9-4ZM3 7l9 5 9-5M12 12v10M7 4l9 5"/>',
    list: '<path d="M8 5h13M8 12h13M8 19h13M3 5h.01M3 12h.01M3 19h.01"/>',
    alert: '<path d="m12 2 10 19H2ZM12 9v5M12 18h.01"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    cut: '<path d="m4 3 16 18M20 3 4 21"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>'
  };
  function icon(name, extra = '') {
    return `<svg class="ui-icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.order}</svg>`;
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normal = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const $ = id => document.getElementById(id);
  const names = {hummus:'bowl',tabule:'bowl',cebolla:'onion',tomate:'tomato',pepinillo:'pickle',nabo:'turnip',ajo:'garlic',ajonjoli:'sauce',falafel:'falafel',picante:'chili'};
  const proteinIcon = p => ({Mixto:'wrap',Pollo:'chicken',Carne:'meat',Falafel:'falafel'}[p] || 'wrap');
  const text = (id, value) => { if ($(id)) $(id).textContent = value; };
  const html = (id, value) => { if ($(id)) $(id).innerHTML = value; };
  const core = () => INGREDIENTS_CONFIG.filter(i => i.isDefault);
  const stripEmoji = s => String(s).replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/ +/g, ' ').trim();
  function wrap(name, fn) { originals[name] = proto[name]; proto[name] = fn; }
  function currentItem(state) {
    return {protein:state.selectedProtein, preset:state.selectedPreset, is_bowl:state.selectedPreset === 'bowl', ingredients:state.getActive(), removed_ingredients:state.getRemoved(), notes:$('order-notes')?.value.trim() || ''};
  }
  function title(item) { return `${item.is_bowl || item.preset === 'bowl' ? 'Bowl' : 'Shawarma'} ${item.protein || 'Mixto'}`; }
  function recipe(item) {
    const known = Array.isArray(item.ingredients);
    const included = known ? item.ingredients : [];
    const has = ingredient => included.some(s => ingredientToken(s) === ingredient.id);
    const removed = [...new Set([...(item.removed_ingredients || []), ...core().filter(i => known && !has(i)).map(i => i.name)].map(ingredientToken))].map(token=>INGREDIENTS_CONFIG.find(i=>i.id===token)?.name || token);
    const additions = INGREDIENTS_CONFIG.filter(i => !i.isDefault && has(i));
    return {known, included, removed, additions, standard:known && removed.length === 0, count:core().filter(has).length};
  }
  function recipeHTML(item, expanded = false, forceOpen = null, detailsKey = '') {
    const r = recipe(item);
    const kids = item.preset === 'ninos';
    let out = '';
    if (item.is_bowl || item.preset === 'bowl') out += `<span class="p-mod p-format">${icon('bowl')} Sin pan · en plato</span>`;
    if (kids) {
      out += `<span class="p-mod p-format">${icon('child')} Menú infantil</span>`;
      out += `<p class="p-recipe-line">${r.included.length ? 'Incluye: ' + esc(r.included.join(' · ')) : 'Solo pan y proteína'}</p>`;
    } else if (r.standard) {
      out += `<p class="p-standard">${icon('check')} Con todo <span>· ${r.count}/${core().length} ingredientes</span></p>`;
    } else if (r.known) {
      out += `<p class="p-recipe-line">Personalizado · ${r.count}/${core().length} ingredientes base</p><div class="p-modifiers">${r.removed.map(s => `<span class="p-mod">${icon('minus')} Sin ${esc(s)}</span>`).join('')}</div>`;
    } else {
      out += `<p class="p-recipe-line">Verificar ingredientes del pedido</p>`;
      out += `<div class="p-modifiers">${r.removed.map(s => `<span class="p-mod">Sin ${esc(s)}</span>`).join('')}</div>`;
    }
    if (!kids) out += r.additions.map(i => `<span class="p-mod p-extra">${icon(names[i.id])} Con ${esc(i.name.replace(/\s*\(Opcional\)/i, ''))}</span>`).join('');
    let isOpen = false;
    if (forceOpen === true) {
      isOpen = true;
    } else if (forceOpen === false) {
      isOpen = false;
    } else if (detailsKey && typeof window !== 'undefined' && window._openTicketDetailsKeys) {
      isOpen = window._openTicketDetailsKeys.has(detailsKey);
    } else if (typeof window !== 'undefined' && !!window.previewDetailsOpen) {
      isOpen = true;
    }
    const keyAttr = detailsKey ? ` data-details-key="${esc(detailsKey)}"` : '';
    if (expanded && r.known && !kids) out += `<details class="p-recipe-details"${isOpen ? ' open' : ''}${keyAttr}><summary>Ver ingredientes incluidos</summary><p>${esc(r.included.join(' · ') || 'Sin ingredientes adicionales')}</p></details>`;
    return out;
  }
  function orderItems(o) { return o.is_group && Array.isArray(o.items) && o.items.length ? o.items : [o]; }
  function birthdayMention(value) {
    const keyword=/\bcumplean(?:er[oa]s?|os)\b/;
    const negative=/\b(?:no(?:\s+(?:es|soy|era))?|sin)\s+(?:(?:el|la|ser)\s+)?cumplean(?:er[oa]s?|os)\b/;
    return normal(value).split(/[.,;\n]/).some(part=>keyword.test(part) && !negative.test(part));
  }
  function specialOrder(order) {
    const items=orderItems(order);
    const birthday=[order.guest_name,order.notes,...items.map(item=>item.notes)].some(birthdayMention);
    const kids=items.some(item=>item.preset==='ninos');
    return {birthday,kids};
  }
  function bowlFormat(order) {
    const items=orderItems(order),isBowl=item=>!!(item.is_bowl || item.preset==='bowl');
    return {all:items.length>0 && items.every(isBowl),some:items.some(isBowl)};
  }
  function specialClasses(order) {
    const {birthday,kids}=specialOrder(order);
    const bowl=bowlFormat(order).all;
    return birthday||kids||bowl?`p-special${bowl?' p-bowl':''}${kids?' p-kids':''}${birthday?' p-birthday':''}`:'';
  }
  function formatBirthdayName(rawName, notes) {
    const isFemale = /cumpleañera|cumpleanera/i.test((rawName || '') + ' ' + (notes || ''));
    const prefix = isFemale ? 'Cumpleañera' : 'Cumpleañero';
    let cleanName = (rawName || '').replace(/^(cumpleañero|cumpleañera|cumpleanero|cumpleanera|cumple)\s*[:\-–]?\s*/i, '').trim();
    if (!cleanName || cleanName.toLowerCase() === 'comensal' || cleanName.toLowerCase() === 'sin nombre') cleanName = '';
    return cleanName ? `${prefix} ${cleanName}` : prefix;
  }
  function specialLabelsHTML(order) {
    const {kids}=specialOrder(order);
    const bowl=bowlFormat(order),labelBowl=bowl.some && (kids||!bowl.all);
    if(!kids&&!labelBowl)return '';
    return `<span class="p-special-labels">${kids?`<span class="p-special-tag p-kids-tag">${icon('child')}${order.is_group?'Incluye infantil':'Infantil'}</span>`:''}${labelBowl?`<span class="p-special-tag p-bowl-tag">${icon('bowl')}${bowl.all?'Bowl sin pan':'Incluye bowls'}</span>`:''}</span>`;
  }
  function signatureHTML(protein) {
    return normal(protein)==='mixto'?`<span class="p-signature">${icon('star')}<span>Especialidad de la casa</span></span>`:'';
  }
  const unitCount = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : 1;
  function orderUnits(order) {
    if (order.is_group && Array.isArray(order.items) && order.items.length) {
      // Parent quantity is the group total, not a multiplier for every child.
      return order.items.map((item,index)=>({item,quantity:unitCount(item.quantity),order,index}));
    }
    return [{item:order,quantity:unitCount(order.quantity),order,index:0}];
  }
  function ingredientToken(value) {
    const n=normal(value).replace(/\s*\(opcional\)/g,'');
    const found=INGREDIENTS_CONFIG.find(i=>normal(i.id)===n || normal(i.name).replace(/\s*\(opcional\)/g,'')===n);
    return found ? found.id : n;
  }
  function preparationKey(item) {
    const set=values=>[...new Set((values||[]).map(ingredientToken))].sort();
    const included=Array.isArray(item.ingredients)?set(item.ingredients):null;
    const excluded=set([...(item.removed_ingredients||[]),...core().filter(i=>included && !included.includes(i.id)).map(i=>i.id)]);
    return JSON.stringify([normal(item.protein),!!(item.is_bowl || item.preset==='bowl'),item.preset==='ninos',included,excluded,String(item.notes||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('es')]);
  }
  function groupPreparation(orders) {
    const groups=new Map();
    [...(orders||[])].filter(o=>['pending','preparing'].includes(o.status)).sort((a,b)=>Number(a.turn)-Number(b.turn)).forEach(order=>{
      orderUnits(order).forEach(({item,quantity,index})=>{
        // Missing ingredient data must never silently become a standard recipe.
        const key=preparationKey(item)+(Array.isArray(item.ingredients)?'':`|unknown:${order.id}:${index}`);
        if(!groups.has(key)) groups.set(key,{key,item,count:0,turns:[],pending:0,preparing:0});
        const group=groups.get(key);group.count+=quantity;group[order.status]+=quantity;
        if(!group.turns.includes(order.turn))group.turns.push(order.turn);
      });
    });
    return [...groups.values()];
  }
  function button(action, id, label, glyph, cls = '') {
    return `<button type="button" class="p-action ${cls}" data-p-action="${action}" data-id="${esc(id)}">${icon(glyph)}<span>${label}</span></button>`;
  }
  // Presentation-only plan: include completed orders so finishing one never
  // pulls an unrelated order into a batch already being cooked. No new server fields.
  function productionBatches(source) {
    const batches=[],memberships=new Map();
    for(const order of [...source].sort((a,b)=>Number(a.turn)-Number(b.turn))) {
      if(order.status==='cancelled')continue;
      for(const unit of orderUnits(order)) {
        let remaining=unit.quantity;
        while(remaining>0) {
          let batch=batches[batches.length-1];
          if(!batch || batch.count===6)batches.push(batch={number:batches.length+1,count:0,units:[]});
          const quantity=Math.min(6-batch.count,remaining);
          batch.units.push({...unit,quantity});batch.count+=quantity;remaining-=quantity;
          const key=String(order.id),numbers=memberships.get(key)||new Set();numbers.add(batch.number);memberships.set(key,numbers);
        }
      }
    }
    return {batches,outside:[],memberships};
  }
  function syncSpecialMotion() {
    document.body.style.setProperty?.('--p-special-phase',`${-(Date.now()%10000)/1000}s`);
  }
  function batchRecipeHTML(item) {
    const r=recipe(item),labels=[];
    if(item.is_bowl||item.preset==='bowl')labels.push('Bowl sin pan');
    if(item.preset==='ninos')labels.push('Infantil');
    if(!r.known)labels.push('Verificar ingredientes');
    else if(r.standard)labels.push('Con todo');
    else if(item.preset==='ninos')labels.push(r.included.length?'Incluye: '+r.included.join(', '):'Solo pan y proteína');
    else labels.push(...r.removed.map(name=>'Sin '+name));
    if(item.preset!=='ninos')labels.push(...r.additions.map(i=>'Con '+i.name.replace(/\s*\(Opcional\)/i,'')));
    return `<p class="p-batch-recipe ${r.standard?'p-batch-standard':''}">${esc(labels.join(' · '))}</p>`;
  }

  proto.renderIngredientsMatrix = function() {
    html('ingredients-matrix', INGREDIENTS_CONFIG.map(i => {
      const on = this.ingredientPreferences[i.id] === true;
      return `<div class="ing-card-item ${on ? 'state-yes' : 'state-no'}" data-ingredient-row="${i.id}">
        <button type="button" class="p-ingredient-label" data-p-action="toggle-ingredient" data-id="${i.id}" aria-pressed="${on}" aria-label="${esc(i.name)}: ${on ? 'incluido' : 'sin incluir'}"><span class="p-ingredient-symbol" aria-hidden="true">${icon(names[i.id])}</span><span>${esc(i.name)}</span></button>
        <div class="switch-dual-btn" role="group" aria-label="${esc(i.name)}">
          <button type="button" class="switch-opt switch-yes" data-p-action="include" data-id="${i.id}" aria-pressed="${on}">${icon('check')} Incluir</button>
          <button type="button" class="switch-opt switch-no" data-p-action="exclude" data-id="${i.id}" aria-pressed="${!on}">${icon('minus')} Sin</button>
        </div></div>`;
    }).join(''));
  };
  wrap('updateProteinCards', function() {
    originals.updateProteinCards.call(this);
    document.querySelectorAll('.protein-card-btn').forEach(b => b.setAttribute('aria-pressed', b.dataset.protein === this.selectedProtein));
  });
  wrap('updatePresetPills', function() {
    originals.updatePresetPills.call(this);
    document.querySelectorAll('.preset-pill-btn').forEach(b => b.setAttribute('aria-pressed', b.classList.contains('active')));
  });
  proto.updateQuickNoteButtons = function() {
    const selected = ($('order-notes')?.value || '').split(', ').filter(Boolean);
    document.querySelectorAll('.quick-note-chip').forEach(b => {
      const active = selected.includes(b.dataset.note);
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', active);
    });
  };
  proto.updatePreviewAndTurn = function() {
    syncSpecialMotion();
    const editing = !!(this.editingOrderId && this.editingOrderTurn);
    const turnCounter = Number(this.db?.event_info?.turn_counter) || 0;
    const activeOrders = this.db?.orders || [];
    const next = editing ? this.editingOrderTurn : (activeOrders.length === 0 ? 1 : turnCounter + 1);
    const count = this.currentGroupItems.length + 1;
    text('next-turn-display', `#${next}`);
    text('turn-label-display', editing ? 'Editando pedido' : 'Próximo turno');
    text('turn-sub-display', editing ? 'Conserva su turno original' : 'Se confirma al recibirlo el servidor');
    text('btn-submit-label', editing ? 'Guardar cambios' : count > 1 ? `ENVIAR GRUPO (${count} SHAWARMAS) A COCINA` : `ENVIAR A COCINA (TURNO #${next})`);
    if ($('btn-submit-order')?.style) $('btn-submit-order').style.background = count > 1 ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '';
    if ($('btn-cancel-edit')?.style) $('btn-cancel-edit').style.display = editing ? 'flex' : 'none';
    const item = currentItem(this);
    const previewSpecial = { ...item, guest_name: $('guest-name')?.value || '' };
    const summary = document.querySelector('.summary-card-pos');
    if (summary) for (const cls of ['p-special', 'p-bowl', 'p-kids', 'p-birthday']) summary.classList.toggle(cls, specialClasses(previewSpecial).split(' ').includes(cls));

    const existingDetails = $('preview-tags-container')?.querySelector('.p-recipe-details');
    if (existingDetails) window.previewDetailsOpen = existingDetails.open;
    const isDetailsOpen = !!(typeof window !== 'undefined' && window.previewDetailsOpen);

    const orderKey = `${item.protein}|${item.preset}|${item.is_bowl}|${(item.ingredients||[]).join(',')}|${(item.removed_ingredients||[]).join(',')}|${item.notes}|${count}|${previewSpecial.guest_name}`;
    if (this._posOrderKey !== orderKey) {
      this._posOrderKey = orderKey;
      html('preview-tags-container', `${count > 1 ? `<p class="p-recipe-line">Configurando shawarma ${count} del grupo</p>` : ''}<h3 class="p-preview-title">${icon(proteinIcon(item.protein))}${esc(title(item))}</h3>${!item.is_bowl && item.preset !== 'ninos' ? signatureHTML(item.protein) : ''}${specialLabelsHTML(previewSpecial)}${recipeHTML(item, true, isDetailsOpen)}${item.notes ? `<p class="p-note">${icon('edit')}${esc(item.notes)}</p>` : ''}`);
    } else if (existingDetails && existingDetails.open !== isDetailsOpen) {
      existingDetails.open = isDetailsOpen;
    }
    html('prep-type-hint', `${icon(item.is_bowl ? 'bowl' : 'wrap')}<span>${item.is_bowl ? 'Servido en plato, sin pan' : 'Envuelto y tostado en plancha'}</span>`);
    text('p-mobile-summary', `${count > 1 ? count + ' shawarmas' : item.protein} · #${next}`);
    text('p-mobile-action-text', editing ? 'Revisar cambios' : 'Revisar pedido');
    window.ShawarmaService?.refreshMobileReview?.();
  };
  proto.updateGroupTrayUI = function() {
    const n = this.currentGroupItems.length;
    if (!$('group-tray-box')) return;
    $('group-tray-box').style.display = n ? 'block' : 'none';
    text('group-tray-title', `${n} ${n === 1 ? 'shawarma guardado' : 'shawarmas guardados'}`);
    html('btn-add-to-group', `${icon('plus')}<span>${n ? 'Guardar este y agregar otro' : 'Agregar otro shawarma'}</span>`);
    html('group-tray-items-list', this.currentGroupItems.map((item, index) => `<div class="p-tray-item"><div><strong>${index + 1}. ${esc(title(item))}</strong>${recipeHTML(item)}${item.notes ? `<p class="p-recipe-line" data-i18n-ignore>${esc(item.notes)}</p>` : ''}</div><button type="button" data-p-action="remove-item" data-id="${index}" class="p-icon-button" aria-label="Quitar shawarma ${index + 1}">${icon('close')}</button></div>`).join(''));
  };
  function elapsed(o) {
    const start = Date.parse(o.created_at);
    const stopped = o.status === 'delivered' ? (o.delivered_at || o.updated_at) : o.status === 'ready' ? (o.prepared_at || o.updated_at) : null;
    const end = stopped ? Date.parse(stopped) : Date.now();
    return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.floor((end - start) / 1000)) : null;
  }
  function duration(s) {
    if (s === null) return '—';
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(v => String(v).padStart(2, '0')).join(':');
  }
  proto.renderKDS = function() {
    syncSpecialMotion();
    const grid = $('kds-cards-grid');
    if (!grid) return;
    // Sort a copy: drawing the queue must not mutate the stored orders.
    const orders = [...(this.db.orders || [])].sort((a,b) => Number(a.turn) - Number(b.turn));
    const active = orders.filter(o => ['pending','preparing'].includes(o.status));
    const ready = orders.filter(o => o.status === 'ready');
    const delivered = orders.filter(o => o.status === 'delivered');
    text('count-active-kds', active.length); text('count-ready-kds', ready.length);
    text('count-delivered-kds', delivered.length); text('count-all-kds', orders.length);
    const kdsBadge = $('badge-kds-count');
    if (kdsBadge) {
      kdsBadge.textContent = active.length;
      kdsBadge.style.display = active.length > 0 ? 'inline-flex' : 'none';
    }
    document.querySelectorAll('.kds-filter-tab').forEach(b => {b.classList.toggle('active', b.dataset.filter === this.kdsFilter);b.setAttribute('aria-pressed', b.dataset.filter === this.kdsFilter);});
    window._openBatchKeys = window._openBatchKeys || new Set();
    document.querySelectorAll('#kds-batch-counters .p-batch-turns[open]').forEach(el => {
      const k = el.getAttribute('data-batch-key');
      if (k) window._openBatchKeys.add(k);
    });
    window._openTicketDetailsKeys = window._openTicketDetailsKeys || new Set();
    grid.querySelectorAll('.p-recipe-details[open]').forEach(el => {
      const k = el.getAttribute('data-details-key');
      if (k) window._openTicketDetailsKeys.add(k);
    });

    const work = groupPreparation(active);
    html('kds-batch-counters', work.length ? work.map(({item,count,turns}) => {
      const batchKey = preparationKey(item);
      const isBatchOpen = window._openBatchKeys.has(batchKey) ? ' open' : '';
      return `<div class="p-batch-item"><strong>${count}</strong><div><span>${icon(proteinIcon(item.protein))} ${esc(item.protein||'Shawarma')}</span>${batchRecipeHTML(item)}${item.notes?`<p class="p-batch-note">${esc(item.notes)}</p>`:''}<details class="p-batch-turns" data-batch-key="${esc(batchKey)}"${isBatchOpen}><summary>${turns.length} ${turns.length===1?'pedido':'pedidos'}</summary><small>Turnos ${turns.map(t=>'#'+esc(t)).join(', ')}</small></details></div></div>`;
    }).join('') : '<p class="p-recipe-line">No hay pedidos pendientes.</p>');
    text('p-batch-total', `${active.length} ${active.length === 1 ? 'pedido' : 'pedidos'} · ${work.reduce((sum,g)=>sum+g.count,0)} shawarmas`);
    const filtered = {active, ready, delivered}[this.kdsFilter] || orders;
    if (!filtered.length) {
      grid.innerHTML = `<div class="p-empty">${icon(this.kdsFilter === 'ready' ? 'check' : 'kitchen')}<h2>${this.kdsFilter === 'active' ? 'Cocina al día' : 'Sin pedidos en esta sección'}</h2><p>${this.kdsFilter === 'active' ? 'Los nuevos pedidos aparecerán aquí.' : 'Usa los filtros para ver las otras comandas.'}</p></div>`;
      return;
    }
    const plan=productionBatches(this.kdsFilter==='active'?active:orders);
    const renderTicket=(o,portion) => {
      const completeUnits=orderUnits(o),units=portion||completeUnits,items=units.map(x=>x.item),count=completeUnits.reduce((sum,x)=>sum+x.quantity,0);
      const portionCount=units.reduce((sum,x)=>sum+x.quantity,0),partial=portionCount<count;
      const sec = elapsed(o);
      const waiting = ['pending','preparing'].includes(o.status);
      const overdue = waiting && sec !== null && sec >= WARN_WAIT_MINUTES * 60;
      const status = {pending:'En preparación',preparing:'En preparación',ready:'Listo para entregar',delivered:'Entregado',cancelled:'Cancelado'}[o.status] || 'Revisar estado';
      const isDelivered = o.status === 'delivered';
      const isReady = o.status === 'ready';
      const next = isDelivered ? null : (isReady ? ['delivered', count > 1 ? 'Confirmar entrega del grupo' : 'Confirmar entrega', 'box'] : ['ready', count > 1 ? 'Marcar grupo como listo' : 'Marcar como listo', 'check']);
      const date = new Date(o.created_at);
      let time = '—';
      if (Number.isFinite(date.getTime())) {
        let h = date.getHours();
        const m = String(date.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        time = `${h}:${m} ${ampm}`;
      }
      const visualOrder=portion?{...o,is_group:true,items}:o;
      const {birthday} = specialOrder(o);
      const guestDisplayName = birthday
        ? `<span class="p-birthday-guest-badge">${icon('star')}${esc(formatBirthdayName(o.guest_name, o.notes))}</span>`
        : esc(o.guest_name || 'Sin nombre');
      return `<article class="p-ticket status-${esc(o.status)} ${overdue ? 'p-overdue' : ''} ${specialClasses(visualOrder)}" data-order-id="${esc(o.id)}" aria-label="Turno ${esc(o.turn)}, ${esc(o.guest_name)}, ${status}">
        <header class="p-ticket-head"><div><span class="p-eyebrow">Turno</span><h2>#${esc(o.turn)}</h2></div><div class="p-ticket-meta"><span class="p-status p-status-${esc(o.status)}">${icon(waiting ? 'kitchen' : 'check')}${status}</span><span class="p-age-label">${overdue ? '⚠️ Espera prolongada' : (waiting ? 'Desde el pedido' : 'Tiempo total')}</span><strong class="p-age" data-age-id="${esc(o.id)}">${duration(sec)}</strong><span class="p-received">Pedido · ${time}</span></div></header>
        <div class="p-guest-line"><strong>${guestDisplayName}</strong>${o.table ? `<span>${icon('pin')}${esc(o.table)}</span>` : ''}</div>
        ${completeUnits.length > 1 ? `<div class="p-group-title">${icon('group')} Grupo · ${count} shawarmas</div>` : ''}
        ${partial?`<p class="p-tanda-portion">En esta sección: ${portionCount} de ${count} unidades del turno. El pedido queda listo al terminar todas.</p>`:''}
        ${specialLabelsHTML(o)}
        ${o.guest_ack ? `<p class="p-ack">${icon('check')} El invitado viene a retirar</p>` : ''}
        <div class="p-ticket-items">${items.map((item,i) => {
          const ticketKey = `${o.id || o.turn}_${i}`;
          return `<section class="p-ticket-item"><h3>${completeUnits.length > 1 ? `<span class="p-item-number">${(units[i].index??i)+1}</span>` : icon(item.is_bowl ? 'bowl' : proteinIcon(item.protein))}${units[i].quantity>1?`${units[i].quantity} × `:''}${esc(title(item))}</h3>${completeUnits.length>1?specialLabelsHTML(item):''}${recipeHTML(item,true,null,ticketKey)}${item.notes ? `<p class="p-note">${icon('edit')}${esc(item.notes)}</p>` : ''}</section>`;
        }).join('')}</div>
        <div class="p-ticket-actions-bar">
          <button type="button" class="p-kds-tool-btn" data-p-action="edit" data-id="${esc(o.id)}" title="Editar comanda">
            ${icon('edit')}
            <span>Editar</span>
          </button>
          <button type="button" class="p-kds-tool-btn p-tool-danger" data-p-action="delete" data-id="${esc(o.id)}" title="Eliminar comanda">
            ${icon('trash')}
            <span>Eliminar</span>
          </button>
          <button type="button" class="p-kds-tool-btn" data-p-action="qr" data-id="${esc(o.id)}" title="Mostrar código QR">
            ${icon('qr')}
            <span>QR</span>
          </button>
        </div>
        ${next ? button(next[0],o.id,next[1],next[2],`p-primary p-kds-main-btn ${next[0] === 'ready' ? 'p-ready' : 'p-deliver'}`) : `<p class="p-complete">${icon('check')}${status}</p>`}
      </article>`;
    };
    if(this.kdsFilter==='active') {
      const isActive=o=>['pending','preparing'].includes(o.status);
      const renderPortions=units=>{
        const grouped=new Map();
        for(const unit of units) {const key=String(unit.order.id);if(!grouped.has(key))grouped.set(key,{order:unit.order,units:[]});grouped.get(key).units.push(unit);}
        return [...grouped.values()].map(({order,units})=>renderTicket(order,units)).join('');
      };
      grid.innerHTML=plan.batches.map(batch=>{
        const units=batch.units.filter(x=>isActive(x.order));if(!units.length)return '';
        const pending=units.reduce((n,x)=>n+x.quantity,0);
        return `<div class="p-tanda-divider" role="heading" aria-level="3" data-tanda="${batch.number}"><strong>Tanda ${batch.number}</strong><span>${batch.count}/6 pedidos · ${pending} por terminar</span></div>${renderPortions(units)}`;
      }).join('');
    } else grid.innerHTML=filtered.map(o=>renderTicket(o)).join('');
  };
  // Repaint only clocks every second; do not close menus every ten seconds.
  proto.updateTimers = function() {
    if (this.currentView !== 'kitchen') return;
    document.querySelectorAll('[data-age-id]').forEach(el => {
      const o = (this.db.orders || []).find(x => String(x.id) === el.dataset.ageId);
      if (o) {
        const seconds = elapsed(o);
        el.textContent = duration(seconds);
        const late = ['pending','preparing'].includes(o.status) && seconds !== null && seconds >= WARN_WAIT_MINUTES * 60;
        const ticket = el.closest('.p-ticket');
        ticket?.classList.toggle('p-overdue', late);
        const label = ticket?.querySelector('.p-age-label');
        if (label) label.textContent = late ? '⚠️ Espera prolongada' : (['pending','preparing'].includes(o.status) ? 'Desde el pedido' : 'Tiempo total');
      }
    });
  };
  wrap('updateEventTimerDisplay', function() {
    originals.updateEventTimerDisplay.call(this);
    const timer = this.db.event_info?.timer;
    const glyph = !timer?.started_at || timer.is_paused ? 'play' : 'pause';
    html('timer-toggle-icon', icon(glyph)); html('kds-timer-toggle-icon', icon(glyph));
    this.updateTimers();
  });
  wrap('switchView', function(view) {
    originals.switchView.call(this,view);
    document.body.dataset.view = view;
    document.querySelectorAll('.tab-btn').forEach(b => b.setAttribute('aria-selected', b.id === `tab-${view}`));
  });
  wrap('submitOrder', async function() {
    if (this.premiumSubmitting) return;
    const name = $('guest-name')?.value.trim();
    if (!name) {
      soundEngine?.playNotification?.();
      this.showToast('⚠️ Por favor, ingresa el nombre del invitado para enviar la comanda.', 'warning');
      const input = $('guest-name');
      if (input) {
        input.focus();
        input.style.borderColor = '#ef4444';
        input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.35)';
        setTimeout(() => {
          input.style.borderColor = '';
          input.style.boxShadow = '';
        }, 2500);
      }
      return;
    }
    this.premiumSubmitting = true;
    try { await originals.submitOrder.call(this); }
    finally { this.premiumSubmitting = false; }
  });
  proto.markNextBatchReady=async function() {
    if(this.pTandaSubmitting)return;
    const isActive=o=>['pending','preparing'].includes(o.status);
    const active=(this.db.orders||[]).filter(isActive).sort((a,b)=>Number(a.turn)-Number(b.turn));
    const plan=productionBatches(active);
    const batch=plan.batches[0];
    if(!batch){this.showToast('No hay shawarmas pendientes en la plancha.','info');return;}
    const candidates=[...new Map(batch.units.filter(u=>isActive(u.order)).map(u=>[String(u.order.id),u.order])).values()];
    const crossing=candidates.filter(o=>plan.memberships.get(String(o.id)).size>1 || plan.outside.some(u=>u.order===o));
    const eligible=candidates.filter(o=>!crossing.includes(o));
    if(!eligible.length){this.showToast('Este grupo ocupa más de una tanda o incluye bowls. Confirma el grupo desde su tarjeta cuando esté completo.','info');return;}
    const quantity=eligible.flatMap(orderUnits).reduce((n,u)=>n+u.quantity,0);
    const excluded=crossing.length?`\nNo se marcarán completos los grupos que abarcan otras tandas o incluyen bowls.`:'';
    if(!confirm(`¿Terminaste ${quantity} shawarmas de la tanda ${batch.number}?\nTurnos: ${eligible.map(o=>'#'+o.turn).join(', ')}${excluded}`))return;
    this.pTandaSubmitting=true;
    try {
      for(const order of eligible) {
        const res=await fetch('/api/orders/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:order.id,status:'ready'})});
        if(!res.ok)throw new Error('Unconfirmed batch');
        order.status='ready';order.prepared_at ||= new Date().toISOString();
      }
      this.syncData(this.db,true);
      this.showToast(`${quantity} shawarmas de la tanda ${batch.number} confirmados listos.`, 'success');
    } catch(error) {
      this.renderKDS();
      this.showToast('No se confirmó toda la tanda. Revisa los estados y la conexión antes de repetir.','error');
    } finally {this.pTandaSubmitting=false;}
  };
  proto.showToast = function(msg,type='success') {
    const tray = $('toast-tray');if (!tray) return;
    const node = document.createElement('div');node.className = `toast-msg toast-${type}`;
    node.setAttribute('role',type === 'danger' ? 'alert' : 'status');
    node.innerHTML = `${icon(type === 'success' ? 'check' : 'alert')}<span>${esc(stripEmoji(msg))}</span>`;
    tray.appendChild(node);setTimeout(()=>node.remove(),5500);
  };
  let failCount = 0;
  function connection(ok) {
    const badge = $('conn-badge');if (!badge) return;
    if (ok) {
      failCount = 0;
      badge.dataset.connection = 'online';
      text('conn-text','Servidor conectado');
      app.lastConfirmedSync = Date.now();
      badge.title = `Conectado · Última respuesta: ${new Date().toLocaleTimeString()}`;
    } else {
      failCount++;
      if (failCount >= 3) {
        badge.dataset.connection = 'offline';
        text('conn-text','Reconectando...');
      } else {
        badge.dataset.connection = 'online';
        text('conn-text','Servidor conectado');
      }
    }
  }
  wrap('fetchServer', async function() {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (!res.ok) throw new Error('No response');
      const data = await res.json();
      this.syncData(data, true);
      connection(true);
    } catch {
      connection(false);
    }
  });
  async function checkConnection() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch('/api/ping', { signal: controller.signal, cache: 'no-store' });
        connection(res.ok);
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      connection(false);
    }
  }
  async function handleActionClick(event) {
    const b=event.target.closest('[data-p-action]');
    if(!b) {
      // Fill the entire row's tap area without nesting buttons or toggling twice.
      const row=event.target.closest('[data-ingredient-row]');
      if(row && INGREDIENTS_CONFIG.some(i=>i.id===row.dataset.ingredientRow))app.toggleItem(row.dataset.ingredientRow);
      return;
    }
    const id=b.dataset.id,action=b.dataset.pAction;
    if(action==='include'||action==='exclude') app.setPreference(id,action==='include');
    else if(action==='toggle-ingredient') app.toggleItem(id);
    else if(action==='remove-item') app.removeGroupItem(Number(id));
    else if(action==='detail') app.openModal(id);
    else if(action==='qr') app.showOrderQRModalById(id);
    else if(action==='edit') app.editOrder(id);
    else if(action==='delete') {const o=(app.db.orders||[]).find(x=>String(x.id)===id);if(o) await app.deleteOrderPrompt(o.id,o.turn);}
    else if(['preparing','ready','delivered'].includes(action)) {
      if(action==='ready') {
        const isActive=o=>['pending','preparing'].includes(o.status),active=(app.db.orders||[]).filter(isActive).sort((a,b)=>Number(a.turn)-Number(b.turn));
        const plan=productionBatches(active),order=(app.db.orders||[]).find(o=>String(o.id)===String(id));
        if(order && ((plan.memberships.get(String(id))?.size||0)>1 || (orderUnits(order).length>1 && plan.outside.some(u=>u.order===order)))) {
          const total=orderUnits(order).reduce((n,u)=>n+u.quantity,0);
          if(!confirm(`Este turno contiene ${total} unidades en distintas secciones. ¿Están TODAS terminadas?`))return;
        }
      }
      await app.updateStatus(id,action);
    }
  }
  function decorate() {
    document.body.classList.add('premium-ui');
    document.body.dataset.view = app.currentView;
    ['order','kitchen','display','admin'].forEach((id,i)=>{
      const b = $(`tab-${id}`);if (!b) return;
      b.querySelector('.tab-icon').innerHTML = icon(['order','kitchen','monitor','settings'][i]);
      b.setAttribute('role','tab');b.setAttribute('aria-controls',`view-${id}`);
    });
    document.querySelectorAll('.protein-card-btn').forEach(b=>{b.querySelector('.protein-emoji').innerHTML=icon(proteinIcon(b.dataset.protein));if(b.dataset.protein==='Mixto')b.insertAdjacentHTML('beforeend',signatureHTML('Mixto'));});
    const presets = {'con-todo':['check','Con todo'],bowl:['bowl','Bowl sin pan'],ninos:['child','Para niño'],'sin-salsas':['sauce','Sin salsas'],'solo-carnes':['meat','Carnes y salsas'],'sin-cebolla':['onion','Sin cebolla'],'sin-pepinillo':['pickle','Sin pepinillo'],'sin-tomate':['tomato','Sin tomate']};
    Object.entries(presets).forEach(([id,[glyph,label]])=>{const b=$('preset-'+id);if(b){b.querySelector('.preset-icon').innerHTML=icon(glyph);b.querySelector('.preset-txt-main').textContent=label;}});
    document.querySelector('label[for="guest-name"]').innerHTML=`${icon('person')} Nombre del invitado`;
    document.querySelector('label[for="guest-table"]').innerHTML=`${icon('pin')} Mesa / referencia`;
    $('guest-name').placeholder='Nombre del invitado';$('guest-table').placeholder='Ej. Mesa 2';
    $('guest-name').maxLength=100;$('guest-table').maxLength=60;$('order-notes').maxLength=500;
    $('guest-name').addEventListener('input',()=>app.updatePreviewAndTurn());
    $('order-notes').setAttribute('aria-label','Notas para cocina');
    const headers=document.querySelectorAll('#view-order .pos-section-header');
    ['1. Elige la proteína','2. Atajos','3. Ingredientes'].forEach((s,i)=>{headers[i].firstElementChild.textContent=s;headers[i].lastElementChild.textContent=['Selección obligatoria','Recetas rápidas','Incluir o quitar'][i];});
    const notes=$('quick-notes-bar');notes.previousElementSibling.innerHTML=`${icon('edit')} Notas para cocina`;
    const glyphs=['plus','bowl','bowl','sauce','cut','kitchen','falafel','box'];
    notes.querySelectorAll('button').forEach((b,i)=>{
      const match=b.getAttribute('onclick').match(/toggleQuickNote\('([^']+)'\)/);b.dataset.note=match[1];
      b.innerHTML=`${icon(glyphs[i])}<span>${esc(match[1])}</span>`;
    });
    $('btn-submit-order').firstElementChild.innerHTML=icon('send');
    $('btn-cancel-edit').innerHTML=`${icon('close')} Cancelar edición`;
    document.querySelector('#group-tray-box > div > span > span:first-child').innerHTML=icon('group');
    document.querySelector('.sidebar-watermark-container').hidden=false;
    const timer=$('event-timer-container');if(timer?.firstElementChild)timer.firstElementChild.innerHTML=icon('clock');
    if(timer&&!timer.querySelector('.p-timer-label'))timer.firstElementChild.insertAdjacentHTML('afterend','<span class="p-timer-label">Evento</span>');
    const resetSpan=$('timer-reset-icon');if(resetSpan)resetSpan.innerHTML=icon('reset');else if($('btn-timer-reset'))$('btn-timer-reset').innerHTML=icon('reset');
    const kdsResetSpan=$('kds-timer-reset-icon');if(kdsResetSpan)kdsResetSpan.innerHTML=icon('reset');
    const batch=document.querySelector('.kds-batching-bar');
    batch.innerHTML=`<div class="p-batch-heading"><span>${icon('kitchen')} Preparaciones iguales</span><strong id="p-batch-total"></strong></div><div class="batch-chips-wrapper" id="kds-batch-counters"></div>`;
    const filters={active:['clock','En preparación','active'],ready:['check','Listos','ready'],delivered:['box','Entregados','delivered'],all:['list','Todos','all']};
    document.querySelectorAll('.kds-filter-tab').forEach(b=>{const [glyph,label,id]=filters[b.dataset.filter];b.innerHTML=`${icon(glyph)}<span>${label}</span><strong id="count-${id}-kds">0</strong>`;});
    const batchButton=document.querySelector('button[onclick="app.markNextBatchReady()"]');
    batchButton.className='p-batch-ready';batchButton.innerHTML=`${icon('check')} Marcar tanda lista · hasta 6 shawarmas`;
    document.querySelectorAll('#view-display .turn-column-header').forEach((el,i)=>{el.innerHTML=`${icon(i ? 'check' : 'kitchen')}<span>${i?'Listos para entregar':'En preparación'}</span>`;});
    if (!document.querySelector('.p-mobile-review')) {
      document.body.insertAdjacentHTML('beforeend',`<div class="p-mobile-review"><div><span>Pedido actual</span><strong id="p-mobile-summary"></strong></div><button type="button" id="p-review-order">${icon('order')}<span id="p-mobile-action-text">Revisar pedido</span></button></div>`);
      $('p-review-order')?.addEventListener('click',()=>{if(window.ShawarmaService?.confirmMobileReview())return;document.activeElement?.blur?.();const summary=document.querySelector('.summary-card-pos');summary.setAttribute('tabindex','-1');summary.scrollIntoView({behavior:'smooth',block:'start'});summary.focus({preventScroll:true});});
    }
    document.addEventListener('click',handleActionClick);
    window._openBatchKeys = window._openBatchKeys || new Set();
    window._openTicketDetailsKeys = window._openTicketDetailsKeys || new Set();
    document.addEventListener('toggle', e => {
      const t = e.target;
      if (!t || !t.classList) return;
      if (t.classList.contains('p-batch-turns')) {
        const k = t.getAttribute('data-batch-key');
        if (k) {
          if (t.open) window._openBatchKeys.add(k);
          else window._openBatchKeys.delete(k);
        }
      }
      if (t.classList.contains('p-recipe-details')) {
        const k = t.getAttribute('data-details-key');
        if (k) {
          if (t.open) window._openTicketDetailsKeys.add(k);
          else window._openTicketDetailsKeys.delete(k);
        }
        if (t.closest('#preview-tags-container') || t.closest('.summary-card-pos')) {
          window.previewDetailsOpen = t.open;
        }
      }
    }, true);
    connection(false);
    window.addEventListener('online',checkConnection);window.addEventListener('offline',()=>connection(false));
    setInterval(checkConnection,30000);
  }
  wrap('resetForm', function() {
    this._posOrderKey = null;
    window.previewDetailsOpen = false;
    originals.resetForm.call(this);
  });
  wrap('init', function() {decorate();originals.init.call(this);this.updatePreviewAndTurn();});
  // Exposed only for deterministic regression tests, not a second application.
  window.ShawarmaPremium={recipe,recipeHTML,batchRecipeHTML,title,duration,elapsed,esc,icon,core,orderItems,orderUnits,preparationKey,groupPreparation,productionBatches,syncSpecialMotion,proteinIcon,stripEmoji,birthdayMention,specialOrder,bowlFormat,specialClasses,specialLabelsHTML,signatureHTML,formatBirthdayName,handleActionClick};
})();
/* Drumstick icon: ISC License. Copyright (c) 2026 Lucide Icons and Contributors.
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.
THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE. */
