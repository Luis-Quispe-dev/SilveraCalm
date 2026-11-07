/* =========================================================
   SilveraCalm — Chat con Silvio (widget flotante)
   Se dibuja solo: no necesitas agregar HTML a la página.
   Habla con /api/chat (el Worker de Cloudflare).
   ========================================================= */
(function () {
  'use strict';

  var CFG = window.SILVERA_CONFIG || {};
  var ENDPOINT = CFG.CHAT_ENDPOINT || '/api/chat';
  var LOGO = 'assets/img/logo-silveracalm.png';
  var STORE_KEY = 'silvera_chat_v1';
  var MAX_SAVED = 30;

  var SUGERENCIAS = [
    '¿Cómo funciona SilveraCalm?',
    '¿Usan cámaras?',
    'Mi papá se molesta cuando lo llamo',
    '¿Qué es el test?'
  ];
  var SALUDO = '¡Hola! Soy Silvio 🦉, el asistente de SilveraCalm. Puedo contarte cómo acompañar los tratamientos de tu papá o mamá sin llamadas que generen tensión. ¿En qué te ayudo?';

  /* ---------- Estado ---------- */
  var history = load();   // [{role:'user'|'assistant', content}]
  var busy = false;

  function load() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
  }
  function save() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-MAX_SAVED))); } catch (e) {}
  }

  /* ---------- Construcción del widget ---------- */
  var root = document.createElement('div');
  root.className = 'sc-chat';
  root.innerHTML =
    '<button type="button" class="sc-chat-launcher" aria-expanded="false" aria-controls="scChatPanel" aria-label="Abrir chat con Silvio">' +
      '<img src="' + LOGO + '" alt="" width="34" height="50">' +
      '<span class="sc-chat-launcher-text">¿Hablamos?</span>' +
    '</button>' +
    '<section class="sc-chat-panel" id="scChatPanel" role="dialog" aria-label="Chat con Silvio" hidden>' +
      '<header class="sc-chat-head">' +
        '<span class="sc-chat-avatar"><img src="' + LOGO + '" alt="" width="26" height="38"></span>' +
        '<span class="sc-chat-id"><strong>Silvio</strong><small><span class="sc-dot" aria-hidden="true"></span>Asistente de SilveraCalm</small></span>' +
        '<button type="button" class="sc-chat-icon" data-sc-reset aria-label="Nueva conversación" title="Nueva conversación">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>' +
        '</button>' +
        '<button type="button" class="sc-chat-icon" data-sc-close aria-label="Cerrar chat">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 18 18 6M6 6l12 12"/></svg>' +
        '</button>' +
      '</header>' +
      '<div class="sc-chat-log" aria-live="polite"></div>' +
      '<div class="sc-chat-suggest"></div>' +
      '<form class="sc-chat-form">' +
        '<label class="sr-only" for="scChatInput">Escribe tu mensaje</label>' +
        '<textarea id="scChatInput" rows="1" maxlength="600" placeholder="Escribe tu pregunta…"></textarea>' +
        '<button type="submit" class="sc-chat-send" aria-label="Enviar">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        '</button>' +
      '</form>' +
      '<p class="sc-chat-note">Silvio es una IA y puede equivocarse. No reemplaza a un médico.</p>' +
    '</section>';
  document.body.appendChild(root);

  var launcher = root.querySelector('.sc-chat-launcher');
  var panel = root.querySelector('.sc-chat-panel');
  var log = root.querySelector('.sc-chat-log');
  var suggest = root.querySelector('.sc-chat-suggest');
  var form = root.querySelector('.sc-chat-form');
  var input = root.querySelector('#scChatInput');

  /* ---------- Formato seguro de mensajes ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function format(text) {
    var hasTest = /\[\[TEST\]\]/.test(text);
    var t = esc(text.replace(/\[\[TEST\]\]/g, '').trim());
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(https:\/\/[^\s<]+[^\s<.,;:!?)])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    var lines = t.split(/\n+/);
    var html = '', inList = false;
    lines.forEach(function (l) {
      var m = /^\s*(?:[-•*]|\d+[.)])\s+(.*)$/.exec(l);
      if (m) { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + m[1] + '</li>'; }
      else { if (inList) { html += '</ul>'; inList = false; } if (l.trim()) html += '<p>' + l + '</p>'; }
    });
    if (inList) html += '</ul>';
    if (hasTest) html += '<a href="#" class="sc-chat-cta" data-sc-test>Hacer el test gratuito →</a>';
    return html;
  }

  function bubble(role, text) {
    var row = document.createElement('div');
    row.className = 'sc-msg sc-msg-' + (role === 'user' ? 'user' : 'bot');
    if (role === 'user') row.innerHTML = '<div class="sc-bubble"><p>' + esc(text) + '</p></div>';
    else row.innerHTML = '<img class="sc-msg-avatar" src="' + LOGO + '" alt=""><div class="sc-bubble">' + format(text) + '</div>';
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }

  function typing(on) {
    var t = log.querySelector('.sc-typing');
    if (on && !t) {
      t = document.createElement('div');
      t.className = 'sc-msg sc-msg-bot sc-typing';
      t.innerHTML = '<img class="sc-msg-avatar" src="' + LOGO + '" alt=""><div class="sc-bubble" aria-label="Silvio está escribiendo"><span></span><span></span><span></span></div>';
      log.appendChild(t);
      log.scrollTop = log.scrollHeight;
    } else if (!on && t) t.remove();
  }

  function renderSuggestions() {
    var show = history.filter(function (m) { return m.role === 'user'; }).length === 0;
    suggest.hidden = !show;
    suggest.innerHTML = show ? SUGERENCIAS.map(function (s) {
      return '<button type="button" class="sc-chip" data-sc-q="' + esc(s) + '">' + esc(s) + '</button>';
    }).join('') : '';
  }

  function renderAll() {
    log.innerHTML = '';
    bubble('assistant', SALUDO);
    history.forEach(function (m) { bubble(m.role, m.content); });
    renderSuggestions();
  }

  /* ---------- Envío ---------- */
  function send(text) {
    text = String(text || '').trim();
    if (!text || busy) return;
    busy = true;
    form.classList.add('is-busy');
    history.push({ role: 'user', content: text });
    save();
    bubble('user', text);
    renderSuggestions();
    input.value = '';
    autosize();
    typing(true);

    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-8) }),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (data) {
        var reply = (data && data.reply) || 'No pude responder en este momento. ¿Lo intentamos de nuevo?';
        typing(false);
        bubble('assistant', reply);
        if (data && data.reply) { history.push({ role: 'assistant', content: reply }); save(); }
      })
      .catch(function () {
        typing(false);
        bubble('assistant', 'Parece que no tengo conexión ahora mismo 🌿. Revisa tu internet e inténtalo otra vez.');
      })
      .then(function () {
        clearTimeout(timer);
        busy = false;
        form.classList.remove('is-busy');
        input.focus();
      });
  }

  /* ---------- Abrir / cerrar ---------- */
  function open() {
    panel.hidden = false;
    root.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    if (!log.children.length) renderAll();
    setTimeout(function () { input.focus(); }, 50);
  }
  function close() {
    panel.hidden = true;
    root.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  function goToTest() {
    if (CFG.TEST_URL) {
      if (CFG.TEST_NEW_TAB) window.open(CFG.TEST_URL, '_blank', 'noopener');
      else location.href = CFG.TEST_URL;
    } else if (window.SilveraModal) {
      window.SilveraModal.open('testModal');
    }
  }

  /* ---------- Eventos ---------- */
  launcher.addEventListener('click', function () { panel.hidden ? open() : close(); });
  root.addEventListener('click', function (e) {
    if (e.target.closest('[data-sc-close]')) close();
    else if (e.target.closest('[data-sc-reset]')) { history = []; save(); renderAll(); input.focus(); }
    else if (e.target.closest('[data-sc-q]')) send(e.target.closest('[data-sc-q]').getAttribute('data-sc-q'));
    else if (e.target.closest('[data-sc-test]')) { e.preventDefault(); goToTest(); }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
  });
  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 110) + 'px'; }
  input.addEventListener('input', autosize);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden && !document.querySelector('.modal:not([hidden])')) close();
  });

  // Cualquier enlace con data-open-chat abre el chat (ej. un botón en la página)
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open-chat]');
    if (t) { e.preventDefault(); open(); }
  });
})();
