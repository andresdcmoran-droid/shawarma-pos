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
    wrap: '<path d="M12 2v2.5M12 19.5v2.5M8 4.5h8"/><path d="M7 7c1.5-.7 8.5-.7 10 0-.3 3.2.7 6.8 2.2 9.5l-2.8 3-2.8-3C8.1 13.8 7.3 10.2 7 7Z"/><path d="M7.2 9.8c1.6-.4 8-.4 9.6 0M8 12.6c1.4-.4 6.6-.4 8 0M9.2 15.4c1-.3 4.6-.3 5.6 0"/><path d="M4.2 14.5c-.8-1.5 0-3 1-3.8-.2 1.3.6 1.8.5 3.8M19.8 14.5c.8-1.5 0-3-1-3.8.2 1.3-.6 1.8-.5 3.8"/>',
    chicken: '<path d="M5.5 17C3.8 14 4.5 9.5 8 6.5c3.8-3.2 8.5-2.8 11 0 2 2.2 2 6 .5 9.5-2 4.2-6.5 6.2-10.5 5-2-.6-3-1.8-3.5-4Z"/><path d="m9 7.5 3.5 3.5M12 7l4 4M15 8.5l3.5 3.5M7.5 11l3.5 3.5M10 13.5l3.5 3.5"/>',
    meat: '<path d="M5.5 15C3.8 12.2 4 8 7 5.5s8.8-1.5 12 .8c2.5 2 2.8 5.8 1.5 8.8-1.8 3.8-5.8 6-10 5.2-2.2-.4-3.5-1.8-5-5.3Z"/><path d="m8.5 9 6.5 6.5M11.5 6.5l5.5 5.5M6.5 12.5l4 4M9 15.5l5.5-5.5M7 10.5l5-5M12 18l4.5-4.5"/>',
    falafel: '<circle cx="12" cy="7.5" r="4"/><circle cx="7.5" cy="16" r="4"/><circle cx="16.5" cy="16" r="4"/><path d="M11 6.5h.01M13 8.5h.01M11.5 7.5h.01M6.5 15h.01M8.5 17h.01M7.5 16h.01M15.5 15h.01M17.5 17h.01M16.5 16h.01"/>',
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
    cut: '<path d="m4 3 16 18M20 3 4 21"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'
  };
  function icon(name, extra = '') {
    return `<svg class="ui-icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.order}</svg>`;
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normal = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const $ = id => document.getElementById(id);
  const names = {hummus:'bowl',tabule:'bowl',cebolla:'onion',tomate:'tomato',pepinillo:'pickle',nabo:'turnip',ajo:'garlic',ajonjoli:'sauce',falafel:'falafel',picante:'chili'};
  const proteinIcon = (p, color = 'white') => {
    const key = {Mixto:'mixto', Pollo:'pollo', Carne:'carne', Falafel:'falafel'}[p];
    if (key) {
      const file = (key === 'mixto') ? `images/protein-mixto-${color}-v3.png?v=20261011-v20` : `images/protein-${key}-${color}.png?v=20261011-v20`;
      return `<img src="${file}" alt="${esc(p)}" class="protein-icon-art ${key === 'mixto' ? 'protein-art-mixto' : ''}">`;
    }
    return icon('wrap');
  };
  function getProteinMeta(protein, isBowl = false) {
    const p = normal(protein);
    if (p === 'carne') return { name: 'Carne', emoji: isBowl ? '🥗🥩' : '🥩', slug: 'carne', color: '#ef4444' };
    if (p === 'pollo') return { name: 'Pollo', emoji: isBowl ? '🥗🍗' : '🍗', slug: 'pollo', color: '#f59e0b' };
    if (p === 'falafel') return { name: 'Falafel', emoji: isBowl ? '🥗🧆' : '🧆', slug: 'falafel', color: '#10b981' };
    if (isBowl && !p) return { name: 'Bowl', emoji: '🥗', slug: 'bowl', color: '#06b6d4' };
    return { name: 'Mixto', emoji: isBowl ? '🥗🥩🍗' : '🥩🍗', slug: 'mixto', color: '#d41473' };
  }
  function getDominantProteinSlug(units) {
    const slugs = new Set();
    (units || []).forEach(u => {
      const it = u.item || {};
      const isBowl = !!(it.is_bowl || it.preset === 'bowl');
      slugs.add(isBowl ? 'bowl' : getProteinMeta(it.protein, false).slug);
    });
    return slugs.size === 1 ? [...slugs][0] : 'multiple';
  }
  const text = (id, value) => { if ($(id)) $(id).textContent = value; };
  const html = (id, value) => { if ($(id)) $(id).innerHTML = value; };
  const core = () => INGREDIENTS_CONFIG.filter(i => i.isDefault);
  const stripEmoji = s => String(s).replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/ +/g, ' ').trim();
  function wrap(name, fn) { originals[name] = proto[name]; proto[name] = fn; }
  function prepProfile(item) {
    const p = String(item?.preset || '');
    if (p === 'ninos' || p === 'ninos:nino') {
      return { active: true, code: 'ninos:nino', type: 'nino', label: 'Pan y proteína · Niño', shortTag: 'Niño · Preparación suave', hint: 'Tamaño moderado y trato infantil', icon: 'child' };
    }
    if (p === 'ninos:adulto') {
      return { active: true, code: 'ninos:adulto', type: 'adulto', label: 'Pan y proteína · Adulto', shortTag: 'Adulto · Pan y proteína', hint: 'Porción estándar de adulto', icon: 'person' };
    }
    if (p === 'ninos:mayor') {
      return { active: true, code: 'ninos:mayor', type: 'mayor', label: 'Pan y proteína · Persona mayor', shortTag: 'Persona mayor · Preparación suave', hint: 'No muy grande · tacto suave para adulto mayor', icon: 'person' };
    }
    return { active: false, code: p, type: null, label: '', shortTag: '', hint: '', icon: 'wrap' };
  }
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
    const prof = prepProfile(item);
    const kids = prof.active;
    let out = '';
    if (item.is_bowl || item.preset === 'bowl') out += `<span class="p-mod p-format">${icon('bowl')} Sin pan · en plato</span>`;
    if (kids) {
      const whoLabel = prof.type === 'nino' ? 'Niño' : prof.type === 'mayor' ? 'Persona mayor' : 'Adulto';
      const hasExtras = r.included.length > 0;
      const badgeTxt = hasExtras ? `${whoLabel} · Pan y proteína` : `${whoLabel} · Solo pan y proteína`;
      out += `<span class="p-mod p-format p-format-${esc(prof.type)}">${icon(prof.icon)} ${esc(badgeTxt)}</span>`;
      if (hasExtras) {
        out += `<p class="p-recipe-line"><strong>Con:</strong> ${esc(r.included.join(' · '))}</p>`;
      } else {
        const subLine = prof.type === 'nino'
          ? 'Porción infantil · sin vegetales ni salsas'
          : prof.type === 'mayor'
            ? 'Porción suave · sin vegetales ni salsas'
            : 'Sin vegetales ni salsas';
        out += `<p class="p-recipe-line">${subLine}</p>`;
      }
    } else if (r.standard) {
      out += `<p class="p-standard">${icon('check')} Con todo <span>· ${r.count}/${core().length} ingredientes</span></p>`;
    } else if (r.known) {
      const items = [
        ...r.removed.map(s => `<span class="p-mod">Sin ${esc(s)}</span>`),
        ...(!kids ? r.additions.map(i => `<span class="p-mod p-extra ${i.id === 'picante' ? 'p-mod-picante' : ''}" data-ingredient="${esc(i.id)}">${icon(names[i.id])} Con ${esc(i.name.replace(/\s*\(Opcional\)/i, ''))}</span>`) : [])
      ];
      out += `<p class="p-recipe-line">Personalizado · ${r.count}/${core().length} ingredientes base</p>`;
      if (items.length) out += `<div class="p-modifiers">${items.join('')}</div>`;
    } else {
      const items = [
        ...r.removed.map(s => `<span class="p-mod">Sin ${esc(s)}</span>`),
        ...(!kids ? r.additions.map(i => `<span class="p-mod p-extra ${i.id === 'picante' ? 'p-mod-picante' : ''}" data-ingredient="${esc(i.id)}">${icon(names[i.id])} Con ${esc(i.name.replace(/\s*\(Opcional\)/i, ''))}</span>`) : [])
      ];
      out += `<p class="p-recipe-line">Verificar ingredientes del pedido</p>`;
      if (items.length) out += `<div class="p-modifiers">${items.join('')}</div>`;
    }
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
    const kids=items.some(item=>prepProfile(item).active && prepProfile(item).type === 'nino');
    const elder=items.some(item=>prepProfile(item).active && prepProfile(item).type === 'mayor');
    const adultPlain=items.some(item=>prepProfile(item).active && prepProfile(item).type === 'adulto');
    return {birthday,kids,elder,adultPlain};
  }
  function bowlFormat(order) {
    const items=orderItems(order),isBowl=item=>!!(item.is_bowl || item.preset==='bowl');
    return {all:items.length>0 && items.every(isBowl),some:items.some(isBowl)};
  }
  function specialClasses(order) {
    const {birthday,kids,elder}=specialOrder(order);
    const bowl=bowlFormat(order).all;
    return birthday||kids||elder||bowl?`p-special${bowl?' p-bowl':''}${(kids||elder)?' p-kids':''}${kids?' p-nino':''}${birthday?' p-birthday':''}`:'';
  }
  function formatBirthdayName(rawName, notes) {
    const isFemale = /cumpleañera|cumpleanera/i.test((rawName || '') + ' ' + (notes || ''));
    const prefix = isFemale ? 'Cumpleañera' : 'Cumpleañero';
    let cleanName = (rawName || '').replace(/^(cumpleañero|cumpleañera|cumpleanero|cumpleanera|cumple)\s*[:\-–]?\s*/i, '').trim();
    if (!cleanName || cleanName.toLowerCase() === 'comensal' || cleanName.toLowerCase() === 'sin nombre') cleanName = '';
    return cleanName ? `${prefix} ${cleanName}` : prefix;
  }
  function specialLabelsHTML(order) {
    if (!order || !order.is_group) return '';
    const {kids,elder,adultPlain}=specialOrder(order);
    const bowl=bowlFormat(order),labelBowl=bowl.some && (kids||elder||adultPlain||!bowl.all);
    if(!kids&&!elder&&!adultPlain&&!labelBowl)return '';
    return `<span class="p-special-labels">${kids?`<span class="p-special-tag p-kids-tag">${icon('child')}Incluye niño</span>`:''}${elder?`<span class="p-special-tag p-kids-tag">${icon('person')}Incluye persona mayor</span>`:''}${adultPlain?`<span class="p-special-tag p-bowl-tag">${icon('person')}Incluye pan y proteína (Adulto)</span>`:''}${labelBowl?`<span class="p-special-tag p-bowl-tag">${icon('bowl')}${bowl.all?'Bowl sin pan':'Incluye bowls'}</span>`:''}</span>`;
  }
  function signatureHTML(protein) {
    return '';
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
    const prof=prepProfile(item);
    return JSON.stringify([normal(item.protein),!!(item.is_bowl || item.preset==='bowl'),prof.active ? prof.code : false,included,excluded,String(item.notes||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('es')]);
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
    const r=recipe(item),prof=prepProfile(item),labels=[];
    if(item.is_bowl||item.preset==='bowl')labels.push('Bowl sin pan');
    if(prof.active)labels.push(prof.label);
    if(!r.known)labels.push('Verificar ingredientes');
    else if(r.standard)labels.push('Con todo');
    else if(prof.active)labels.push(r.included.length?'Incluye: '+r.included.join(', '):'Solo pan y proteína');
    else labels.push(...r.removed.map(name=>'Sin '+name));
    if(!prof.active)labels.push(...r.additions.map(i=>'Con '+i.name.replace(/\s*\(Opcional\)/i,'')));
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
  proto.renderPosContractBar = function() {
    const bar = $('pos-contract-bar');
    const kdsBar = $('kds-contract-inline');
    if (!bar && !kdsBar) return;
    const serverVal = Number(this.db?.event_info?.contracted_qty);
    let contracted = Number.isFinite(serverVal) && serverVal > 0 ? serverVal : 0;
    if (!contracted && typeof this.getContractedQty === 'function') {
      contracted = this.getContractedQty() || 0;
    }
    const validOrders = (this.db?.orders || []).filter(o => o.status !== 'cancelled');
    const totalOrdered = validOrders.flatMap(orderUnits).reduce((s, u) => s + u.quantity, 0);
    const deliveredUnits = validOrders.filter(o => o.status === 'delivered').flatMap(orderUnits).reduce((s, u) => s + u.quantity, 0);
    const owner = (this.db?.event_info?.owner_name || (typeof this.getEventOwnerName === 'function' ? this.getEventOwnerName() : '') || '').trim();
    const sig = `${contracted}|${totalOrdered}|${deliveredUnits}|${owner}`;

    if (contracted <= 0) {
      if (bar) bar.style.display = 'none';
      if (kdsBar) {
        if (kdsBar.dataset.sig !== sig || kdsBar.style.display === 'none') {
          kdsBar.dataset.sig = sig;
          kdsBar.className = 'kds-contract-inline is-empty';
          kdsBar.style.display = 'inline-flex';
          kdsBar.innerHTML = `<span class="pos-contract-dot"></span><span>${owner ? `Evento: <strong>${esc(owner)}</strong> · ` : ''}Definir contratados</span>`;
        }
      }
      return;
    }

    const remaining = Math.max(0, contracted - totalOrdered);
    const extra = Math.max(0, totalOrdered - contracted);
    const pct = Math.min(100, Math.round((totalOrdered / contracted) * 100));
    const stateCls = extra > 0 || remaining === 0 ? 'is-complete' : remaining <= 5 ? 'is-warn' : 'is-active';
    const rightTxt = extra > 0
      ? `+${extra} adicionales`
      : remaining === 0
        ? 'Meta alcanzada'
        : `Faltan ${remaining} por pedir`;

    if (bar && (bar.dataset.sig !== sig || bar.style.display === 'none')) {
      bar.dataset.sig = sig;
      bar.className = `pos-contract-bar ${stateCls}`;
      bar.style.display = 'flex';
      bar.innerHTML = `
        <div class="pos-contract-row">
          <span class="pos-contract-left">
            <span class="pos-contract-dot"></span>
            ${owner ? `<span>Evento: <strong>${esc(owner)}</strong> · </span>` : ''}
            <strong>${totalOrdered} / ${contracted}</strong>
            <span>contratados</span>
          </span>
          <span class="pos-contract-right">${esc(rightTxt)}</span>
        </div>
        <div class="pos-contract-track"><div class="pos-contract-fill" style="width:${pct}%"></div></div>
      `;
    }

    if (kdsBar && (kdsBar.dataset.sig !== sig || kdsBar.style.display === 'none')) {
      kdsBar.dataset.sig = sig;
      kdsBar.className = `kds-contract-inline ${stateCls}`;
      kdsBar.style.display = 'inline-flex';
      kdsBar.innerHTML = `
        <span class="kds-ci-main">
          ${owner ? `<strong class="kds-ci-owner">${esc(owner)}</strong><span class="kds-ci-vdiv" aria-hidden="true"></span>` : ''}
          <span class="kds-ci-ratio-wrap"><strong class="kds-ci-ratio">${totalOrdered}</strong> <span class="kds-ci-of">de</span> <strong class="kds-ci-ratio">${contracted}</strong> <span class="kds-ci-unit">pedidos</span></span>
        </span>
        <span class="kds-ci-vdiv" aria-hidden="true"></span>
        <span class="kds-ci-rem">${esc(rightTxt)}</span>
        <span class="kds-ci-edit" aria-hidden="true">${icon('edit')}</span>
      `;
    }
  };
  proto.updatePreviewAndTurn = function() {
    syncSpecialMotion();
    this.renderPosContractBar?.();
    const editing = !!(this.editingOrderId && this.editingOrderTurn);
    const turnCounter = Number(this.db?.event_info?.turn_counter) || 0;
    const activeOrders = this.db?.orders || [];
    const next = editing ? this.editingOrderTurn : (activeOrders.length === 0 ? 1 : turnCounter + 1);
    const count = this.currentGroupItems.length + 1;
    text('next-turn-display', String(next).padStart(2, '0'));
    text('turn-label-display', editing ? 'Editando\npedido' : 'Próximo\nturno');
    text('btn-submit-label', editing ? 'Guardar cambios' : count > 1 ? `ENVIAR GRUPO (${count} SHAWARMAS) A COCINA` : 'Enviar a cocina');
    if ($('btn-submit-order')?.style) $('btn-submit-order').style.background = count > 1 ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '';
    if ($('btn-cancel-edit')?.style) $('btn-cancel-edit').style.display = editing ? 'flex' : 'none';
    const item = currentItem(this);
    const rawGuestName = ($('guest-name')?.value || '').trim();
    const rawGuestTable = ($('guest-table')?.value || '').trim();
    const previewSpecial = { ...item, guest_name: rawGuestName };
    const summary = document.querySelector('.summary-card-pos');
    if (summary) for (const cls of ['p-special', 'p-bowl', 'p-kids', 'p-birthday']) summary.classList.toggle(cls, specialClasses(previewSpecial).split(' ').includes(cls));

    const existingDetails = $('preview-tags-container')?.querySelector('.p-recipe-details');
    if (existingDetails) window.previewDetailsOpen = existingDetails.open;
    const isDetailsOpen = !!(typeof window !== 'undefined' && window.previewDetailsOpen);

    const guestLineHTML = `
      <div class="p-guest-modern-block">
        <div class="p-guest-primary ${rawGuestName ? 'has-name' : 'no-name'}">${rawGuestName ? `Para: <strong>${esc(rawGuestName)}</strong>` : 'Invitado sin asignar'}</div>
        ${rawGuestTable ? `<div class="p-guest-secondary"><span class="p-table-pill">${icon('pin')} Mesa: ${esc(rawGuestTable)}</span></div>` : ''}
      </div>
      <div class="p-summary-divider"></div>
    `;

    const isMixto = normal(item.protein) === 'mixto';
    const starHTML = isMixto ? '<span class="p-star-star" title="Especialidad de la casa">★</span>' : '';

    const orderKey = `${item.protein}|${item.preset}|${item.is_bowl}|${(item.ingredients||[]).join(',')}|${(item.removed_ingredients||[]).join(',')}|${item.notes}|${count}|${previewSpecial.guest_name}|${rawGuestTable}`;
    if (this._posOrderKey !== orderKey) {
      this._posOrderKey = orderKey;
      html('preview-tags-container', `${guestLineHTML}${count > 1 ? `<p class="p-recipe-line" style="margin-bottom:8px;">Configurando shawarma ${count} del grupo</p>` : ''}<div class="p-product-modern-row"><div class="p-product-icon-wrap">${proteinIcon(item.protein, 'white')}</div><div class="p-product-modern-info"><h3 class="p-preview-title">${esc(title(item))}${starHTML}</h3>${specialLabelsHTML(previewSpecial)}${recipeHTML(item, true, isDetailsOpen)}${item.notes ? `<p class="p-note">${icon('edit')}${esc(item.notes)}</p>` : ''}</div></div>`);
    } else if (existingDetails && existingDetails.open !== isDetailsOpen) {
      existingDetails.open = isDetailsOpen;
    }
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
  proto.getKdsStation = function() {
    if (!this.kdsStation) {
      try {
        const saved = localStorage.getItem('shawarma_kds_station_v1');
        this.kdsStation = ['armado', 'plancha', 'delivered', 'all'].includes(saved) ? saved : 'armado';
      } catch(_) {
        this.kdsStation = 'armado';
      }
    }
    return this.kdsStation;
  };
  proto.setKdsStation = function(station) {
    if (!['armado', 'plancha', 'delivered', 'all'].includes(station)) return;
    try { window.soundEngine?.playClick?.(); } catch(_) {}
    this.kdsStation = station;
    try { localStorage.setItem('shawarma_kds_station_v1', station); } catch(_) {}
    this.kdsFilter = station === 'delivered' ? 'delivered' : station === 'all' ? 'all' : 'active';
    this._lastKdsSig = null;
    this.renderKDS();
  };
  proto.setKdsFilter = function(filter) {
    const map = { active: 'armado', ready: 'plancha', delivered: 'delivered', all: 'all' };
    this.setKdsStation(map[filter] || 'armado');
  };
  proto.renderKDS = function() {
    syncSpecialMotion();
    const grid = $('kds-cards-grid');
    if (!grid) return;
    const station = this.getKdsStation();
    // Sort a copy: drawing the queue must not mutate the stored orders.
    const orders = [...(this.db.orders || [])].sort((a,b) => Number(a.turn) - Number(b.turn));
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const planchaOrders = orders.filter(o => o.status === 'preparing' || o.status === 'ready');
    const activeAll = orders.filter(o => ['pending','preparing','ready'].includes(o.status));
    const delivered = orders.filter(o => o.status === 'delivered');

    // Actualizar barra única de línea de producción (4 pestañas)
    text('count-station-armado', pendingOrders.length);
    text('count-station-plancha', planchaOrders.length);
    text('count-delivered-kds', delivered.length);
    text('count-all-kds', orders.length);
    document.querySelectorAll('.kds-station-btn').forEach(b => {
      const isAct = b.dataset.station === station;
      b.classList.toggle('active', isAct);
      b.setAttribute('aria-selected', String(isAct));
    });

    const kdsBadge = $('badge-kds-count');
    if (kdsBadge) {
      const badgeCount = station === 'armado' ? pendingOrders.length : station === 'plancha' ? planchaOrders.length : activeAll.length;
      kdsBadge.textContent = badgeCount;
      kdsBadge.style.display = badgeCount > 0 ? 'inline-flex' : 'none';
    }

    // Mostrar/ocultar franja de preparaciones iguales y botón de tanda según etapa
    const batchRow = $('kds-batching-row');
    if (batchRow) {
      batchRow.classList.toggle('is-hidden', station === 'delivered');
    }
    const batchButton = document.querySelector('button[onclick="app.markNextBatchReady()"]');
    if (batchButton) {
      const showBatchBtn = (station === 'armado' || station === 'all') && pendingOrders.length > 0;
      batchButton.style.display = showBatchBtn ? '' : 'none';
      if (showBatchBtn && batchButton.dataset.stationLbl !== 'armado') {
        batchButton.dataset.stationLbl = 'armado';
        batchButton.innerHTML = `${icon('kitchen')} Pasar tanda a plancha · hasta 6`;
      }
    }

    // Smart Diff Guard: evitar destruir y reconstruir el DOM si nada cambió (vital para iPad 7ª Gen y toques táctiles)
    const langKey = document.documentElement?.lang || 'es';
    const kdsSig = `${station}|${langKey}|` + orders.map(o => `${o.id}:${o.turn}:${o.status}:${o.updated_at || ''}:${o.guest_ack ? 1 : 0}:${o.guest_name || ''}:${o.table || ''}:${o.protein || ''}:${o.preset || ''}:${o.items_count || 1}:${o.notes || ''}`).join(';');
    if (this._lastKdsSig === kdsSig && grid.childElementCount > 0) {
      this.updateTimers();
      return;
    }
    this._lastKdsSig = kdsSig;

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

    // Resumen de preparaciones iguales adaptado a la estación activa
    const workSource = station === 'plancha' ? planchaOrders : pendingOrders;
    const work = (() => {
      const groups = new Map();
      [...workSource].sort((a,b)=>Number(a.turn)-Number(b.turn)).forEach(order => {
        orderUnits(order).forEach(({item, quantity, index}) => {
          const key = preparationKey(item) + (Array.isArray(item.ingredients) ? '' : `|unknown:${order.id}:${index}`);
          if (!groups.has(key)) groups.set(key, { key, item, count: 0, turns: [] });
          const g = groups.get(key); g.count += quantity;
          if (!g.turns.includes(order.turn)) g.turns.push(order.turn);
        });
      });
      return [...groups.values()];
    })();

    html('kds-batch-counters', work.length ? work.map(({item,count,turns}) => {
      const isBowlItem = !!(item.is_bowl || item.preset === 'bowl');
      const meta = getProteinMeta(item.protein, isBowlItem);
      const slug = isBowlItem ? 'bowl' : meta.slug;
      const r = recipe(item);
      const prof = prepProfile(item);
      let specLabel = 'Con todo';
      let specCls = 'is-std';
      if (isBowlItem) { specLabel = 'Bowl sin pan'; specCls = 'is-mod'; }
      else if (prof.active) { specLabel = prof.label; specCls = 'is-mod'; }
      else if (r.removed.length || r.additions.length) {
        const parts = [
          ...r.removed.slice(0, 2).map(s => `Sin ${s}`),
          ...r.additions.slice(0, 1).map(i => `Con ${i.name.replace(/\s*\(Opcional\)/i, '')}`)
        ];
        if (r.removed.length > 2) parts.push(`+${r.removed.length - 2}`);
        specLabel = parts.join(' · ');
        specCls = r.additions.some(i => i.id === 'picante') ? 'is-hot' : 'is-mod';
      }
      if (item.notes) { specLabel += ` · ${item.notes}`; }
      const turnsLabel = `Turnos ${turns.map(t => '#' + t).join(', ')}`;
      return `<button type="button" class="b-batch-pill" onclick="this.classList.toggle('is-open')" title="${esc(turnsLabel)}"><strong class="b-bp-num">${count}</strong><span class="b-pdot b-pdot-${slug}" aria-hidden="true"></span><span class="b-bp-prot">${esc(item.protein || 'Shawarma')}</span><span class="b-bp-spec ${specCls}">${esc(specLabel)}</span><span class="b-bp-turns">${esc(turnsLabel)}</span></button>`;
    }).join('') : `<p class="p-recipe-line">${station === 'plancha' ? 'No hay shawarmas en plancha ahora.' : 'No hay pedidos por armar.'}</p>`);
    text('p-batch-total', `${workSource.length} ${workSource.length === 1 ? 'pedido' : 'pedidos'} · ${work.reduce((sum,g)=>sum+g.count,0)} uds`);

    const filtered = station === 'armado' ? pendingOrders : station === 'plancha' ? planchaOrders : station === 'delivered' ? delivered : orders;
    if (!filtered.length) {
      const emptyTitle = station === 'armado' ? 'Mesa de armado al día' : station === 'plancha' ? 'Plancha libre' : station === 'delivered' ? 'Aún no hay entregados' : 'Cocina al día';
      const emptySub = station === 'armado'
        ? 'Los nuevos pedidos del teléfono aparecerán aquí.'
        : station === 'plancha'
          ? 'Cuando Armado pase una comanda a plancha aparecerá aquí al instante.'
          : station === 'delivered'
            ? 'Los pedidos confirmados en Plancha y Entrega se registrarán aquí.'
            : 'Los nuevos pedidos aparecerán aquí.';
      grid.innerHTML = `<div class="p-empty">${icon(station === 'delivered' ? 'check' : 'kitchen')}<h2>${emptyTitle}</h2><p>${emptySub}</p></div>`;
      return;
    }
    const plan=productionBatches(orders);
    const renderTicket=(o,portion) => {
      const completeUnits=orderUnits(o),units=portion||completeUnits,items=units.map(x=>x.item),count=completeUnits.reduce((sum,x)=>sum+x.quantity,0);
      const portionCount=units.reduce((sum,x)=>sum+x.quantity,0),partial=portionCount<count;
      const sec = elapsed(o);
      const waitMins = sec !== null ? Math.floor(sec / 60) : 0;
      const waiting = ['pending','preparing'].includes(o.status);
      const overdue = waiting && sec !== null && sec >= WARN_WAIT_MINUTES * 60;
      const status = {
        pending: station === 'all' ? 'En armado' : 'Por armar',
        preparing: 'En plancha',
        ready: 'Listo para entregar',
        delivered: 'Entregado',
        cancelled: 'Cancelado'
      }[o.status] || 'Revisar estado';
      const statusBadgeText = overdue ? `Espera · ${waitMins} min` : status;
      const isDelivered = o.status === 'delivered';
      const isReady = o.status === 'ready';
      const isPreparing = o.status === 'preparing';

      // Botón principal unificado (2 pasos reales: Armado -> Plancha y Entrega -> Entregado)
      let next = null;
      let mainBtnCls = 'p-to-plancha';
      if (!isDelivered) {
        if (o.status === 'pending') {
          next = ['preparing', count > 1 ? `Grupo armado (${count}) · Pasar a Plancha →` : 'Armado · Pasar a Plancha →', ''];
          mainBtnCls = 'p-to-plancha';
        } else {
          next = ['delivered', count > 1 ? `Confirmar Entrega (${count})` : 'Confirmar Entrega', 'check'];
          mainBtnCls = 'p-deliver-confirm';
        }
      }

      const date = new Date(o.created_at);
      let time = '—';
      if (Number.isFinite(date.getTime())) {
        let h = date.getHours();
        const m = String(date.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        time = `${h}:${m} ${ampm}`;
      }
      const visualOrder=portion?{...o,is_group:true,items}:o;
      const {birthday} = specialOrder(o);
      const guestDisplayName = birthday
        ? `<span class="p-birthday-guest-badge">${icon('star')}${esc(formatBirthdayName(o.guest_name, o.notes))}</span>`
        : esc(o.guest_name || 'Sin nombre');
      const protSlug = getDominantProteinSlug(completeUnits);

      const firstToolBtn = (station === 'plancha' && (isPreparing || isReady))
        ? `<button type="button" class="p-kds-tool-btn p-tool-undo" data-p-action="revert-armado" data-id="${esc(o.id)}" title="Regresar esta comanda a Armado">${icon('reset')}<span>Armado</span></button>`
        : `<button type="button" class="p-kds-tool-btn p-tool-duplicate" data-p-action="duplicate" data-id="${esc(o.id)}" title="Duplicar comanda como nuevo pedido">${icon('copy')}<span>Duplicar</span></button>`;

      const mainBtnHtml = next
        ? `<button type="button" class="p-primary p-kds-main-btn ${mainBtnCls}" data-p-action="${esc(next[0])}" data-id="${esc(o.id)}">${next[2] ? icon(next[2]) : ''}<span>${esc(next[1])}</span></button>`
        : `<p class="p-complete">${icon('check')}${status}</p>`;

      return `<article class="p-ticket status-${esc(o.status)} kds-prot-${protSlug} ${overdue ? 'p-overdue' : ''} ${specialClasses(visualOrder)}" data-order-id="${esc(o.id)}" aria-label="Turno ${esc(o.turn)}, ${esc(o.guest_name)}, ${status}">
        <header class="p-ticket-head"><div class="turn-row-modern kds-turn-modern"><span class="turn-number-giant">${String(o.turn).padStart(2, '0')}</span><div class="turn-label-txt">Turno</div></div><div class="p-ticket-meta"><span class="p-status p-status-${esc(o.status)} ${overdue ? 'is-overdue' : ''}">${esc(statusBadgeText)}</span><strong class="p-age" data-age-id="${esc(o.id)}">${duration(sec)}</strong><span class="p-received">Recibido · ${time}</span></div></header>
        <div class="p-guest-line"><strong>${guestDisplayName}</strong>${o.table ? `<span>${icon('pin')}${esc(o.table)}</span>` : ''}</div>
        ${completeUnits.length > 1 ? `<div class="p-group-title">${icon('group')} Pedido grupal · ${count} shawarmas</div>` : ''}
        ${partial?`<p class="p-tanda-portion">En esta sección: ${portionCount} de ${count} unidades del turno. El pedido queda listo al terminar todas.</p>`:''}
        ${specialLabelsHTML(o)}
        ${o.guest_ack ? `<p class="p-ack">${icon('check')} El invitado viene a retirar</p>` : ''}
        <div class="p-ticket-items">${items.map((item,i) => {
          const ticketKey = `${o.id || o.turn}_${i}`;
          const isMixto = normal(item.protein) === 'mixto';
          const isBowlItem = !!(item.is_bowl || item.preset === 'bowl');
          const meta = getProteinMeta(item.protein, isBowlItem);
          const slug = isBowlItem ? 'bowl' : meta.slug;
          const starIconHTML = isMixto ? '<span class="p-star-star" title="Especialidad de la casa">★</span>' : '';
          return `<section class="p-ticket-item"><h3 class="kds-item-head is-${slug}">${completeUnits.length > 1 ? `<span class="p-item-number">${(units[i].index??i)+1}</span>` : ''}<span class="b-pdot b-pdot-${slug}" aria-hidden="true"></span><span class="kds-item-title">${units[i].quantity>1?`${units[i].quantity} × `:''}${esc(title(item))}${starIconHTML}</span><span class="b-prot-pill">${esc((isBowlItem ? 'BOWL' : meta.name).toUpperCase())}</span></h3>${completeUnits.length>1?specialLabelsHTML(item):''}${recipeHTML(item,true,null,ticketKey)}${item.notes ? `<p class="p-note">${icon('edit')}${esc(item.notes)}</p>` : ''}</section>`;
        }).join('')}</div>
        <div class="p-ticket-footer">
          <div class="p-ticket-actions-bar">
            ${firstToolBtn}
            <button type="button" class="p-kds-tool-btn" data-p-action="edit" data-id="${esc(o.id)}" title="Editar comanda">
              ${icon('edit')}
              <span>Editar</span>
            </button>
            <button type="button" class="p-kds-tool-btn" data-p-action="qr" data-id="${esc(o.id)}" title="Mostrar código QR">
              ${icon('qr')}
              <span>QR</span>
            </button>
            <button type="button" class="p-kds-tool-btn p-tool-danger" data-p-action="delete" data-id="${esc(o.id)}" title="Eliminar comanda">
              ${icon('trash')}
              <span>Eliminar</span>
            </button>
          </div>
          ${mainBtnHtml}
        </div>
      </article>`;
    };
    const activeIds = new Set(filtered.map(o => String(o.id)));
    const isMatching = o => activeIds.has(String(o.id));
    const renderPortions = units => {
      const grouped = new Map();
      for (const unit of units) {
        const key = String(unit.order.id);
        if (!grouped.has(key)) grouped.set(key, { order: unit.order, units: [] });
        grouped.get(key).units.push(unit);
      }
      return [...grouped.values()].map(({ order, units }) => renderTicket(order, units)).join('');
    };

    grid.innerHTML = plan.batches.map(batch => {
      const units = batch.units.filter(x => isMatching(x.order));
      if (!units.length) return '';
      const startNum = (batch.number - 1) * 6 + 1;
      const endNum = batch.number * 6;
      const showDivider = batch.number > 1;

      const pCounts = {};
      batch.units.forEach(u => {
        const p = u.item?.protein || 'Mixto';
        pCounts[p] = (pCounts[p] || 0) + (u.quantity || 1);
      });
      const pSummary = Object.entries(pCounts).map(([p, n]) => `${n} ${p}`).join(', ');

      const dividerHtml = showDivider ? `
        <div class="kds-batch-divider" role="heading" aria-level="3">
          <div class="kds-batch-divider-line"></div>
          <div class="kds-batch-divider-badge">
            <strong class="kds-batch-divider-num">TANDA ${batch.number}</strong>
            <span class="kds-batch-divider-sep">·</span>
            <span class="kds-batch-divider-text">UNIDADES ${startNum} AL ${endNum}</span>
            ${pSummary ? `<span class="kds-batch-divider-sep">·</span><span class="kds-batch-divider-meats">${esc(pSummary.toUpperCase())}</span>` : ''}
          </div>
          <div class="kds-batch-divider-line"></div>
        </div>
      ` : '';
      return `${dividerHtml}${renderPortions(units)}`;
    }).join('');
  };
  // Repaint only clocks every second; do not close menus every ten seconds.
  proto.updateTimers = function() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const timeStr = `${h}:${m} ${ampm}`;

    const headClock = $('event-clock-text');
    if (headClock) headClock.textContent = timeStr;

    const kdsClock = $('kds-live-clock-text');
    if (kdsClock) kdsClock.textContent = timeStr;

    if (this.currentView !== 'kitchen') return;
    document.querySelectorAll('[data-age-id]').forEach(el => {
      const o = (this.db.orders || []).find(x => String(x.id) === el.dataset.ageId);
      if (o) {
        const seconds = elapsed(o);
        el.textContent = duration(seconds);
        const late = ['pending','preparing'].includes(o.status) && seconds !== null && seconds >= WARN_WAIT_MINUTES * 60;
        const ticket = el.closest('.p-ticket');
        ticket?.classList.toggle('p-overdue', late);
        const stBadge = ticket?.querySelector('.p-status');
        if (stBadge && late) {
          stBadge.classList.add('is-overdue');
          stBadge.textContent = `Espera · ${Math.floor(seconds / 60)} min`;
        }
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
    const gear = $('btn-header-admin');
    if (gear) {
      gear.classList.toggle('is-active', view === 'admin');
      gear.setAttribute('aria-pressed', String(view === 'admin'));
    }
  });
  wrap('submitOrder', async function() {
    if (this.premiumSubmitting) return;
    const name = $('guest-name')?.value.trim();
    if (!name) {
      soundEngine?.playNotification?.();
      this.showToast('Por favor, ingresa el nombre del invitado para enviar la comanda.', 'warning');
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
    const station = this.getKdsStation();
    const isArmado = station === 'armado';
    const targetStatus = isArmado ? 'preparing' : 'ready';
    const isActive = isArmado ? (o => o.status === 'pending') : (o => ['pending','preparing'].includes(o.status));
    const active=(this.db.orders||[]).filter(isActive).sort((a,b)=>Number(a.turn)-Number(b.turn));
    const plan=productionBatches(active);
    const batch=plan.batches[0];
    if(!batch){this.showToast(isArmado ? 'No hay shawarmas pendientes por armar.' : 'No hay shawarmas pendientes en cocina.','info');return;}
    const candidates=[...new Map(batch.units.filter(u=>isActive(u.order)).map(u=>[String(u.order.id),u.order])).values()];
    const crossing=candidates.filter(o=>plan.memberships.get(String(o.id)).size>1 || plan.outside.some(u=>u.order===o));
    const eligible=candidates.filter(o=>!crossing.includes(o));
    if(!eligible.length){this.showToast('Este grupo ocupa más de una tanda o incluye bowls. Confirma el grupo desde su tarjeta cuando esté completo.','info');return;}
    const quantity=eligible.flatMap(orderUnits).reduce((n,u)=>n+u.quantity,0);
    const excluded=crossing.length?`\nNo se marcarán completos los grupos que abarcan otras tandas o incluyen bowls.`:'';
    const confirmMsg = isArmado
      ? `¿Pasar ${quantity} shawarmas de la tanda ${batch.number} a PLANCHA?\nTurnos: ${eligible.map(o=>'#'+o.turn).join(', ')}${excluded}`
      : `¿Terminaste ${quantity} shawarmas de la tanda ${batch.number}?\nTurnos: ${eligible.map(o=>'#'+o.turn).join(', ')}${excluded}`;
    if(!confirm(confirmMsg))return;
    const prevStates = eligible.map(o => ({ id: o.id, prevStatus: o.status }));
    const turnRange = eligible.length === 1 ? `Turno #${eligible[0].turn}` : `Turnos #${eligible[0].turn} al #${eligible[eligible.length - 1].turn}`;
    this.recordKDSAction?.({
      type: 'batch',
      items: prevStates,
      range: turnRange,
      label: `Deshacer ${turnRange}`
    });
    this.pTandaSubmitting=true;
    try {
      const nowIso = new Date().toISOString();
      for(const order of eligible) {
        order.status = targetStatus;
        if (targetStatus === 'preparing') order.preparing_at ||= nowIso;
        else order.prepared_at ||= nowIso;
        this.enqueueActionOutbox?.('/api/orders/status', { id: order.id, status: targetStatus }, 'status:' + order.id);
      }
      this.syncData(this.db,true);
      await this.processActionOutboxQueue?.();
      this.showToast(isArmado ? `${quantity} shawarmas de la tanda ${batch.number} enviados a Plancha.` : `${quantity} shawarmas de la tanda ${batch.number} confirmados listos.`, 'success');
    } catch(error) {
      this.renderKDS();
      this.showToast('Tanda guardada en cola local. Se sincronizará automáticamente al recuperar señal.','info');
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
    const badge = $('conn-badge');
    if (ok) {
      failCount = 0;
      app.isOnline = true;
      app.lastConfirmedSync = Date.now();
      if (badge) badge.title = `Conectado · Última respuesta: ${new Date().toLocaleTimeString()}`;
    } else {
      failCount++;
      if (failCount >= 3) {
        app.isOnline = false;
      }
    }
    app.updateConnectionBadge?.();
  }
  wrap('fetchServer', async function() {
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (!res.ok) throw new Error('No response');
      const data = await res.json();
      if (this.currentView === 'kitchen' && Array.isArray(this.db?.orders) && Array.isArray(data?.orders)) {
        const oldActiveIds = new Set((this.db.orders || []).filter(o => ['pending','preparing'].includes(o.status)).map(o => String(o.id)));
        const hasNewOrder = data.orders.some(o => ['pending','preparing'].includes(o.status) && !oldActiveIds.has(String(o.id)));
        if (hasNewOrder && this.db.orders.length > 0) {
          window.soundEngine?.playChime?.();
        }
      }
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
    else if(action==='duplicate') await app.duplicateOrderWithConfirm(id);
    else if(action==='delete') {const o=(app.db.orders||[]).find(x=>String(x.id)===id);if(o) await app.deleteOrderPrompt(o.id,o.turn);}
    else if(action==='revert-armado') {
      const o=(app.db.orders||[]).find(x=>String(x.id)===String(id));
      if(o) {
        await app.updateStatus(id,'pending');
        app.showToast?.(`Turno #${o.turn} regresado a 1. Armado.`, 'info');
      }
    }
    else if(action==='undo-order' || action==='revert-preparing' || action==='revert-ready') {
      const o=(app.db.orders||[]).find(x=>String(x.id)===String(id));
      if(o) {
        if(o.status === 'delivered') {
          await app.updateStatus(id,'ready');
          app.showToast?.(`Turno #${o.turn} regresado a Listos para entregar.`, 'info');
        } else if(o.status === 'ready') {
          await app.updateStatus(id,'preparing');
          app.showToast?.(`Turno #${o.turn} regresado a En preparación.`, 'info');
        } else {
          app.showToast?.(`Turno #${o.turn} ya se encuentra en preparación.`, 'info');
        }
      }
    }
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
    document.querySelectorAll('.protein-card-btn').forEach(b => {
      if (!b.querySelector('.protein-icon-art')) {
        b.querySelector('.protein-emoji').innerHTML = icon(proteinIcon(b.dataset.protein));
      }
      if (b.dataset.protein === 'Mixto') {
        const titleEl = b.querySelector('.protein-title');
        if (titleEl && !titleEl.querySelector('.p-star-star')) {
          titleEl.innerHTML = 'Shawarma Mixto<span class="p-star-star" title="Especialidad de la casa">★</span>';
        }
        const sig = b.querySelector('.p-signature');
        if (sig) sig.remove();
      }
    });
    const presets = {'con-todo':['check','Con todo'],bowl:['bowl','Bowl sin pan'],ninos:['mixto-art','Pan y proteína'],'sin-salsas':['sauce','Sin salsas'],'solo-carnes':['meat','Carnes y salsas'],'sin-cebolla':['onion','Sin cebolla'],'sin-pepinillo':['pickle','Sin pepinillo'],'sin-tomate':['tomato','Sin tomate']};
    Object.entries(presets).forEach(([id,[glyph,label]])=>{const b=$('preset-'+id);if(b){b.querySelector('.preset-icon').innerHTML=glyph==='mixto-art'?proteinIcon('Mixto','white'):icon(glyph);b.querySelector('.preset-txt-main').textContent=label;}});
    try {
      const guestLabel = document.querySelector('label[for="guest-name"]');
      if (guestLabel) {
        guestLabel.style.display = 'flex';
        guestLabel.style.alignItems = 'center';
        guestLabel.style.justifyContent = 'space-between';
        guestLabel.style.gap = '8px';
        guestLabel.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;">${icon('person')} Nombre del invitado</span><button type="button" class="p-repeat-search-btn" onclick="app.openRepeatOrderModal()" title="Buscar cliente y repetir su pedido">${icon('repeat')}<span>Repetir pedido</span></button>`;
      }
      const tableLabel = document.querySelector('label[for="guest-table"]');
      if (tableLabel) tableLabel.innerHTML = `${icon('pin')} Mesa / referencia`;
      const gName = $('guest-name');
      if (gName) {
        gName.placeholder = 'Nombre del invitado';
        gName.maxLength = 100;
        gName.addEventListener('input', () => app.updatePreviewAndTurn());
      }
      const gTable = $('guest-table');
      if (gTable) {
        gTable.placeholder = 'Ej. Mesa 2';
        gTable.maxLength = 60;
        gTable.addEventListener('input', () => app.updatePreviewAndTurn());
      }
      const oNotes = $('order-notes');
      if (oNotes) {
        oNotes.maxLength = 500;
        oNotes.setAttribute('aria-label', 'Notas para cocina');
      }
      const headers = document.querySelectorAll('#view-order .pos-section-header');
      ['1. Elige la proteína','2. Atajos','3. Ingredientes'].forEach((s, i) => {
        if (headers[i]?.firstElementChild) headers[i].firstElementChild.textContent = s;
        if (headers[i]?.lastElementChild) headers[i].lastElementChild.textContent = ['Selección obligatoria','Recetas rápidas','Incluir o quitar'][i];
      });
      const notes = $('quick-notes-bar');
      if (notes && notes.previousElementSibling) {
        notes.previousElementSibling.innerHTML = `${icon('edit')} Notas para cocina`;
        const glyphs = ['plus','bowl','bowl','sauce','cut','kitchen','falafel','box'];
        notes.querySelectorAll('button').forEach((b, i) => {
          const match = b.getAttribute('onclick')?.match(/toggleQuickNote\('([^']+)'\)/);
          if (match) {
            b.dataset.note = match[1];
            b.innerHTML = `${icon(glyphs[i] || 'edit')}<span>${esc(match[1])}</span>`;
          }
        });
      }
      const submitBtn = $('btn-submit-order');
      if (submitBtn?.firstElementChild) submitBtn.firstElementChild.innerHTML = icon('send');
      const cancelEditBtn = $('btn-cancel-edit');
      if (cancelEditBtn) cancelEditBtn.innerHTML = `${icon('close')} Cancelar edición`;
      const groupTraySpan = document.querySelector('#group-tray-box > div > span > span:first-child');
      if (groupTraySpan) groupTraySpan.innerHTML = icon('group');
      const watermark = document.querySelector('.sidebar-watermark-container');
      if (watermark) watermark.hidden = false;
      const resetSpan = $('timer-reset-icon'); if (resetSpan) resetSpan.innerHTML = icon('reset'); else if ($('btn-timer-reset')) $('btn-timer-reset').innerHTML = icon('reset');
      const kdsResetSpan = $('kds-timer-reset-icon'); if (kdsResetSpan) kdsResetSpan.innerHTML = icon('reset');
      const batch = document.querySelector('.kds-batching-bar');
      if (batch) batch.innerHTML = `<div class="p-batch-heading"><span>Preparaciones iguales</span><strong id="p-batch-total"></strong></div><div class="batch-chips-wrapper" id="kds-batch-counters"></div><div class="desktop-only-kds-summary kds-batch-cta-wrap"><button type="button" class="p-batch-ready" onclick="app.markNextBatchReady()">${icon('kitchen')}<span>Pasar tanda a plancha · hasta 6</span></button></div>`;
      const filters = {active:['En preparación','active'],ready:['Listos','ready'],delivered:['Entregados','delivered'],all:['Todos','all']};
      document.querySelectorAll('.kds-filter-tab').forEach(b => {
        const entry = filters[b.dataset.filter];
        if (entry) { const [label, id] = entry; b.innerHTML = `<span>${label}</span><strong id="count-${id}-kds">0</strong>`; }
      });
      const batchButton = document.querySelector('button[onclick="app.markNextBatchReady()"]');
      if (batchButton) { batchButton.className = 'p-batch-ready'; batchButton.innerHTML = `${icon('kitchen')}<span>Pasar tanda a plancha · hasta 6</span>`; }
      document.querySelectorAll('#view-display .turn-column-header').forEach((el, i) => { el.innerHTML = `${icon(i ? 'monitor' : 'box')}<span>${i ? 'Balance de los que faltan' : 'Entregados'}</span>`; });
      if (!document.querySelector('.p-mobile-review')) {
        document.body.insertAdjacentHTML('beforeend', `<div class="p-mobile-review"><div><span>Pedido actual</span><strong id="p-mobile-summary"></strong></div><button type="button" id="p-review-order">${icon('order')}<span id="p-mobile-action-text">Revisar pedido</span></button></div>`);
        $('p-review-order')?.addEventListener('click', () => {
          if (window.ShawarmaService?.confirmMobileReview()) return;
          document.activeElement?.blur?.();
          const summary = document.querySelector('.summary-card-pos');
          if (summary) { summary.setAttribute('tabindex', '-1'); summary.scrollIntoView({behavior:'smooth',block:'start'}); summary.focus({preventScroll:true}); }
        });
      }
      setupInteractiveModals();
      document.addEventListener('click', handleActionClick);
    } catch(err) {
      if (typeof console !== 'undefined' && console.warn) console.warn('Decorate warning:', err);
    }
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

  function setupInteractiveModals() {
    if (!$('prep-profile-modal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay u-overlay" id="prep-profile-modal" style="display:none;z-index:10050;" onclick="app.closePrepProfileModal(event)">
          <section class="u-dialog p-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="prep-profile-title" onclick="event.stopPropagation()">
            <header class="u-dialog-heading">
              <div>
                <span class="p-eyebrow">Ajuste de porción y preparación</span>
                <h2 id="prep-profile-title">${proteinIcon('Mixto', 'white')} Pan y proteína · ¿Para quién es?</h2>
              </div>
              <button type="button" class="p-icon-button" onclick="app.closePrepProfileModal()" aria-label="Cerrar">${icon('close')}</button>
            </header>
            <p class="u-muted" style="margin-bottom:14px;">Selecciona el perfil del comensal para que el preparador ajuste el tamaño y tenga el tacto adecuado en cocina:</p>
            <div class="p-profile-options-grid">
              <button type="button" class="p-profile-option-card" onclick="app.selectPrepProfile('nino')">
                <div class="p-profile-option-icon">${icon('child')}</div>
                <div class="p-profile-option-body">
                  <strong>Niño</strong>
                  <span>Tamaño moderado, fácil de comer y preparación suave para niño.</span>
                </div>
              </button>
              <button type="button" class="p-profile-option-card" onclick="app.selectPrepProfile('adulto')">
                <div class="p-profile-option-icon">${icon('person')}</div>
                <div class="p-profile-option-body">
                  <strong>Adulto</strong>
                  <span>Porción estándar normal de adulto · solo pan y proteína (sin etiqueta infantil).</span>
                </div>
              </button>
              <button type="button" class="p-profile-option-card" onclick="app.selectPrepProfile('mayor')">
                <div class="p-profile-option-icon">${icon('person')}</div>
                <div class="p-profile-option-body">
                  <strong>Persona mayor</strong>
                  <span>No muy grande · preparación suave, bien cuidada y con tacto especial.</span>
                </div>
              </button>
            </div>
            <footer class="u-dialog-footer" style="margin-top:14px;display:flex;justify-content:space-between;gap:8px;">
              <button type="button" class="u-button" onclick="app.applyPreset('con-todo'); app.closePrepProfileModal()">Volver a Con todo</button>
              <button type="button" class="u-button" onclick="app.closePrepProfileModal()">Cerrar</button>
            </footer>
          </section>
        </div>
      `);
    }

    if (!$('repeat-order-modal')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay u-overlay" id="repeat-order-modal" style="display:none;z-index:10050;" onclick="app.closeRepeatOrderModal(event)">
          <section class="u-dialog p-repeat-dialog" role="dialog" aria-modal="true" aria-labelledby="repeat-order-title" onclick="event.stopPropagation()">
            <header class="u-dialog-heading">
              <div>
                <span class="p-eyebrow">Duplicar o repetir pedido rápido</span>
                <h2 id="repeat-order-title">${icon('repeat')} Buscar pedido para repetir</h2>
              </div>
              <button type="button" class="p-icon-button" onclick="app.closeRepeatOrderModal()" aria-label="Cerrar">${icon('close')}</button>
            </header>
            <div class="p-repeat-search-box">
              <input type="search" id="repeat-order-search-input" class="text-input-pos" placeholder="Escribe el nombre (ej: Andrés) o número de turno..." autocomplete="off" oninput="app.renderRepeatOrderList(this.value)">
            </div>
            <div id="repeat-order-list" class="p-repeat-order-list"></div>
          </section>
        </div>
      `);
    }

    if (!$('team-chat-drawer')) {
      document.body.insertAdjacentHTML('beforeend', `
        <aside class="p-chat-drawer" id="team-chat-drawer" aria-label="Chat del equipo" aria-hidden="true">
          <div class="p-chat-panel">
            <header class="p-chat-header">
              <div class="p-chat-header-title">
                <span class="p-chat-online-dot" aria-hidden="true"></span>
                <div>
                  <h2>${icon('chat')} Chat de Equipo</h2>
                  <span class="p-chat-subtitle">Enviando como: <strong id="chat-sender-label">${esc(app.operatorName || 'Andrés')}</strong></span>
                </div>
              </div>
              <button type="button" class="p-icon-button" onclick="app.toggleTeamChat(false)" aria-label="Cerrar chat">${icon('close')}</button>
            </header>
            <div class="p-chat-sender-bar" role="group" aria-label="Seleccionar quién envía">
              <button type="button" class="p-chat-sender-pill" data-operator-preset="Andrés" onclick="app.selectOperatorPreset('Andrés')">Andrés</button>
              <button type="button" class="p-chat-sender-pill" data-operator-preset="Anaíz" onclick="app.selectOperatorPreset('Anaíz')">Anaíz</button>
              <button type="button" class="p-chat-sender-pill" data-operator-preset="Leandro" onclick="app.selectOperatorPreset('Leandro')">Leandro</button>
            </div>
            <div class="p-chat-messages" id="team-chat-messages"></div>
            <form class="p-chat-form" onsubmit="event.preventDefault(); app.sendTeamChatMessage();">
              <input type="text" id="team-chat-input" class="text-input-pos" placeholder="Escribe un mensaje al equipo..." maxlength="240" autocomplete="off">
              <button type="submit" class="u-button u-primary p-chat-send-btn" aria-label="Enviar mensaje">${icon('send')}<span>Enviar</span></button>
            </form>
          </div>
        </aside>
      `);
    }
  }

  proto.openPrepProfileModal = function() {
    const m = $('prep-profile-modal');
    if (!m) return;
    m.style.display = 'flex';
  };
  proto.closePrepProfileModal = function(e) {
    if (e && e.target !== $('prep-profile-modal')) return;
    const m = $('prep-profile-modal');
    if (m) m.style.display = 'none';
  };
  proto.selectPrepProfile = function(type) {
    window.soundEngine?.playClick?.();
    const code = type === 'adulto' ? 'ninos:adulto' : type === 'mayor' ? 'ninos:mayor' : 'ninos:nino';
    this.selectedPreset = code;
    INGREDIENTS_CONFIG.forEach(i => { this.ingredientPreferences[i.id] = false; });
    const btn = $('preset-ninos');
    if (btn) {
      const txt = btn.querySelector('.preset-txt-main');
      const suffix = type === 'adulto' ? ' (Adulto)' : type === 'mayor' ? ' (Mayor)' : ' (Niño)';
      if (txt) txt.textContent = 'Pan y proteína' + suffix;
    }
    this.updatePresetPills();
    this.renderIngredientsMatrix();
    this.updatePreviewAndTurn();
    this.closePrepProfileModal();
  };

  proto.duplicateOrderWithConfirm = async function(orderId) {
    window.soundEngine?.playClick?.();
    const order = (this.db?.orders || []).find(o => String(o.id) === String(orderId));
    if (!order) return;
    const unitsCount = orderUnits(order).reduce((s, u) => s + u.quantity, 0);
    const desc = orderUnits(order).map(u => `${u.quantity > 1 ? u.quantity + 'x ' : ''}${title(u.item)}`).join(' + ');
    const ok = confirm(`⚠️ AVISO DE SEGURIDAD · DUPLICAR PEDIDO\n\n¿Confirmas crear un NUEVO pedido idéntico para "${order.guest_name || 'Invitado'}" (copia del Turno #${order.turn})?\n\nDetalle: ${desc} (${unitsCount} ${unitsCount === 1 ? 'unidad' : 'unidades'})\nSe agregará como un nuevo turno al final de la cola.`);
    if (!ok) return;

    const cloneItems = Array.isArray(order.items) && order.items.length
      ? JSON.parse(JSON.stringify(order.items))
      : [{
          protein: order.protein || 'Mixto',
          preset: order.preset || 'con-todo',
          is_bowl: !!order.is_bowl,
          ingredients: Array.isArray(order.ingredients) ? [...order.ingredients] : [],
          removed_ingredients: Array.isArray(order.removed_ingredients) ? [...order.removed_ingredients] : [],
          notes: order.notes || ''
        }];

    const newOrderData = {
      id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      guest_name: order.guest_name || 'Invitado',
      table: order.table || '',
      protein: order.protein || 'Mixto',
      preset: order.preset || 'con-todo',
      is_bowl: !!order.is_bowl,
      is_group: !!order.is_group,
      items_count: order.items_count || cloneItems.length,
      items: cloneItems,
      ingredients: Array.isArray(order.ingredients) ? [...order.ingredients] : [],
      removed_ingredients: Array.isArray(order.removed_ingredients) ? [...order.removed_ingredients] : [],
      notes: order.notes || '',
      operator: this.operatorName || 'Dispositivo 1',
      quantity: order.quantity || unitsCount || 1,
      created_at: new Date().toISOString()
    };

    this.enqueueOutbox(newOrderData);
    await this.processOutboxQueue();
    this.closeRepeatOrderModal();
    this.showToast(`Pedido de ${order.guest_name} duplicado y enviado a cocina.`, 'success');
  };

  proto.loadOrderToRepeat = function(orderId) {
    window.soundEngine?.playClick?.();
    const order = (this.db?.orders || []).find(o => String(o.id) === String(orderId));
    if (!order) return;
    this.editingOrderId = null;
    this.editingOrderTurn = null;

    const nameInp = $('guest-name');
    const tableInp = $('guest-table');
    if (nameInp) nameInp.value = order.guest_name || '';
    if (tableInp) tableInp.value = order.table || '';

    const entries = orderUnits(order);
    if (entries.length > 1) {
      this.currentGroupItems = JSON.parse(JSON.stringify(entries.slice(0, -1).map(e => e.item)));
    } else {
      this.currentGroupItems = [];
    }
    const lastItem = entries[entries.length - 1]?.item || order;
    this.selectedProtein = lastItem.protein || 'Mixto';
    this.selectedPreset = lastItem.preset || (lastItem.is_bowl ? 'bowl' : 'con-todo');

    this.ingredientPreferences = {};
    const activeList = Array.isArray(lastItem.ingredients) ? lastItem.ingredients : [];
    INGREDIENTS_CONFIG.forEach(i => {
      this.ingredientPreferences[i.id] = activeList.some(ai => normal(ai).includes(normal(i.name)) || normal(ai) === normal(i.id));
    });
    const notesInp = $('order-notes');
    if (notesInp) notesInp.value = lastItem.notes || order.notes || '';

    this.updateGroupTrayUI();
    this.updateProteinCards();
    this.updatePresetPills();
    this.renderIngredientsMatrix();
    this.updateQuickNoteButtons();
    this.updatePreviewAndTurn();
    this.closeRepeatOrderModal();
    this.switchView('order');
    this.showToast(`Receta de ${order.guest_name} (Turno #${order.turn}) cargada y lista para enviar.`, 'info');
  };

  proto.openRepeatOrderModal = function() {
    window.soundEngine?.playClick?.();
    const m = $('repeat-order-modal');
    if (!m) return;
    m.style.display = 'flex';
    const inp = $('repeat-order-search-input');
    if (inp) {
      inp.value = '';
      this.renderRepeatOrderList('');
      setTimeout(() => inp.focus(), 50);
    } else {
      this.renderRepeatOrderList('');
    }
  };
  proto.closeRepeatOrderModal = function(e) {
    if (e && e.target !== $('repeat-order-modal')) return;
    const m = $('repeat-order-modal');
    if (m) m.style.display = 'none';
  };
  proto.renderRepeatOrderList = function(query = '') {
    const container = $('repeat-order-list');
    if (!container) return;
    const q = normal(query);
    const orders = [...(this.db?.orders || [])].filter(o => o.status !== 'cancelled').sort((a, b) => Number(b.turn) - Number(a.turn));
    const filtered = q
      ? orders.filter(o => normal(o.guest_name).includes(q) || String(o.turn).includes(q) || normal(o.table).includes(q))
      : orders;

    if (!filtered.length) {
      container.innerHTML = `<div class="p-empty" style="padding:24px 12px;"><p class="u-muted">${q ? `No se encontraron pedidos con "${esc(query)}".` : 'Aún no hay personas que hayan pedido en este evento.'}</p></div>`;
      return;
    }

    container.innerHTML = filtered.map(o => {
      const units = orderUnits(o);
      const summary = units.map(({item, quantity}) => {
        const prof = prepProfile(item);
        const r = recipe(item);
        const modText = prof.active ? prof.label : r.standard ? 'Con todo' : r.removed.length ? `Sin ${r.removed.join(', ')}` : 'Personalizado';
        return `${quantity > 1 ? quantity + '× ' : ''}${title(item)} (${modText})`;
      }).join(' + ');
      return `
        <div class="p-repeat-item">
          <div class="p-repeat-item-info">
            <div class="p-repeat-item-head">
              <span class="p-repeat-turn">Turno #${esc(o.turn)}</span>
              <strong>${esc(o.guest_name || 'Invitado')}</strong>
              ${o.table ? `<span class="p-table-pill">${icon('pin')} ${esc(o.table)}</span>` : ''}
            </div>
            <p class="p-repeat-item-desc">${esc(summary)}${o.notes ? ` · Nota: ${esc(o.notes)}` : ''}</p>
          </div>
          <div class="p-repeat-item-actions">
            <button type="button" class="u-button" onclick="app.loadOrderToRepeat('${esc(o.id)}')" title="Cargar datos en la pantalla de Pedidos por si deseas ajustar algo">${icon('edit')}<span>Cargar en Pedidos</span></button>
            <button type="button" class="u-button u-primary" onclick="app.duplicateOrderWithConfirm('${esc(o.id)}')" title="Crear nuevo turno idéntico con aviso de confirmación">${icon('copy')}<span>Duplicar directo</span></button>
          </div>
        </div>
      `;
    }).join('');
  };

  proto.selectOperatorPreset = function(presetName) {
    window.soundEngine?.playClick?.();
    if (!presetName) return;
    this.operatorName = presetName.trim();
    try { localStorage.setItem('shawarma_operator_name', this.operatorName); } catch (e) {}
    this.updateOperatorDisplay();
    this.renderTeamChat?.();
    this.showToast(`Equipo configurado: ${this.operatorName}`, 'info');
  };

  const origUpdateOp = proto.updateOperatorDisplay;
  proto.updateOperatorDisplay = function(...args) {
    if (typeof origUpdateOp === 'function') origUpdateOp.apply(this, args);
    const current = this.operatorName || 'Andrés';
    const chatLbl = $('chat-sender-label');
    if (chatLbl) chatLbl.textContent = current;
    document.querySelectorAll('[data-operator-preset]').forEach(btn => {
      const active = btn.dataset.operatorPreset === current;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  };

  proto.chatStage = 'Todos';
  proto.unreadChatCount = 0;
  proto.lastSeenChatId = null;

  proto.toggleTeamChat = function(force) {
    window.soundEngine?.playClick?.();
    const drawer = $('team-chat-drawer');
    if (!drawer) return;
    const isOpen = typeof force === 'boolean' ? force : !drawer.classList.contains('is-open');
    drawer.classList.toggle('is-open', isOpen);
    drawer.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) {
      this.unreadChatCount = 0;
      const msgs = this.db?.event_info?.chat_messages || [];
      if (msgs.length) this.lastSeenChatId = msgs[msgs.length - 1].id;
      this.updateChatBadge();
      this.updateOperatorDisplay();
      this.renderTeamChat();
      setTimeout(() => $('team-chat-input')?.focus(), 80);
    }
  };

  proto.setChatStage = function(stage) {
    window.soundEngine?.playClick?.();
    this.chatStage = stage;
    document.querySelectorAll('.p-chat-stage-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.chatStage === stage);
    });
  };

  proto.updateChatBadge = function() {
    const badge = $('team-chat-badge');
    if (!badge) return;
    badge.textContent = String(this.unreadChatCount || 0);
    badge.style.display = this.unreadChatCount > 0 ? 'inline-flex' : 'none';
  };

  proto.renderTeamChat = function() {
    const box = $('team-chat-messages');
    if (!box) return;
    const msgs = this.db?.event_info?.chat_messages || [];
    if (!msgs.length) {
      box.innerHTML = `<div class="p-chat-empty">${icon('chat')}<p>Chat del equipo listo.</p><small>Escribe cualquier indicación interna y la ventana se abrirá automáticamente en las demás pantallas.</small></div>`;
      return;
    }
    box.innerHTML = msgs.map(m => {
      const d = new Date(m.created_at);
      let tStr = '';
      if (Number.isFinite(d.getTime())) {
        let h = d.getHours();
        const min = String(d.getMinutes()).padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        tStr = `${h}:${min} ${ampm}`;
      }
      const isMe = (m.sender || '') === (this.operatorName || 'Dispositivo 1');
      return `
        <article class="p-chat-bubble ${isMe ? 'is-mine' : ''}">
          <header class="p-chat-bubble-meta">
            <strong>${esc(m.sender || 'Equipo')}</strong>
            <time>${esc(tStr)}</time>
          </header>
          <p class="p-chat-bubble-text">${esc(m.text)}</p>
        </article>
      `;
    }).join('');
    box.scrollTop = box.scrollHeight;
  };

  proto.sendTeamChatMessage = async function(customText) {
    const inp = $('team-chat-input');
    const textVal = (typeof customText === 'string' ? customText : (inp?.value || '')).trim();
    if (!textVal) return;
    window.soundEngine?.playClick?.();
    if (!customText && inp) inp.value = '';

    const sender = this.operatorName || 'Dispositivo 1';
    const stage = this.chatStage || 'Todos';
    const optimisticMsg = {
      id: 'msg_' + Date.now(),
      sender,
      stage,
      text: textVal,
      created_at: new Date().toISOString()
    };
    this.db.event_info ||= {};
    this.db.event_info.chat_messages ||= [];
    this.db.event_info.chat_messages.push(optimisticMsg);
    this.lastSeenChatId = optimisticMsg.id;
    this.renderTeamChat();

    try {
      const res = await fetch('/api/event/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, stage, text: textVal })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.event_info) {
          this.db.event_info = data.event_info;
          const msgs = this.db.event_info.chat_messages || [];
          if (msgs.length) this.lastSeenChatId = msgs[msgs.length - 1].id;
          this.syncData(this.db, true);
        }
      }
    } catch (e) {
      this.syncData(this.db, true);
    }
  };

  const origCleanReset = proto.handleCleanEventReset;
  if (typeof origCleanReset === 'function') {
    proto.handleCleanEventReset = function(data, preserveInputs = false) {
      this.unreadChatCount = 0;
      this.lastSeenChatId = null;
      if (data && data.event_info) {
        data.event_info.chat_messages = [];
      }
      origCleanReset.call(this, data, preserveInputs);
      this.updateChatBadge?.();
      this.renderTeamChat?.();
      const drawer = $('team-chat-drawer');
      if (drawer) {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
      }
    };
  }

  wrap('syncData', function(data, saveCache) {
    const prevMsgs = this.db?.event_info?.chat_messages || [];
    const prevLastId = prevMsgs.length ? prevMsgs[prevMsgs.length - 1].id : this.lastSeenChatId;
    originals.syncData.call(this, data, saveCache);
    const newMsgs = this.db?.event_info?.chat_messages || [];
    if (newMsgs.length) {
      const latest = newMsgs[newMsgs.length - 1];
      if (!this.lastSeenChatId) {
        this.lastSeenChatId = latest.id;
      } else if (latest.id !== prevLastId && latest.id !== this.lastSeenChatId) {
        this.lastSeenChatId = latest.id;
        const isOpen = $('team-chat-drawer')?.classList.contains('is-open');
        if (!isOpen) {
          const drawer = $('team-chat-drawer');
          if (drawer) {
            drawer.classList.add('is-open');
            drawer.setAttribute('aria-hidden', 'false');
          }
          this.unreadChatCount = 0;
          this.updateChatBadge();
        }
        window.soundEngine?.playChime?.();
      }
    }
    this.renderTeamChat?.();
    this.renderPosContractBar?.();
  });

  wrap('resetForm', function(...args) {
    this._posOrderKey = null;
    window.previewDetailsOpen = false;
    originals.resetForm.apply(this, args);
    const btn = $('preset-ninos');
    if (btn) {
      const txt = btn.querySelector('.preset-txt-main');
      if (txt) txt.textContent = 'Pan y proteína';
    }
  });
  /* =========================================================================
     BOUTIQUE ACCESS GATE (CLAVE) & WELCOME EVENT SETUP SCREEN
     ========================================================================= */
  proto.welcomeTarget = 'order';

  proto.getAccessPin = function() {
    try {
      const saved = (localStorage.getItem('shawarma_access_pin_v1') || '').trim();
      return saved || '2026';
    } catch (_) {
      return '2026';
    }
  };

  proto.submitAccessGate = async function() {
    const inp = $('b-gate-pin-input');
    const err = $('b-gate-pin-error');
    const btn = $('b-gate-pin-submit');
    const supplied = (inp?.value || '').trim();
    if (!supplied) return;
    if (err) { err.style.display = 'none'; err.textContent = ''; }

    const localPin = this.getAccessPin();
    let ok = supplied.toLowerCase() === localPin.toLowerCase();

    // Si también existe clave de servidor en Render, intentar /api/auth/login transparentemente
    if (!ok) {
      try {
        if (btn) btn.disabled = true;
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: supplied })
        });
        if (res.ok) ok = true;
      } catch (_) {
      } finally {
        if (btn) btn.disabled = false;
      }
    }

    if (!ok) {
      window.soundEngine?.playNotification?.();
      if (err) {
        err.textContent = 'Clave incorrecta. Intenta de nuevo.';
        err.style.display = 'block';
      }
      if (inp) { inp.value = ''; inp.focus(); }
      return;
    }

    window.soundEngine?.playClick?.();
    const remember = !!$('b-gate-remember-chk')?.checked;
    try {
      sessionStorage.setItem('shawarma_gate_ok_v1', '1');
      if (remember) localStorage.setItem('shawarma_gate_remember_v1', '1');
      else localStorage.removeItem('shawarma_gate_remember_v1');
    } catch (_) {}
    if (inp) inp.value = '';
    this.openWelcomeScreen();
  };

  proto.openWelcomeScreen = function() {
    const pinStep = $('b-gate-step-pin');
    const welcomeStep = $('b-gate-step-welcome');
    if (pinStep) pinStep.style.display = 'none';
    if (welcomeStep) welcomeStep.style.display = 'flex';
    document.documentElement.dataset.gate = 'welcome';

    const owner = (this.db?.event_info?.owner_name || (typeof this.getEventOwnerName === 'function' ? this.getEventOwnerName() : '') || '').trim();
    const qty = Number(this.db?.event_info?.contracted_qty) || (typeof this.getContractedQty === 'function' ? this.getContractedQty() : 0) || 0;
    const validOrders = (this.db?.orders || []).filter(o => o.status !== 'cancelled');
    const orderedUnits = validOrders.flatMap(orderUnits).reduce((s, u) => s + u.quantity, 0);

    const ownerInp = $('b-welcome-owner');
    const qtyInp = $('b-welcome-qty');
    if (ownerInp) ownerInp.value = owner;
    if (qtyInp) qtyInp.value = qty > 0 ? String(qty) : '';

    document.querySelectorAll('.b-qty-chip').forEach(c => {
      c.classList.toggle('is-active', Number(c.textContent.trim()) === qty);
    });

    const banner = $('b-welcome-active-banner');
    if (banner) {
      if (owner || qty > 0) {
        banner.style.display = 'flex';
        banner.innerHTML = `<span class="pos-contract-dot"></span><span>Evento actual: <strong>${esc(owner || 'Sin nombre')}</strong>${qty > 0 ? ` · <strong>${qty}</strong> contratados` : ''}${orderedUnits > 0 ? ` (${orderedUnits} pedidos)` : ''}</span>`;
      } else {
        banner.style.display = 'none';
      }
    }

    // Pre-seleccionar vista/estación actual del dispositivo
    let defaultTarget = 'order';
    if (this.currentView === 'kitchen') {
      const st = this.getKdsStation?.() || 'all';
      defaultTarget = st === 'armado' ? 'armado' : st === 'plancha' ? 'plancha' : 'kitchen';
    }
    this.selectWelcomeTarget(defaultTarget, false);
    setTimeout(() => { (owner ? qtyInp : ownerInp)?.focus?.(); }, 80);
  };

  proto.setWelcomeQty = function(val) {
    window.soundEngine?.playClick?.();
    const qtyInp = $('b-welcome-qty');
    if (qtyInp) qtyInp.value = String(val);
    document.querySelectorAll('.b-qty-chip').forEach(c => {
      c.classList.toggle('is-active', Number(c.textContent.trim()) === Number(val));
    });
  };

  proto.selectWelcomeTarget = function(target, playSfx = true) {
    if (playSfx) window.soundEngine?.playClick?.();
    this.welcomeTarget = target || 'order';
    document.querySelectorAll('[data-welcome-target]').forEach(btn => {
      btn.classList.toggle('is-selected', btn.dataset.welcomeTarget === this.welcomeTarget);
    });
  };

  proto.applyWelcomeTargetRoute = function() {
    const t = this.welcomeTarget || 'order';
    if (t === 'armado') {
      this.setKdsStation?.('armado');
      this.switchView('kitchen');
    } else if (t === 'plancha') {
      this.setKdsStation?.('plancha');
      this.switchView('kitchen');
    } else if (t === 'kitchen') {
      this.setKdsStation?.('all');
      this.switchView('kitchen');
    } else {
      this.switchView('order');
    }
  };

  proto.submitWelcomeEvent = async function() {
    window.soundEngine?.playClick?.();
    const ownerVal = ($('b-welcome-owner')?.value || '').trim();
    const qtyRaw = ($('b-welcome-qty')?.value || '').trim();
    const qtyVal = qtyRaw !== '' ? Math.max(0, Math.round(Number(qtyRaw) || 0)) : undefined;

    if (typeof this.saveEventMeta === 'function' && (ownerVal || qtyVal !== undefined)) {
      await this.saveEventMeta({
        ownerName: ownerVal || this.getEventOwnerName?.() || '',
        qty: qtyVal !== undefined ? qtyVal : (this.getContractedQty?.() || 0)
      });
    }
    document.documentElement.dataset.gate = 'open';
    this.applyWelcomeTargetRoute();
    this.renderPosContractBar?.();
  };

  proto.skipWelcomeScreen = function() {
    window.soundEngine?.playClick?.();
    document.documentElement.dataset.gate = 'open';
    this.applyWelcomeTargetRoute();
  };

  proto.lockAppGate = function() {
    window.soundEngine?.playClick?.();
    try {
      sessionStorage.removeItem('shawarma_gate_ok_v1');
      localStorage.removeItem('shawarma_gate_remember_v1');
    } catch (_) {}
    const pinStep = $('b-gate-step-pin');
    const welcomeStep = $('b-gate-step-welcome');
    if (pinStep) pinStep.style.display = 'flex';
    if (welcomeStep) welcomeStep.style.display = 'none';
    document.documentElement.dataset.gate = 'locked';
    setTimeout(() => $('b-gate-pin-input')?.focus?.(), 80);
  };

  proto.changeAccessPinPrompt = function() {
    window.soundEngine?.playClick?.();
    const current = this.getAccessPin();
    const entered = prompt('Ingresa la clave actual para cambiarla:', '');
    if (entered === null) return;
    if (entered.trim().toLowerCase() !== current.toLowerCase()) {
      this.showToast('Clave actual incorrecta.', 'danger');
      return;
    }
    const nextPin = prompt('Ingresa la nueva clave de acceso (mínimo 4 caracteres):', '');
    if (nextPin === null) return;
    const clean = nextPin.trim();
    if (clean.length < 4) {
      this.showToast('La clave debe tener al menos 4 caracteres.', 'warning');
      return;
    }
    try { localStorage.setItem('shawarma_access_pin_v1', clean); } catch (_) {}
    this.showToast('Clave de acceso actualizada en este dispositivo.', 'success');
  };

  wrap('init', function() {
    decorate();
    originals.init.call(this);
    this.updatePreviewAndTurn();
    this.renderTeamChat?.();
    this.renderPosContractBar?.();
    if (document.documentElement.dataset.gate === 'locked') {
      setTimeout(() => $('b-gate-pin-input')?.focus?.(), 100);
    }
  });
  // Exposed only for deterministic regression tests, not a second application.
  window.ShawarmaPremium={recipe,recipeHTML,batchRecipeHTML,prepProfile,title,duration,elapsed,esc,icon,core,orderItems,orderUnits,preparationKey,groupPreparation,productionBatches,syncSpecialMotion,proteinIcon,stripEmoji,birthdayMention,specialOrder,bowlFormat,specialClasses,specialLabelsHTML,signatureHTML,formatBirthdayName,handleActionClick};
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
