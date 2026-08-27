/**
 * ==========================================================================
 * SHAWARMA EN CASA® - CLIENT APPLICATION LOGIC
 * Offline-First, Real-Time Sync, Zero External Dependencies
 * ==========================================================================
 */

// Official 8 Core Ingredients + Sauces & Specialties from Shawarma en casa®
const INGREDIENTS_CONFIG = [
  // Especialidades de la Casa
  { id: 'hummus', name: 'Hummus', desc: 'Crema de garbanzo con aceite de oliva', icon: '🫘', category: 'specialty', isDefault: true },
  { id: 'tabule', name: 'Tabule', desc: 'Perejil fresco, trigo y tomate', icon: '🥗', category: 'specialty', isDefault: true },
  
  // Vegetales & Encurtidos
  { id: 'cebolla', name: 'Cebolla con Sumac', desc: 'Cebolla en tiras especiada', icon: '🧅', category: 'veg', isDefault: true },
  { id: 'tomate', name: 'Tomate', desc: 'Rodajas de tomate fresco', icon: '🍅', category: 'veg', isDefault: true },
  { id: 'pepinillo', name: 'Pepinillo', desc: 'Pepinillos agridulces encurtidos', icon: '🥒', category: 'veg', isDefault: true },
  { id: 'nabo', name: 'Encurtido de Nabo', desc: 'Nabo morado libanés (Kabees)', icon: '🟣', category: 'veg', isDefault: true },

  // Salsas & Cremas
  { id: 'ajo', name: 'Salsa de Ajo', desc: 'Crema de ajo casera (Toum)', icon: '🧄', category: 'sauce', isDefault: true },
  { id: 'ajonjoli', name: 'Salsa de Ajonjolí', desc: 'Tahini cremoso de sésamo', icon: '🥣', category: 'sauce', isDefault: true },
  { id: 'picante', name: 'Picante', desc: 'Harissa picante de la casa', icon: '🔥', category: 'sauce', isDefault: true }
];

class ShawarmaApp {
  constructor() {
    this.currentView = 'order';
    this.selectedProtein = 'Pollo'; // Pollo | Carne | Mixto | Falafel
    this.selectedPreset = 'con-todo';
    
    // Map of ingredientId -> boolean (true = SÍ QUIERE, false = NO QUIERE)
    this.ingredientPreferences = {};
    
    this.db = {
      event_info: { name: 'Catering Shawarma en Casa®', turn_counter: 0 },
      orders: []
    };
    
    this.kdsFilter = 'active'; // active | ready | delivered | all
    this.eventSource = null;
    this.broadcastChannel = null;
    this.timerInterval = null;
    this.localNetworkUrl = '';

    // Initialize default ingredient states to YES
    this.resetFormToDefault();
  }

  init() {
    this.initBroadcastChannel();
    this.checkUrlParams();
    this.renderIngredientCards();
    this.updatePreviewAndTurn();
    this.startSseSync();
    this.fetchInitialState();
    this.fetchNetworkInfo();

    // Auto-refresh timer for KDS timestamps
    this.timerInterval = setInterval(() => {
      this.updateKdsTimers();
    }, 10000);

    // Enable Web Audio on iPad touch
    document.addEventListener('touchstart', () => window.sounds && window.sounds.init(), { once: true });
    document.addEventListener('click', () => window.sounds && window.sounds.init(), { once: true });
  }

  checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam && ['order', 'kitchen', 'display', 'admin'].includes(viewParam)) {
      this.switchView(viewParam);
    }
  }

  switchView(viewName) {
    this.currentView = viewName;
    
    document.querySelectorAll('.nav-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${viewName}`);
    if (activeTab) activeTab.classList.add('active');

    document.querySelectorAll('.view-container').forEach(view => view.classList.remove('active'));
    const activeView = document.getElementById(`view-${viewName}`);
    if (activeView) activeView.classList.add('active');

    if (viewName === 'kitchen') this.renderKds();
    if (viewName === 'display') this.renderDisplay();
    if (viewName === 'admin') this.renderAdmin();
  }

  // Real-Time Sync Engine via Server-Sent Events
  startSseSync() {
    if (this.eventSource) this.eventSource.close();

    try {
      this.eventSource = new EventSource('/api/stream');

      this.eventSource.addEventListener('init', (e) => {
        this.handleSyncData(JSON.parse(e.data));
      });

      this.eventSource.addEventListener('sync', (e) => {
        const previousOrdersCount = this.db.orders ? this.db.orders.length : 0;
        const newData = JSON.parse(e.data);
        this.handleSyncData(newData);

        if (newData.orders && newData.orders.length > previousOrdersCount) {
          window.sounds && window.sounds.playNewOrder();
          this.showToast('¡Nueva comanda recibida en cocina!', 'success');
        }
      });

      this.eventSource.onopen = () => {
        this.updateSyncBadge(true, 'Red Local OK');
      };

      this.eventSource.onerror = () => {
        this.updateSyncBadge(false, 'Reconectando local...');
        setTimeout(() => this.startSseSync(), 3000);
      };
    } catch (e) {
      console.warn('SSE fallback:', e);
    }
  }

  initBroadcastChannel() {
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('shawarma_catering_sync');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'sync') {
          this.handleSyncData(event.data.payload);
        }
      };
    }
  }

  broadcastLocal(data) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'sync', payload: data });
    }
  }

  async fetchInitialState() {
    try {
      const cached = localStorage.getItem('shawarma_db');
      if (cached) {
        this.handleSyncData(JSON.parse(cached), false);
      }
    } catch (e) {}

    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        this.handleSyncData(data, true);
      }
    } catch (e) {
      console.warn('Operando en modo autónomo local:', e);
      this.updateSyncBadge(true, 'Modo Local Autónomo');
    }
  }

  async fetchNetworkInfo() {
    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        const info = await res.json();
        this.localNetworkUrl = `http://${info.local_ip}:${info.port}`;
      } else {
        this.localNetworkUrl = window.location.origin;
      }
    } catch (e) {
      this.localNetworkUrl = window.location.origin || 'http://localhost:8080';
    }

    const ipEl = document.getElementById('local-ip-url');
    if (ipEl) ipEl.textContent = this.localNetworkUrl;

    const qrContainer = document.getElementById('qr-code-container');
    if (qrContainer && window.generateQRCodeSVG) {
      qrContainer.innerHTML = window.generateQRCodeSVG(this.localNetworkUrl, 160);
    }
  }

  handleSyncData(data, saveCache = true) {
    if (!data) return;
    this.db = data;
    
    if (saveCache) {
      try {
        localStorage.setItem('shawarma_db', JSON.stringify(data));
      } catch (e) {}
    }

    const headerTitle = document.getElementById('header-event-name');
    if (headerTitle && data.event_info) {
      headerTitle.textContent = `📍 ${data.event_info.name || 'Shawarma en Casa®'}`;
    }

    this.updatePreviewAndTurn();

    if (this.currentView === 'kitchen') this.renderKds();
    if (this.currentView === 'display') this.renderDisplay();
    if (this.currentView === 'admin') this.renderAdmin();

    const pendingCount = (this.db.orders || []).filter(o => o.status === 'pending' || o.status === 'preparing').length;
    const badgeEl = document.getElementById('kds-pending-badge');
    if (badgeEl) badgeEl.textContent = pendingCount;
  }

  updateSyncBadge(isConnected, text) {
    const syncEl = document.getElementById('sync-indicator');
    const syncText = document.getElementById('sync-text');
    if (syncEl && syncText) {
      syncText.textContent = text;
      syncEl.style.borderColor = isConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
      const dot = syncEl.querySelector('.sync-dot');
      if (dot) dot.style.background = isConnected ? '#10b981' : '#ef4444';
    }
  }

  // =========================================================================
  // VIEW 1: ORDERING / WAITER INTERACTION (SÍ QUIERE / NO QUIERE)
  // =========================================================================

  resetFormToDefault() {
    this.selectedProtein = 'Pollo';
    this.selectedPreset = 'con-todo';
    
    // Set all ingredients to YES by default ("Shawarma Con Todo")
    this.ingredientPreferences = {};
    INGREDIENTS_CONFIG.forEach(ing => {
      this.ingredientPreferences[ing.id] = true;
    });

    const nameInput = document.getElementById('guest-name');
    const tableInput = document.getElementById('guest-table');
    const notesInput = document.getElementById('order-notes');
    
    if (nameInput) nameInput.value = '';
    if (tableInput) tableInput.value = '';
    if (notesInput) notesInput.value = '';

    this.updateProteinButtons();
    this.updatePresetButtons();
    this.renderIngredientCards();
    this.updatePreviewAndTurn();
  }

  selectProtein(protein) {
    window.sounds && window.sounds.playClick();
    this.selectedProtein = protein;
    this.updateProteinButtons();
    this.updatePreviewAndTurn();
  }

  updateProteinButtons() {
    document.querySelectorAll('.protein-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.protein === this.selectedProtein);
    });
  }

  // Quick 1-Tap Presets
  applyPreset(presetName) {
    window.sounds && window.sounds.playClick();
    this.selectedPreset = presetName;

    if (presetName === 'con-todo') {
      // All YES
      INGREDIENTS_CONFIG.forEach(ing => {
        this.ingredientPreferences[ing.id] = true;
      });
    } else if (presetName === 'sin-cebolla') {
      // All YES, except Onion = NO
      INGREDIENTS_CONFIG.forEach(ing => {
        this.ingredientPreferences[ing.id] = (ing.id !== 'cebolla');
      });
    } else if (presetName === 'solo-carnes') {
      // Only Hummus, Ajo, Ajonjolí = YES. Veggies = NO
      INGREDIENTS_CONFIG.forEach(ing => {
        const isSauceOrHummus = ing.id === 'hummus' || ing.id === 'ajo' || ing.id === 'ajonjoli';
        this.ingredientPreferences[ing.id] = isSauceOrHummus;
      });
    }

    this.updatePresetButtons();
    this.renderIngredientCards();
    this.updatePreviewAndTurn();
  }

  updatePresetButtons() {
    const conTodoBtn = document.getElementById('preset-con-todo');
    const sinCebollaBtn = document.getElementById('preset-sin-cebolla');
    const soloCarnesBtn = document.getElementById('preset-solo-carnes');

    if (conTodoBtn) conTodoBtn.classList.toggle('active', this.selectedPreset === 'con-todo');
    if (sinCebollaBtn) sinCebollaBtn.classList.toggle('active', this.selectedPreset === 'sin-cebolla');
    if (soloCarnesBtn) soloCarnesBtn.classList.toggle('active', this.selectedPreset === 'solo-carnes');
  }

  // Toggle individual ingredient (SÍ QUIERE <-> NO QUIERE)
  setIngredientPreference(id, wantsIt) {
    window.sounds && window.sounds.playClick();
    this.ingredientPreferences[id] = wantsIt;
    this.selectedPreset = 'custom';
    
    this.updatePresetButtons();
    this.renderIngredientCards();
    this.updatePreviewAndTurn();
  }

  toggleIngredient(id) {
    const currentState = this.ingredientPreferences[id] !== false;
    this.setIngredientPreference(id, !currentState);
  }

  renderIngredientCards() {
    const container = document.getElementById('ingredients-matrix-container');
    if (!container) return;

    container.innerHTML = INGREDIENTS_CONFIG.map(item => {
      const wantsIt = this.ingredientPreferences[item.id] !== false;
      const stateClass = wantsIt ? 'state-yes' : 'state-no';

      return `
        <div class="ingredient-card ${stateClass}" onclick="app.toggleIngredient('${item.id}')">
          <div class="ingredient-card-header">
            <span class="ing-icon">${item.icon}</span>
            <div class="ing-info">
              <span class="ing-name">${item.name}</span>
              <span class="ing-desc">${item.desc}</span>
            </div>
          </div>
          
          <div class="toggle-pill" onclick="event.stopPropagation()">
            <div class="toggle-opt toggle-opt-yes" onclick="app.setIngredientPreference('${item.id}', true)">
              ✓ SÍ QUIERE
            </div>
            <div class="toggle-opt toggle-opt-no" onclick="app.setIngredientPreference('${item.id}', false)">
              ✕ NO QUIERE
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  getRemovedIngredients() {
    return INGREDIENTS_CONFIG
      .filter(ing => this.ingredientPreferences[ing.id] === false)
      .map(ing => ing.name);
  }

  getActiveIngredients() {
    return INGREDIENTS_CONFIG
      .filter(ing => this.ingredientPreferences[ing.id] !== false)
      .map(ing => ing.name);
  }

  updatePreviewAndTurn() {
    const nextTurn = (this.db.event_info?.turn_counter || 0) + 1;
    
    const turnDisplay = document.getElementById('next-turn-display');
    const submitBtnText = document.getElementById('btn-submit-text');
    if (turnDisplay) turnDisplay.textContent = `#${nextTurn}`;
    if (submitBtnText) submitBtnText.textContent = `ENVIAR A COCINA (TURNO #${nextTurn})`;

    const tagsContainer = document.getElementById('preview-tags');
    if (!tagsContainer) return;

    const tags = [];
    
    // Protein Tag
    tags.push(`<span class="preview-tag tag-protein">🌯 SHAWARMA DE ${this.selectedProtein.toUpperCase()}</span>`);

    // Removed Warnings in RED
    const removed = this.getRemovedIngredients();
    if (removed.length > 0) {
      removed.forEach(name => {
        tags.push(`<span class="preview-tag tag-removed">⛔ SIN ${name.toUpperCase()}</span>`);
      });
    } else {
      tags.push(`<span class="preview-tag tag-preset">⭐ CON TODO (RECETA COMPLETA)</span>`);
    }

    tagsContainer.innerHTML = tags.join('');
  }

  async submitOrder() {
    const nameInput = document.getElementById('guest-name');
    const tableInput = document.getElementById('guest-table');
    const notesInput = document.getElementById('order-notes');

    const guestName = nameInput?.value.trim() || 'Invitado';
    const table = tableInput?.value.trim() || '';
    const notes = notesInput?.value.trim() || '';

    const activeIngredients = this.getActiveIngredients();
    const removedIngredients = this.getRemovedIngredients();

    const orderPayload = {
      guest_name: guestName,
      table: table,
      protein: this.selectedProtein,
      preset: this.selectedPreset,
      ingredients: activeIngredients,
      removed_ingredients: removedIngredients,
      notes: notes,
      quantity: 1
    };

    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const result = await res.json();
        const createdOrder = result.order;

        window.sounds && window.sounds.playClick();
        this.showToast(`¡Turno #${createdOrder.turn} registrado para ${createdOrder.guest_name}!`, 'success');
        this.resetFormToDefault();
      } else {
        throw new Error('Server error');
      }
    } catch (e) {
      console.warn('Guardando comanda en modo local:', e);
      
      const nextTurn = (this.db.event_info?.turn_counter || 0) + 1;
      if (!this.db.event_info) this.db.event_info = { name: 'Shawarma en Casa®', turn_counter: 0 };
      this.db.event_info.turn_counter = nextTurn;

      const localOrder = {
        id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        turn: nextTurn,
        ...orderPayload,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (!this.db.orders) this.db.orders = [];
      this.db.orders.push(localOrder);
      this.handleSyncData(this.db, true);
      this.broadcastLocal(this.db);

      window.sounds && window.sounds.playClick();
      this.showToast(`¡Turno #${nextTurn} registrado localmente para ${guestName}!`, 'success');
      this.resetFormToDefault();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
      }
    }
  }

  // =========================================================================
  // VIEW 2: KITCHEN DISPLAY SYSTEM (KDS)
  // =========================================================================

  setKdsFilter(filter) {
    this.kdsFilter = filter;
    document.querySelectorAll('.kds-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    this.renderKds();
  }

  renderKds() {
    const container = document.getElementById('kds-orders-container');
    const batchContainer = document.getElementById('batch-counters-container');
    if (!container) return;

    const orders = this.db.orders || [];

    const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');
    const deliveredOrders = orders.filter(o => o.status === 'delivered');

    document.getElementById('filter-count-active').textContent = activeOrders.length;
    document.getElementById('filter-count-ready').textContent = readyOrders.length;
    document.getElementById('filter-count-delivered').textContent = deliveredOrders.length;

    // Batching counts by protein
    const countsByProtein = { Pollo: 0, Carne: 0, Mixto: 0, Falafel: 0 };
    activeOrders.forEach(o => {
      const p = o.protein || 'Pollo';
      if (countsByProtein[p] !== undefined) countsByProtein[p]++;
      else countsByProtein[p] = 1;
    });

    if (batchContainer) {
      batchContainer.innerHTML = `
        <div class="batch-chip batch-total">
          <span>⏳ Total Pendientes:</span>
          <span class="count-pill">${activeOrders.length}</span>
        </div>
        <div class="batch-chip">
          <span>🍗 Pollo:</span>
          <span class="count-pill">${countsByProtein.Pollo}</span>
        </div>
        <div class="batch-chip">
          <span>🥩 Carne:</span>
          <span class="count-pill">${countsByProtein.Carne}</span>
        </div>
        <div class="batch-chip">
          <span>🌯 Mixto:</span>
          <span class="count-pill">${countsByProtein.Mixto}</span>
        </div>
        <div class="batch-chip">
          <span>🧆 Falafel:</span>
          <span class="count-pill">${countsByProtein.Falafel}</span>
        </div>
      `;
    }

    let displayed = [];
    if (this.kdsFilter === 'active') {
      displayed = activeOrders;
    } else if (this.kdsFilter === 'ready') {
      displayed = readyOrders;
    } else if (this.kdsFilter === 'delivered') {
      displayed = deliveredOrders;
    } else {
      displayed = orders;
    }

    displayed.sort((a, b) => a.turn - b.turn);

    if (displayed.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--kds-text-muted);">
          <div style="font-size: 54px; margin-bottom: 12px;">🌯</div>
          <h3 style="font-size: 20px; color: #f4f4f5;">No hay comandas en esta sección</h3>
          <p style="font-size: 14px; margin-top: 6px;">Los nuevos pedidos aparecerán en tiempo real.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = displayed.map(order => this.renderKdsCard(order)).join('');
  }

  renderKdsCard(order) {
    const elapsedMinutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
    const isWarning = elapsedMinutes >= 8 && order.status !== 'ready' && order.status !== 'delivered';

    let proteinIcon = '🍗';
    if (order.protein === 'Carne') proteinIcon = '🥩';
    if (order.protein === 'Mixto') proteinIcon = '🌯';
    if (order.protein === 'Falafel') proteinIcon = '🧆';

    // Highlight removed vs complete
    let alertBlocks = '';
    if (order.removed_ingredients && order.removed_ingredients.length > 0) {
      alertBlocks += `
        <div class="kds-alert-box kds-alert-danger">
          ${order.removed_ingredients.map(r => `<div>⛔ NO QUIERE: ${r.toUpperCase()}</div>`).join('')}
        </div>
      `;
    } else {
      alertBlocks += `
        <div class="kds-alert-box kds-alert-success">
          <div>⭐ CON TODO (HUMMUS, TABULE, CEBOLLA, TOMATE, PEPINILLO, NABO, AJO, AJONJOLÍ, PICANTE)</div>
        </div>
      `;
    }

    let actionButtons = '';
    if (order.status === 'pending') {
      actionButtons = `
        <button class="kds-btn kds-btn-prep" onclick="app.updateOrderStatus('${order.id}', 'preparing')">
          🔥 A la Plancha
        </button>
        <button class="kds-btn kds-btn-ready" onclick="app.updateOrderStatus('${order.id}', 'ready')">
          ✅ ¡LISTO!
        </button>
      `;
    } else if (order.status === 'preparing') {
      actionButtons = `
        <button class="kds-btn kds-btn-ready" onclick="app.updateOrderStatus('${order.id}', 'ready')">
          ✅ ¡LISTO PARA ENTREGAR!
        </button>
      `;
    } else if (order.status === 'ready') {
      actionButtons = `
        <button class="kds-btn kds-btn-deliver" onclick="app.updateOrderStatus('${order.id}', 'delivered')">
          🎉 MARCAR ENTREGADO
        </button>
      `;
    } else {
      actionButtons = `
        <div style="grid-column: span 2; text-align: center; color: #10b981; font-size: 14px; font-weight: 800; padding: 6px;">
          ✓ Entregado a ${order.guest_name}
        </div>
      `;
    }

    return `
      <div class="kds-order-card status-${order.status}" id="card-${order.id}">
        <div>
          <!-- Header -->
          <div class="kds-card-header">
            <div>
              <div class="turn-pill">TURNO #${order.turn}</div>
              <div class="kds-timer ${isWarning ? 'timer-warning' : ''}">
                <span>⏱️</span> <span>hace ${elapsedMinutes === 0 ? 'un momento' : `${elapsedMinutes} min`}</span>
              </div>
            </div>
            <div class="guest-info">
              <div class="kds-name">${order.guest_name}</div>
              ${order.table ? `<div class="kds-table">📍 ${order.table}</div>` : ''}
            </div>
          </div>

          <!-- Recipe Body -->
          <div style="margin-top: 12px;">
            <div class="kds-protein-badge">
              <span>${proteinIcon}</span>
              <span>SHAWARMA DE ${order.protein.toUpperCase()}</span>
            </div>

            ${alertBlocks}

            ${order.notes ? `<div class="kds-notes">📝 NOTA: ${order.notes}</div>` : ''}
            
            <div style="font-size: 11px; color: #71717a; margin-top: 8px; font-weight: 600;">
              🔥 Tostado en plancha grill
            </div>
          </div>
        </div>

        <div class="kds-actions">
          ${actionButtons}
        </div>
      </div>
    `;
  }

  async updateOrderStatus(orderId, newStatus) {
    window.sounds && window.sounds.playClick();

    if (newStatus === 'ready') {
      window.sounds && window.sounds.playOrderReady();
    }

    const order = this.db.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      order.updated_at = new Date().toISOString();
      if (newStatus === 'ready') order.prepared_at = new Date().toISOString();
      if (newStatus === 'delivered') order.delivered_at = new Date().toISOString();
      this.handleSyncData(this.db, true);
      this.broadcastLocal(this.db);
    }

    try {
      await fetch('/api/orders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
    } catch (e) {
      console.warn('Status actualizado localmente:', e);
    }
  }

  updateKdsTimers() {
    if (this.currentView === 'kitchen') {
      this.renderKds();
    }
  }

  // =========================================================================
  // VIEW 3: MONITOR DE TURNOS PARA INVITADOS (DISPLAY VIEW)
  // =========================================================================

  renderDisplay() {
    const prepContainer = document.getElementById('display-prep-grid');
    const readyContainer = document.getElementById('display-ready-grid');
    if (!prepContainer || !readyContainer) return;

    const orders = this.db.orders || [];
    const preparingOrders = orders.filter(o => o.status === 'preparing' || o.status === 'pending');
    const readyOrders = orders.filter(o => o.status === 'ready');

    prepContainer.innerHTML = preparingOrders.length === 0
      ? '<div style="color: #a1a1aa; padding: 20px; font-size: 16px;">Sin pedidos en cola</div>'
      : preparingOrders.map(o => `
        <div class="display-turn-card">
          <div class="display-turn-num">#${o.turn}</div>
          <div class="display-turn-name">${o.guest_name}</div>
          <div style="font-size: 12px; color: #a1a1aa; margin-top: 4px;">${o.protein}</div>
        </div>
      `).join('');

    readyContainer.innerHTML = readyOrders.length === 0
      ? '<div style="color: #a1a1aa; padding: 20px; font-size: 16px;">Esperando deliciosos shawarmas...</div>'
      : readyOrders.map(o => `
        <div class="display-turn-card card-ready">
          <div class="display-turn-num">#${o.turn}</div>
          <div class="display-turn-name">${o.guest_name}</div>
          <div style="font-size: 13px; color: #d1fae5; font-weight: 800; margin-top: 4px;">¡LISTO PARA RETIRAR!</div>
        </div>
      `).join('');
  }

  // =========================================================================
  // VIEW 4: ADMIN & METRICS
  // =========================================================================

  renderAdmin() {
    const orders = this.db.orders || [];
    
    document.getElementById('stat-total-orders').textContent = orders.length;
    document.getElementById('stat-chicken-orders').textContent = orders.filter(o => o.protein === 'Pollo').length;
    document.getElementById('stat-beef-orders').textContent = orders.filter(o => o.protein === 'Carne').length;
    document.getElementById('stat-mixed-orders').textContent = orders.filter(o => o.protein === 'Mixto').length;
  }

  copyUrl() {
    if (this.localNetworkUrl) {
      navigator.clipboard.writeText(this.localNetworkUrl).then(() => {
        this.showToast('¡Enlace local copiado!', 'success');
      });
    }
  }

  exportCSV() {
    const orders = this.db.orders || [];
    if (orders.length === 0) {
      this.showToast('No hay pedidos registrados para exportar', 'danger');
      return;
    }

    const headers = ['Turno', 'Invitado', 'Mesa', 'Proteina', 'No_Quiere', 'Ingredientes_Activos', 'Estado', 'Hora'];
    const rows = orders.map(o => [
      o.turn,
      `"${o.guest_name}"`,
      `"${o.table || ''}"`,
      `"${o.protein}"`,
      `"${(o.removed_ingredients || []).join(', ')}"`,
      `"${(o.ingredients || []).join(', ')}"`,
      o.status,
      `"${o.created_at}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shawarma_en_casa_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Reporte CSV descargado con éxito', 'success');
  }

  async resetEventPrompt() {
    const eventName = prompt('Nombre del nuevo evento de catering:', 'Catering Shawarma en Casa®');
    if (!eventName) return;

    if (confirm('¿Estás seguro de reiniciar los turnos a #1? Los datos actuales quedarán respaldados.')) {
      try {
        const res = await fetch('/api/event/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: eventName })
        });

        if (res.ok) {
          this.showToast('Nuevo evento iniciado con éxito', 'success');
          this.fetchInitialState();
        }
      } catch (e) {
        this.showToast('Error al reiniciar evento', 'danger');
      }
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : '⚠️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

window.app = new ShawarmaApp();
window.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
