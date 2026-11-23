/* ============================================================================
   SHAWARMA EN CASA · COPILOTO DE VOZ (GEMINI AI + RESPALDO LOCAL)
   Módulo 100% aislado: solo lectura del evento en vivo, cero riesgo al POS/KDS.
   ============================================================================ */
(() => {
  'use strict';

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const OVERDUE_ALERT_MINUTES = 12;

  const state = {
    open: false,
    mode: 'local', // 'gemini' | 'local'
    configured: false,
    model: 'gemini-2.5-flash',
    voiceOut: true,
    earpieceAlerts: false,
    listening: false,
    thinking: false,
    recognition: null,
    history: [], // { role: 'user'|'model', text: string, mode?: string }
    seenOrderIds: new Set(),
    alertedOverdueIds: new Set(),
    alertedMilestones: new Set(),
    watchTimer: null,
    preferredVoice: null
  };

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function pickBestSpanishVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    const esVoices = voices.filter(v => /^es/i.test(v.lang || ''));
    if (!esVoices.length) return null;
    const preferredNames = ['paulina', 'mónica', 'monica', 'siri', 'luciana', 'diego', 'jorge', 'elena', 'google español'];
    for (const target of preferredNames) {
      const found = esVoices.find(v => (v.name || '').toLowerCase().includes(target));
      if (found) return found;
    }
    return esVoices.find(v => /es-(us|mx|419)/i.test(v.lang)) || esVoices[0];
  }

  function speak(text) {
    if (!state.voiceOut || !text || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(String(text));
      utter.lang = 'es-US';
      utter.rate = 1.04;
      utter.pitch = 1.0;
      if (!state.preferredVoice) state.preferredVoice = pickBestSpanishVoice();
      if (state.preferredVoice) utter.voice = state.preferredVoice;
      window.speechSynthesis.speak(utter);
    } catch (_) {}
  }

  function stopSpeaking() {
    try { window.speechSynthesis?.cancel?.(); } catch (_) {}
  }

  function primeAudioForIOS() {
    // Unlocks iOS Safari speechSynthesis on first user tap
    if (!('speechSynthesis' in window)) return;
    try {
      state.preferredVoice = pickBestSpanishVoice();
      const silent = new SpeechSynthesisUtterance('');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    } catch (_) {}
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
        pill.textContent = 'Gemini AI · En vivo';
      } else {
        pill.className = 'cp-mode-pill is-local';
        pill.textContent = 'Modo Local · Respaldo';
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
          <p>Pregúntame por voz o toca un resumen rápido para escucharlo por tus audífonos.</p>
          <small>${state.configured ? 'Conectado a Gemini AI con datos reales de este evento.' : 'Respaldo local activo. Agrega GEMINI_API_KEY en Render para activar respuestas abiertas con Gemini.'}</small>
        </div>
      `;
      return;
    }
    box.innerHTML = state.history.map(m => {
      const isUser = m.role === 'user';
      return `<div class="cp-msg ${isUser ? 'is-user' : 'is-bot'}">
        <div class="cp-msg-bubble">${esc(m.text)}</div>
        ${!isUser && m.mode ? `<span class="cp-msg-meta">${m.mode === 'gemini' ? 'Gemini AI' : 'Respaldo local'}${m.reason ? ' · ' + esc(m.reason) : ''}</span>` : ''}
      </div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  function setThinking(val) {
    state.thinking = !!val;
    const btn = document.getElementById('cp-mic-btn');
    const lbl = document.getElementById('cp-mic-label');
    if (btn) btn.classList.toggle('is-thinking', state.thinking);
    if (lbl && state.thinking) lbl.textContent = 'Consultando evento...';
    else if (lbl && !state.listening) lbl.textContent = SpeechRec ? 'Tocar para hablar' : 'Voz no soportada · escribe abajo';
  }

  async function ask(question) {
    const q = String(question || '').trim();
    if (!q || state.thinking) return;
    primeAudioForIOS();
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
          history: state.history.slice(-6).map(h => ({ role: h.role, text: h.text }))
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const answer = (data.answer || '').trim() || 'No pude leer el estado del evento en este momento.';
      state.mode = data.mode === 'gemini' ? 'gemini' : 'local';
      if (data.configured !== undefined) state.configured = !!data.configured;
      updateStatusBadge();

      state.history.push({ role: 'model', text: answer, mode: state.mode, reason: data.fallback_reason || '' });
      renderMessages();
      speak(answer);
    } catch (_) {
      const fallback = buildOfflineAnswer(q);
      state.mode = 'local';
      updateStatusBadge();
      state.history.push({ role: 'model', text: fallback, mode: 'local' });
      renderMessages();
      speak(fallback);
    } finally {
      setThinking(false);
    }
  }

  function buildOfflineAnswer(q) {
    const db = window.app?.db || {};
    const orders = (db.orders || []).filter(o => o.status !== 'cancelled');
    const pending = orders.filter(o => o.status === 'pending');
    const plancha = orders.filter(o => o.status === 'preparing' || o.status === 'ready');
    const delivered = orders.filter(o => o.status === 'delivered');
    const contracted = Number(db.event_info?.contracted_qty || 0);
    const owner = db.event_info?.owner_name || db.event_info?.name || 'el evento';
    return `Sin conexión al servidor, lectura local de ${owner}: ${delivered.length} entregados${contracted > 0 ? ` de ${contracted}` : ''}, ${pending.length} en Armado y ${plancha.length} en Plancha y Entrega.`;
  }

  function toggleListening() {
    primeAudioForIOS();
    stopSpeaking();
    if (!SpeechRec) {
      const inp = document.getElementById('cp-text-input');
      inp?.focus();
      window.app?.showToast?.('Tu navegador no permite dictado; escribe tu pregunta abajo.', 'info');
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
        : (SpeechRec ? 'Tocar para hablar' : 'Escribe tu pregunta abajo');
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
            alerts.push(`Atención: turno ${o.turn}, ${o.guest_name || 'invitado'}, es cumpleañero.`);
          } else if (isKid) {
            alerts.push(`Turno ${o.turn}, ${o.guest_name || 'invitado'}, es pedido de niño, solo pan y proteína.`);
          }
        }
      }

      if (o.status === 'pending' && !state.alertedOverdueIds.has(id)) {
        const mins = getWaitMinutes(o);
        if (mins >= OVERDUE_ALERT_MINUTES) {
          state.alertedOverdueIds.add(id);
          alerts.push(`Aviso: el turno ${o.turn} de ${o.guest_name || 'invitado'} lleva ${mins} minutos en Armado.`);
        }
      }
    });

    const contracted = Number(db.event_info?.contracted_qty || 0);
    if (contracted > 0) {
      const totalUnits = orders.reduce((sum, o) => {
        if (o.is_group && Array.isArray(o.items) && o.items.length) {
          return sum + o.items.reduce((s, it) => s + Math.max(1, Number(it.quantity) || 1), 0);
        }
        return sum + Math.max(1, Number(o.quantity) || 1);
      }, 0);
      const remaining = contracted - totalUnits;
      const evtKey = String(db.event_info?.id || 'evt');
      if (remaining === 5 && !state.alertedMilestones.has(evtKey + ':5')) {
        state.alertedMilestones.add(evtKey + ':5');
        alerts.push(`Faltan solo 5 shawarmas para completar los ${contracted} contratados.`);
      } else if (remaining <= 0 && !state.alertedMilestones.has(evtKey + ':0')) {
        state.alertedMilestones.add(evtKey + ':0');
        alerts.push(`Meta alcanzada: ya entraron los ${contracted} shawarmas contratados del evento.`);
      }
    }

    if (alerts.length) {
      const msg = alerts[0]; // Speak at most 1 concise alert at a time (zero spam)
      state.history.push({ role: 'model', text: msg, mode: 'local' });
      if (state.open) renderMessages();
      speak(msg);
    }
  }

  function toggleEarpieceAlerts() {
    primeAudioForIOS();
    state.earpieceAlerts = !state.earpieceAlerts;
    const chk = document.getElementById('cp-alerts-toggle');
    if (chk) chk.setAttribute('aria-pressed', String(state.earpieceAlerts));
    if (chk) chk.classList.toggle('is-on', state.earpieceAlerts);
    if (state.earpieceAlerts) {
      snapshotExistingOrdersForAlerts();
      if (!state.watchTimer) state.watchTimer = setInterval(checkEarpieceAlerts, 15000);
      speak('Alertas al oído activadas. Solo te avisaré lo importante.');
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
      btn.textContent = state.voiceOut ? 'Voz: Activa' : 'Voz: Silencio';
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
          <span class="cp-eyebrow">Copiloto de Servicio</span>
          <div class="cp-title-row">
            <h2>Guía por Voz</h2>
            <span id="cp-mode-pill" class="cp-mode-pill is-local">Modo Local</span>
          </div>
        </div>
        <button type="button" class="cp-close-btn" onclick="window.ShawarmaCopilot.close()" aria-label="Cerrar Copiloto">✕</button>
      </header>

      <div class="cp-controls-bar">
        <button type="button" id="cp-alerts-toggle" class="cp-toggle-chip" aria-pressed="false" onclick="window.ShawarmaCopilot.toggleEarpieceAlerts()">
          <span class="cp-dot"></span>
          <span>Alertas al oído</span>
        </button>
        <button type="button" id="cp-voice-toggle" class="cp-toggle-chip is-on" aria-pressed="true" onclick="window.ShawarmaCopilot.toggleVoiceOut()">
          Voz: Activa
        </button>
        <button type="button" class="cp-toggle-chip" onclick="window.ShawarmaCopilot.stopSpeaking()">
          Callar
        </button>
      </div>

      <div class="cp-quick-grid">
        <button type="button" class="cp-quick-btn" onclick="window.ShawarmaCopilot.ask('Dame un resumen rápido de cómo va el evento ahora mismo.')">Resumen del evento</button>
        <button type="button" class="cp-quick-btn" onclick="window.ShawarmaCopilot.ask('¿Qué pedidos están atrasados o dónde está el cuello de botella?')">Atrasos y cuello</button>
        <button type="button" class="cp-quick-btn" onclick="window.ShawarmaCopilot.ask('¿Cuántos shawarmas de cada proteína faltan en armado y en plancha?')">Proteínas pendientes</button>
        <button type="button" class="cp-quick-btn" onclick="window.ShawarmaCopilot.ask('¿Cómo vamos en costos, ingreso y ganancia neta del evento?')">Balance financiero</button>
      </div>

      <div id="cp-messages" class="cp-messages" aria-live="polite"></div>

      <div class="cp-footer">
        <button type="button" id="cp-mic-btn" class="cp-mic-btn" onclick="window.ShawarmaCopilot.toggleListening()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          <span id="cp-mic-label">${SpeechRec ? 'Tocar para hablar' : 'Escribe tu pregunta abajo'}</span>
        </button>
        <form class="cp-text-form" onsubmit="event.preventDefault(); window.ShawarmaCopilot.submitInput();">
          <input type="text" id="cp-text-input" class="cp-text-input" placeholder="O escribe una pregunta sobre el evento…" autocomplete="off">
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
    primeAudioForIOS();
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

  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      state.preferredVoice = pickBestSpanishVoice();
    };
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
