/* =========================================================
   SilveraCalm — Blog en vivo (Blogger)
   - Lee TODOS los artículos publicados en tu Blogger.
   - Se actualiza solo cada X minutos y al volver a la pestaña.
   - Filtros por etiqueta, buscador y "Cargar más".
   - Lector integrado: el artículo completo se abre aquí mismo.
   No necesitas tocar este archivo: la configuración está en config.js
   ========================================================= */
(function () {
  'use strict';

  var CFG = window.SILVERA_CONFIG || {};
  var BLOG_URL = (CFG.BLOG_URL || 'https://silveracalm.blogspot.com').replace(/\/$/, '');
  var PAGE_SIZE = CFG.BLOG_PAGE_SIZE || 6;
  var REFRESH_MS = (CFG.BLOG_REFRESH_MINUTES || 3) * 60 * 1000;
  var NEW_DAYS = CFG.BLOG_NEW_DAYS || 7;
  var CACHE_KEY = 'silvera_blog_cache_v1';
  var FEED_BATCH = 150; // máximo que Blogger entrega por petición

  // Artículos de respaldo (solo si Blogger no responde y no hay caché)
  var RESPALDO = [
    { t: 'El “estoy bien” automático: el peso invisible de ser la hija fuerte', u: '/2026/11/el-estoy-bien-automatico-el-peso.html', d: '2026-11-04' },
    { t: 'De héroe a supervisado: la herida invisible de un padre que se niega a sentirse frágil', u: '/2026/11/de-heroe-supervisado-la-herida.html', d: '2026-11-04' },
    { t: '«Ya no la llamo para controlarla»: el día que entendí que mi mamá no me mentía', u: '/2026/11/ya-no-la-llamo-para-controlarla-el-dia.html', d: '2026-11-04' }
  ];

  /* ---------- Estado ---------- */
  var state = {
    posts: [],          // todos los artículos
    label: 'Todos',     // filtro activo
    query: '',          // texto del buscador
    visible: PAGE_SIZE, // cuántos se muestran en la grilla
    lastSync: null,
    loading: false
  };

  /* ---------- Elementos ---------- */
  var $grid = document.getElementById('blogGrid');
  var $featured = document.getElementById('blogFeatured');
  var $labels = document.getElementById('blogLabels');
  var $search = document.getElementById('blogSearch');
  var $more = document.getElementById('blogMore');
  var $empty = document.getElementById('blogEmpty');
  var $status = document.getElementById('blogStatus');
  var $statusText = document.getElementById('blogStatusText');
  var $reader = document.getElementById('readerBody');
  var $external = document.getElementById('blogExternal');
  if (!$grid) return;
  if ($external) $external.href = BLOG_URL + '/';

  /* ---------- Utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function htmlToText(html) {
    var limpio = String(html || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|h\d|li)>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    var t = document.createElement('textarea');
    t.innerHTML = limpio;
    return t.value.replace(/\s+/g, ' ').trim();
  }
  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function formatDate(iso) {
    try { return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return ''; }
  }
  function timeAgo(date) {
    var s = Math.round((Date.now() - date.getTime()) / 1000);
    if (s < 45) return 'hace unos segundos';
    var m = Math.round(s / 60);
    if (m < 60) return 'hace ' + m + (m === 1 ? ' minuto' : ' minutos');
    var h = Math.round(m / 60);
    return 'hace ' + h + (h === 1 ? ' hora' : ' horas');
  }
  function isNew(iso) {
    return (Date.now() - new Date(iso).getTime()) < NEW_DAYS * 864e5;
  }
  function bigImage(url) {
    return String(url || '')
      .replace(/\/s\d+(-c)?\//, '/w1200-h675-c/')
      .replace(/=s\d+(-c)?$/, '=w1200-h675-c');
  }

  /* ---------- Caché local (carga instantánea al volver) ---------- */
  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeCache(posts) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), posts: posts })); }
    catch (e) { /* almacenamiento lleno o bloqueado: no pasa nada */ }
  }

  /* ---------- Lectura del feed de Blogger (JSONP) ---------- */
  var cbCounter = 0;
  function jsonp(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var name = '__silveraFeed' + (++cbCounter) + '_' + Date.now();
      var script = document.createElement('script');
      var done = false;
      var timer = setTimeout(function () { finish(new Error('timeout')); }, timeoutMs || 10000);

      function finish(err, data) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { delete window[name]; } catch (e) { window[name] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
        err ? reject(err) : resolve(data);
      }
      window[name] = function (data) { finish(null, data); };
      script.onerror = function () { finish(new Error('network')); };
      // "_=" evita que el navegador use una copia vieja del feed
      script.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'callback=' + name + '&_=' + Date.now();
      document.body.appendChild(script);
    });
  }

  function parseEntry(e) {
    var link = (e.link || []).filter(function (l) { return l.rel === 'alternate'; })[0];
    if (!link) return null;
    var html = e.content ? e.content.$t : (e.summary ? e.summary.$t : '');
    var text = htmlToText(html);
    var idMatch = /post-(\d+)/.exec((e.id && e.id.$t) || '');
    var img = '';
    if (e.media$thumbnail && e.media$thumbnail.url) img = bigImage(e.media$thumbnail.url);
    else {
      var m = /<img[^>]+src=["']([^"']+)["']/i.exec(html || '');
      if (m) img = m[1];
    }
    var title = (e.title && e.title.$t ? e.title.$t : '').trim();
    var words = text ? text.split(' ').length : 0;
    return {
      id: idMatch ? idMatch[1] : link.href,
      url: link.href,
      title: title || (text.slice(0, 70) + (text.length > 70 ? '…' : '')) || 'Artículo SilveraCalm',
      excerpt: text.slice(0, 160) + (text.length > 160 ? '…' : ''),
      html: html,
      published: e.published ? e.published.$t : '',
      updated: e.updated ? e.updated.$t : '',
      labels: (e.category || []).map(function (c) { return c.term; }),
      img: img,
      minutes: Math.max(1, Math.round(words / 200)),
      author: e.author && e.author[0] && e.author[0].name ? e.author[0].name.$t : '',
      comments: e.thr$total ? parseInt(e.thr$total.$t, 10) : null
    };
  }

  // Descarga TODAS las páginas del feed (Blogger da hasta 150 por vez)
  function fetchAllPosts() {
    var all = [];
    function page(start) {
      var url = BLOG_URL + '/feeds/posts/default?alt=json-in-script&max-results=' + FEED_BATCH + '&start-index=' + start;
      return jsonp(url, 12000).then(function (data) {
        var feed = (data && data.feed) || {};
        var entries = feed.entry || [];
        entries.forEach(function (e) { var p = parseEntry(e); if (p) all.push(p); });
        var total = feed.openSearch$totalResults ? parseInt(feed.openSearch$totalResults.$t, 10) : all.length;
        if (entries.length === FEED_BATCH && all.length < total) return page(start + FEED_BATCH);
        return all;
      });
    }
    return page(1);
  }

  /* ---------- Render ---------- */
  function filtered() {
    var q = normalize(state.query.trim());
    return state.posts.filter(function (p) {
      var okLabel = state.label === 'Todos' || p.labels.indexOf(state.label) > -1;
      if (!okLabel) return false;
      if (!q) return true;
      return normalize(p.title + ' ' + p.excerpt + ' ' + p.labels.join(' ')).indexOf(q) > -1 ||
             normalize(htmlToText(p.html)).indexOf(q) > -1;
    });
  }

  function cardHTML(p, featured) {
    var media = p.img
      ? '<img src="' + esc(p.img) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">'
      : '<img class="placeholder-logo" src="assets/img/logo-silveracalm.png" alt="">';
    var meta = [];
    if (p.published && isNew(p.published)) meta.push('<span class="post-new">Nuevo</span>');
    if (p.published) meta.push('<span>' + esc(formatDate(p.published)) + '</span>');
    meta.push('<span>' + p.minutes + ' min de lectura</span>');
    if (p.labels[0]) meta.push('<span class="post-tag">' + esc(p.labels[0]) + '</span>');

    return '' +
      '<button type="button" class="post-card" data-post="' + esc(p.id) + '" aria-label="Leer: ' + esc(p.title) + '">' +
        '<div class="post-media">' + media + '</div>' +
        '<div class="post-body">' +
          '<div class="post-meta">' + meta.join('') + '</div>' +
          '<h3 class="post-title">' + esc(p.title) + '</h3>' +
          (p.excerpt ? '<p class="post-excerpt">' + esc(featured ? p.excerpt : p.excerpt.slice(0, 120) + (p.excerpt.length > 120 ? '…' : '')) + '</p>' : '') +
          '<span class="post-read">Leer artículo →</span>' +
        '</div>' +
      '</button>';
  }

  function renderLabels() {
    if (!$labels) return;
    var counts = {};
    state.posts.forEach(function (p) { p.labels.forEach(function (l) { counts[l] = (counts[l] || 0) + 1; }); });
    var labels = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    if (!labels.length) { $labels.innerHTML = ''; $labels.hidden = true; return; }
    if (state.label !== 'Todos' && !counts[state.label]) state.label = 'Todos';
    $labels.hidden = false;
    $labels.innerHTML = ['Todos'].concat(labels).map(function (l) {
      var n = l === 'Todos' ? state.posts.length : counts[l];
      return '<button type="button" class="chip" data-label="' + esc(l) + '" aria-pressed="' + (state.label === l) + '">' + esc(l) + ' · ' + n + '</button>';
    }).join('');
  }

  function render() {
    var list = filtered();
    var showFeatured = !state.query && list.length > 1;
    var featured = showFeatured ? list[0] : null;
    var rest = showFeatured ? list.slice(1) : list;

    $featured.innerHTML = featured ? '<div class="post-featured">' + cardHTML(featured, true) + '</div>' : '';
    $grid.innerHTML = rest.slice(0, state.visible).map(function (p) { return cardHTML(p, false); }).join('');
    $empty.hidden = list.length > 0;
    $more.hidden = rest.length <= state.visible;
    if (!$more.hidden) $more.textContent = 'Cargar más artículos (' + (rest.length - state.visible) + ')';
  }

  function setStatus(kind, text) {
    if (!$status) return;
    $status.classList.remove('is-live', 'is-offline');
    if (kind) $status.classList.add(kind);
    $statusText.textContent = text;
  }
  function liveText() {
    var n = state.posts.length;
    return 'En vivo · ' + n + (n === 1 ? ' artículo' : ' artículos') +
      (state.lastSync ? ' · actualizado ' + timeAgo(state.lastSync) : '');
  }

  /* ---------- Sincronización ---------- */
  function sync(isFirst) {
    if (state.loading) return;
    state.loading = true;
    var beforeIds = state.posts.map(function (p) { return p.id; });

    fetchAllPosts().then(function (posts) {
      state.loading = false;
      if (!posts.length) { if (isFirst && !state.posts.length) useFallback(); return; }

      var newOnes = posts.filter(function (p) { return beforeIds.indexOf(p.id) === -1; });
      var changed = JSON.stringify(posts.map(function (p) { return p.id + p.updated; })) !==
                    JSON.stringify(state.posts.map(function (p) { return p.id + p.updated; }));

      state.posts = posts;
      state.lastSync = new Date();
      writeCache(posts);

      if (changed) { renderLabels(); render(); }
      if (!isFirst && beforeIds.length && newOnes.length) {
        setStatus('is-live', newOnes.length === 1 ? '¡Nuevo artículo publicado!' : '¡' + newOnes.length + ' artículos nuevos!');
        setTimeout(function () { setStatus('is-live', liveText()); }, 6000);
      } else {
        setStatus('is-live', liveText());
      }
      openFromHash();
    }).catch(function () {
      state.loading = false;
      if (!state.posts.length) useFallback();
      else setStatus('is-offline', 'Sin conexión con el blog · mostrando la última versión guardada');
    });
  }

  function useFallback() {
    state.posts = RESPALDO.map(function (r, i) {
      return { id: 'r' + i, url: BLOG_URL + r.u, title: r.t, excerpt: '', html: '', published: r.d + 'T12:00:00', updated: '', labels: [], img: '', minutes: 4, external: true };
    });
    renderLabels(); render();
    setStatus('is-offline', 'No pudimos conectar con el blog · reintentando…');
  }

  /* ---------- Lector de artículos ---------- */
  function sanitize(html) {
    if (window.DOMPurify) {
      return window.DOMPurify.sanitize(html, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target'],
        FORBID_TAGS: ['style', 'form', 'input']
      });
    }
    // Sin DOMPurify: solo texto, por seguridad
    return '<p>' + esc(htmlToText(html)) + '</p>';
  }

  if (window.DOMPurify) {
    window.DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      if (node.tagName === 'A' && node.getAttribute('href')) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener');
      }
      if (node.tagName === 'IMG') node.setAttribute('loading', 'lazy');
      if (node.tagName === 'IFRAME') {
        var src = node.getAttribute('src') || '';
        // Solo videos de YouTube / Blogger
        if (!/^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|www\.blogger\.com)\//.test(src)) node.remove();
      }
    });
  }

  function openPost(id, pushHash) {
    var p = state.posts.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    if (p.external || !p.html) { window.open(p.url, '_blank', 'noopener'); return; }

    var labels = p.labels.map(function (l) { return '<span class="post-tag">' + esc(l) + '</span>'; }).join('');
    $reader.innerHTML = '' +
      '<header class="reader-head">' +
        '<div class="post-meta">' + (p.published ? '<span>' + esc(formatDate(p.published)) + '</span>' : '') +
          '<span>' + p.minutes + ' min de lectura</span>' + labels + '</div>' +
        '<h1 id="readerTitle">' + esc(p.title) + '</h1>' +
      '</header>' +
      '<div class="reader-content">' + sanitize(p.html) + '</div>' +
      '<footer class="reader-foot">' +
        '<div class="silvera-tip">' +
          '<img src="assets/img/logo-silveracalm.png" alt="" class="silvera-avatar">' +
          '<div><p class="silvera-title">Consejo de Silvera</p>' +
          '<p class="silvera-text">¿Te viste reflejada en esta historia? Descubre en 2 minutos cómo está la tranquilidad en tu hogar.</p></div>' +
        '</div>' +
        '<a href="#" class="btn btn-primary" data-test-cta-reader>Hacer el test gratuito →</a>' +
        '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" class="btn btn-outline">Comentar en el blog ↗</a>' +
      '</footer>';

    // Botón del test dentro del lector
    var cta = $reader.querySelector('[data-test-cta-reader]');
    var CFGT = window.SILVERA_CONFIG || {};
    if (cta) {
      if (CFGT.TEST_URL) { cta.href = CFGT.TEST_URL; if (CFGT.TEST_NEW_TAB) { cta.target = '_blank'; cta.rel = 'noopener'; } }
      else cta.addEventListener('click', function (e) { e.preventDefault(); window.SilveraModal.open('testModal'); });
    }

    state.openId = p.id;
    $reader.scrollTop = 0;
    window.SilveraModal.open('readerModal');
    if (pushHash !== false && location.hash !== '#articulo-' + p.id) {
      history.pushState(null, '', '#articulo-' + p.id);
    }
    document.title = p.title + ' | SilveraCalm';
  }

  function openFromHash() {
    var m = /^#articulo-(.+)$/.exec(location.hash);
    var modal = document.getElementById('readerModal');
    if (m) {
      var id = decodeURIComponent(m[1]);
      if (modal && !modal.hidden && state.openId === id) return; // ya está abierto: no interrumpir la lectura
      openPost(id, false);
    }
    else if (modal && !modal.hidden) window.SilveraModal.close(modal);
  }

  var readerModal = document.getElementById('readerModal');
  if (readerModal) {
    readerModal.addEventListener('modal:closed', function () {
      state.openId = null;
      document.title = 'SilveraCalm | Test de Tranquilidad Familiar';
      if (/^#articulo-/.test(location.hash)) history.pushState(null, '', '#blog');
    });
  }
  window.addEventListener('popstate', openFromHash);

  /* ---------- Eventos ---------- */
  document.addEventListener('click', function (e) {
    var card = e.target.closest('[data-post]');
    if (card) { openPost(card.getAttribute('data-post')); return; }
    var chip = e.target.closest('[data-label]');
    if (chip) {
      state.label = chip.getAttribute('data-label');
      state.visible = PAGE_SIZE;
      renderLabels(); render();
    }
  });

  if ($more) $more.addEventListener('click', function () { state.visible += PAGE_SIZE; render(); });

  var searchTimer;
  if ($search) $search.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      state.query = $search.value;
      state.visible = PAGE_SIZE;
      render();
    }, 200);
  });

  // Actualización "en tiempo real"
  setInterval(function () { if (!document.hidden) sync(false); }, REFRESH_MS);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && state.lastSync && Date.now() - state.lastSync.getTime() > 30000) sync(false);
  });
  setInterval(function () { if (state.lastSync && $status.classList.contains('is-live')) setStatus('is-live', liveText()); }, 30000);

  /* ---------- Arranque ---------- */
  var cached = readCache();
  if (cached && cached.posts && cached.posts.length) {
    state.posts = cached.posts;
    renderLabels(); render();
    setStatus('', 'Buscando artículos nuevos…');
  }
  sync(true);
})();
