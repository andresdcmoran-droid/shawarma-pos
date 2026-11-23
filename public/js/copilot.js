/* ============================================================================
   SHAWARMA EN CASA · COPILOTO OPERATIVO CON VOZ HUMANA GEMINI + ACCIONES SEGURAS
   100% aislado: ejecuta solo acciones seguras (avanzar turno, chat, vista).
   Nunca puede eliminar pedidos ni reiniciar el evento.
   ============================================================================ */
(() => {
  'use strict';

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const OVERDUE_ALERT_MINUTES = 12;

  const state = {
    open: false,
    mode: 'local', // 'gemini' | 'local'
    configured: false,
    model: 'gemini-2.5-flash-lite',
    voiceOut: true,
    earpieceAlerts: false,
    listening: false,
    thinking: false,
    recognition: null,
    audioEl: null,
    history: [], // { role: 'user'|'model', text: string, mode?: string, reason?: string, actionNote?: string, voiceEngine?: string }
    seenOrderIds: new Set(),
    alertedOverdueIds: new Set(),
    alertedMilestones: new Set(),
    watchTimer: null
  };

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function stopSpeaking() {
    if (state.audioEl) {
      try {
        state.audioEl.pause();
        state.audioEl.currentTime = 0;
      } catch (_) {}
      state.audioEl = null;
    }
    try { window.speechSynthesis?.cancel?.(); } catch (_) {}
  }

  function playNeuralAudio(base64, mime) {
    if (!state.voiceOut || !base64) return;
    stopSpeaking();
    try {
      const src = `data:${mime || 'audio/wav'};base64,${base64}`;
      const audio = new Audio(src);
      audio.playsInline = true;
      state.audioEl = audio;
      audio.play().catch(() => {});
    } catch (_) {}
  }

  async function executeSafeAction(action) {
    if (!action || !action.type || action.type === 'none') return '';
    const app = window.app;
    if (!app) return '';

    try {
      if (action.type === 'advance_turn' && Number(action.turn) > 0) {
        const t = Number(action.turn);
        const ord = (app.db?.orders || []).find(o => Number(o.turn) === t && o.status !== 'cancelled');
        if (!ord) return `Turno #${t} no encontrado`;
        if (ord.status === 'delivered') return `Turno #${t} ya fue entregado`;
        if (typeof app.updateOrderStatus === 'function') {
          await app.updateOrderStatus(ord.id, 'preparing');
          return `Turno #${t} pasado a Plancha`;
        }
      }

      if (action.type === 'deliver_turn' && Number(action.turn) > 0) {
        const t = Number(action.turn);
        const ord = (app.db?.orders || []).find(o => Number(o.turn) === t && o.status !== 'cancelled');
        if (!ord) return `Turno #${t} no encontrado`;
        if (typeof app.updateOrderStatus === 'function') {
          await app.updateOrderStatus(ord.id, 'delivered');
          return `Turno #${t} marcado Entregado`;
        }
      }

      if (action.type === 'batch_to_plancha') {
        if (typeof app.markNextBatchReady === 'function') {
          await app.markNextBatchReady();
          return 'Tanda pasada a Plancha';
        }
      }

      if (action.type === 'send_chat' && action.message) {
        const msgText = String(action.message).trim().slice(0, 220);
        if (msgText) {
          const sender = app.getOperatorName?.() || 'Copiloto';
          const res = await fetch('/api/event/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: msgText, sender: `${sender} (Voz)`, stage: 'Todos' })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.event_info && app.db) {
              app.db.event_info = data.event_info;
              app.renderTeamChat?.();
            }
            app.showToast?.(`Aviso enviado al chat: "${msgText}"`, 'info');
            return 'Aviso enviado al chat del equipo';
          }
        }
      }

      if (action.type === 'switch_view') {
        const validViews = ['order', 'kitchen', 'display', 'admin'];
        if (validViews.includes(action.view) && typeof app.switchView === 'function') {
          app.switchView(action.view);
        }
        const validStations = ['armado', 'plancha', 'delivered', 'all'];
        if (validStations.includes(action.station) && typeof app.setKdsStation === 'function') {
          app.setKdsStation(action.station);
        }
        return action.station
          ? `Vista cambiada a ${action.station}`
          : `Vista cambiada a ${action.view}`;
      }
    } catch (_) {
      return '';
    }
    return '';
  }

  async function checkStatus() {
    try {
      const res = await fetch('/api/copilot', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        state.configured = !!data.configured;
        state.mode = data.configured ? 'gemini' : 'local';
        if (data.model) state.model = data.model;
      }
    } catch (_) {
      state.mode = 'local';
    }
    updateStatusBadge();
  }

  function updateStatusBadge() {
    const pill = document.getElementById('cp-mode-pill');
    const hdrBtn = document.getElementById('btn-header-copilot');
    if (pill) {
      if (state.configured && state.mode === 'gemini') {
        pill.className = 'cp-mode-pill is-gemini';
        pill.textContent = 'Gemini AI · Voz Humana';
      } else {
        pill.className = 'cp-mode-pill is-local';
        pill.textContent = 'Modo Local · Comandos';
      }
    }
    if (hdrBtn) {
      hdrBtn.classList.toggle('is-active', state.open || state.earpieceAlerts);
      hdrBtn.classList.toggle('is-alerting', state.earpieceAlerts);
    }
  }

  function renderMessages() {
    const box = document.getElementById('cp-messages');
    if (!box) return;
    if (!state.history.length) {
      box.innerHTML = `
        <div class="cp-empty">
          <p>Dime qué hacer o pregúntame sobre el evento.</p>
          <small>Ejemplos: "Pasa el turno 7 a plancha", "Entrega el turno 4", "Avísale al mesero que ya casi no queda carne" o "¿Cómo vamos hoy?"</small>
        </div>
      `;
      return;
    }
    box.innerHTML = state.history.map(m => {
      const isUser = m.role === 'user';
      const metaParts = [];
      if (!isUser && m.mode) metaParts.push(m.mode === 'gemini' ? (m.voiceEngine ? 'Gemini AI · Voz humana' : 'Gemini AI') : 'Respaldo local');
      if (!isUser && m.reason) metaParts.push(m.reason);
      return `<div class="cp-msg ${isUser ? 'is-user' : 'is-bot'}">
        <div class="cp-msg-bubble">
          ${esc(m.text)}
          ${m.actionNote ? `<div class="cp-action-tag">✓ ${esc(m.actionNote)}</div>` : ''}
        </div>
        ${metaParts.length ? `<span class="cp-msg-meta">${esc(metaParts.join(' · '))}</span>` : ''}
      </div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  function setThinking(val) {
    state.thinking = !!val;
    const btn = document.getElementById('cp-mic-btn');
    const lbl = document.getElementById('cp-mic-label');
    if (btn) btn.classList.toggle('is-thinking', state.thinking);
    if (lbl && state.thinking) lbl.textContent = 'Procesando con Gemini…';
    else if (lbl && !state.listening) lbl.textContent = SpeechRec ? 'Tocar para hablar' : 'Escribe tu orden o pregunta abajo';
  }

  async function ask(question) {
    const q = String(question || '').trim();
    if (!q || state.thinking) return;
    stopSpeaking();

    state.history.push({ role: 'user', text: q });
    if (state.history.length > 16) state.history = state.history.slice(-16);
    renderMessages();
    setThinking(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          want_audio: state.voiceOut,
          history: state.history.slice(-6).map(h => ({ role: h.role, text: h.text }))
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const answer = (data.answer || '').trim() || 'No pude leer el estado del evento en este momento.';
      state.mode = data.mode === 'gemini' ? 'gemini' : 'local';
      if (data.configured !== undefined) state.configured = !!data.configured;
      updateStatusBadge();

      const actionNote = await executeSafeAction(data.action);

      state.history.push({
        role: 'model',
        text: answer,
        mode: state.mode,
        reason: data.fallback_reason || '',
        actionNote,
        voiceEngine: data.voice_engine || ''
      });
      renderMessages();

      // Solo reproducir voz neural humana real de Gemini (cero voz robótica del navegador)
      if (data.audio_base64) {
        playNeuralAudio(data.audio_base64, data.audio_mime);
      }
    } catch (_) {
      const fallback = buildOfflineAnswer();
      state.mode = 'local';
      updateStatusBadge();
      state.history.push({ role: 'model', text: fallback, mode: 'local' });
      renderMessages();
    } finally {
      setThinking(false);
    }
  }

  function buildOfflineAnswer() {
    const db = window.app?.db || {};
    const orders = (db.orders || []).filter(o => o.status !== 'cancelled');
    const pending = orders.filter(o => o.status === 'pending');
    const plancha = orders.filter(o => o.status === 'preparing' || o.status === 'ready');
    const delivered = orders.filter(o => o.status === 'delivered');
    const contracted = Number(db.event_info?.contracted_qty || 0);
    const owner = db.event_info?.owner_name || db.event_info?.name || 'el evento';
    return `Lectura local de ${owner}: ${delivered.length} entregados${contracted > 0 ? ` de ${contracted}` : ''}, ${pending.length} en Armado y ${plancha.length} en Plancha y Entrega.`;
  }

  function toggleListening() {
    stopSpeaking();
    if (!SpeechRec) {
      document.getElementById('cp-text-input')?.focus();
      window.app?.showToast?.('Tu navegador no permite dictado; escribe tu orden abajo.', 'info');
      return;
    }
    if (state.listening && state.recognition) {
      try { state.recognition.stop(); } catch (_) {}
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = 'es-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      state.recognition = rec;
      state.listening = true;
      updateMicUI();

      rec.onresult = (ev) => {
        const transcript = ev.results?.[0]?.[0]?.transcript || '';
        state.listening = false;
        updateMicUI();
        if (transcript.trim()) ask(transcript.trim());
      };
      rec.onerror = () => {
        state.listening = false;
        updateMicUI();
      };
      rec.onend = () => {
        state.listening = false;
        updateMicUI();
      };
      rec.start();
    } catch (_) {
      state.listening = false;
      updateMicUI();
    }
  }

  function updateMicUI() {
    const btn = document.getElementById('cp-mic-btn');
    const lbl = document.getElementById('cp-mic-label');
    if (btn) btn.classList.toggle('is-listening', state.listening);
    if (lbl) {
      lbl.textContent = state.listening
        ? 'Escuchando… toca para detener'
        : (SpeechRec ? 'Tocar para hablar' : 'Escribe tu orden abajo');
    }
  }

  function snapshotExistingOrdersForAlerts() {
    const orders = (window.app?.db?.orders || []).filter(o => o.status !== 'cancelled');
    orders.forEach(o => {
      state.seenOrderIds.add(String(o.id));
      const ageMin = getWaitMinutes(o);
      if (ageMin >= OVERDUE_ALERT_MINUTES) state.alertedOverdueIds.add(String(o.id));
    });
  }

  function getWaitMinutes(o) {
    const ts = Date.parse(o.created_at || '');
    if (!Number.isFinite(ts)) return 0;
    return Math.max(0, Math.floor((Date.now() - ts) / 60000));
  }

  function checkEarpieceAlerts() {
    if (!state.earpieceAlerts || state.thinking || state.listening) return;
    const db = window.app?.db;
    if (!db || !Array.isArray(db.orders)) return;
    const orders = db.orders.filter(o => o.status !== 'cancelled');
    const alerts = [];

    orders.forEach(o => {
      const id = String(o.id);
      const isNew = !state.seenOrderIds.has(id);
      if (isNew) {
        state.seenOrderIds.add(id);
        if (o.status !== 'delivered') {
          const isBirthday = /cumplea[nñ]/i.test(`${o.guest_name || ''} ${o.notes || ''}`);
          const items = (o.is_group && Array.isArray(o.items) && o.items.length) ? o.items : [o];
          const isKid = items.some(it => it.preset === 'ninos' && (it.prep_profile || 'nino') === 'nino');
          if (isBirthday) {
            alerts.push(`Aviso rápido: entró el turno ${o.turn} de ${o.guest_name || 'invitado'} y es cumpleañero.`);
          } else if (isKid) {
            alerts.push(`Entró el turno ${o.turn} de ${o.guest_name || 'invitado'}: es pedido de niño, solo pan y proteína.`);
          }
        }
      }

      if (o.status === 'pending' && !state.alertedOverdueIds.has(id)) {
        const mins = getWaitMinutes(o);
        if (mins >= OVERDUE_ALERT_MINUTES) {
          state.alertedOverdueIds.add(id);
          alerts.push(`Ojo: el turno ${o.turn} de ${o.guest_name || 'invitado'} ya lleva ${mins} minutos en Armado.`);
        }
      }
    });

    if (alerts.length) {
      window.app?.showToast?.(alerts[0], 'info');
      state.history.push({ role: 'model', text: alerts[0], mode: 'local' });
      if (state.open) renderMessages();
    }
  }

  function toggleEarpieceAlerts() {
    state.earpieceAlerts = !state.earpieceAlerts;
    const chk = document.getElementById('cp-alerts-toggle');
    if (chk) chk.setAttribute('aria-pressed', String(state.earpieceAlerts));
    if (chk) chk.classList.toggle('is-on', state.earpieceAlerts);
    if (state.earpieceAlerts) {
      snapshotExistingOrdersForAlerts();
      if (!state.watchTimer) state.watchTimer = setInterval(checkEarpieceAlerts, 15000);
      window.app?.showToast?.('Alertas inteligentes activadas (solo eventos críticos).', 'info');
    } else {
      stopSpeaking();
      if (state.watchTimer) { clearInterval(state.watchTimer); state.watchTimer = null; }
    }
    updateStatusBadge();
  }

  function toggleVoiceOut() {
    state.voiceOut = !state.voiceOut;
    if (!state.voiceOut) stopSpeaking();
    const btn = document.getElementById('cp-voice-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(state.voiceOut));
      btn.classList.toggle('is-on', state.voiceOut);
      btn.textContent = state.voiceOut ? 'Voz humana: ON' : 'Voz: Silencio';
    }
  }

  function ensureDrawer() {
    if (document.getElementById('copilot-drawer')) return;
    const el = document.createElement('aside');
    el.id = 'copilot-drawer';
    el.className = 'cp-drawer';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Copiloto de Cocina');
    el.innerHTML = `
      <header class="cp-head">
        <div>
          <span class="cp-eyebrow">Copiloto Operativo</span>
          <div class="cp-title-row">
            <h2>Asistente Gemini</h2>
            <span id="cp-mode-pill" class="cp-mode-pill is-local">Modo Local</span>
          </div>
        </div>
        <button type="button" class="cp-close-btn" onclick="window.ShawarmaCopilot.close()" aria-label="Cerrar Copiloto">✕</button>
      </header>

      <div class="cp-controls-bar">
        <button type="button" id="cp-alerts-toggle" class="cp-toggle-chip" aria-pressed="false" onclick="window.ShawarmaCopilot.toggleEarpieceAlerts()">
          <span class="cp-dot"></span>
          <span>Alertas</span>
        </button>
        <button type="button" id="cp-voice-toggle" class="cp-toggle-chip is-on" aria-pressed="true" onclick="window.ShawarmaCopilot.toggleVoiceOut()">
          Voz humana: ON
        </button>
        <button type="button" class="cp-toggle-chip" onclick="window.ShawarmaCopilot.stopSpeaking()">
          Callar
        </button>
      </div>

      <div class="cp-quick-grid">
        <button type="button" class="cp-quick-btn" onclick="window.ShawarmaCopilot.ask('¿Cómo vamos ahorita con el evento y qué es lo más urgente?')">¿Cómo vamos?</button>
        <button type="button" class="cp-quick-btn" onclick="window.ShawarmaCopilot.ask('¿Cuál es el pedido más atrasado y dónde está el cuello?')">Más atrasado</button>
        <button type="button" class="cp-quick-btn" onclick="window.ShawarmaCopilot.ask('Pasa la siguiente tanda a plancha')">Pasar tanda →</button>
        <button type="button" class="cp-quick-btn" onclick="window.ShawarmaCopilot.ask('¿Cuántos shawarmas de cada proteína faltan en armado y plancha?')">Proteínas</button>
      </div>

      <div id="cp-messages" class="cp-messages" aria-live="polite"></div>

      <div class="cp-footer">
        <button type="button" id="cp-mic-btn" class="cp-mic-btn" onclick="window.ShawarmaCopilot.toggleListening()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          <span id="cp-mic-label">${SpeechRec ? 'Tocar para hablar' : 'Escribe tu orden abajo'}</span>
        </button>
        <form class="cp-text-form" onsubmit="event.preventDefault(); window.ShawarmaCopilot.submitInput();">
          <input type="text" id="cp-text-input" class="cp-text-input" placeholder="Ej: Pasa el turno 7 a plancha o avisa al mesero…" autocomplete="off">
          <button type="submit" class="cp-send-btn">Enviar</button>
        </form>
      </div>
    `;
    document.body.appendChild(el);
    renderMessages();
    updateStatusBadge();
  }

  function submitInput() {
    const inp = document.getElementById('cp-text-input');
    if (!inp) return;
    const val = inp.value.trim();
    if (!val) return;
    inp.value = '';
    ask(val);
  }

  function open() {
    ensureDrawer();
    state.open = true;
    document.getElementById('copilot-drawer')?.classList.add('is-open');
    checkStatus();
    renderMessages();
    updateStatusBadge();
  }

  function close() {
    state.open = false;
    document.getElementById('copilot-drawer')?.classList.remove('is-open');
    updateStatusBadge();
  }

  function toggle() {
    if (state.open) close();
    else open();
  }

  window.ShawarmaCopilot = {
    open,
    close,
    toggle,
    ask,
    submitInput,
    toggleListening,
    toggleEarpieceAlerts,
    toggleVoiceOut,
    stopSpeaking,
    checkStatus
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkStatus);
  } else {
    checkStatus();
  }
})();
