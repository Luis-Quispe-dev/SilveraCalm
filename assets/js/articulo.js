/* =========================================================
   SilveraCalm — Vista dedicada de artículo estilo Blogger (articulo.js)
   - Conecta directamente con el feed público JSONP de Blogger.
   - Usa caché local para carga inmediata y refresca en vivo.
   - Limpia HTML heredado de Blogger y arma archivo por Año/Mes.
   ========================================================= */
(function () {
  'use strict';

  var CFG = window.SILVERA_CONFIG || {};
  var BLOG_URL = (CFG.BLOG_URL || 'https://silveracalm.blogspot.com').replace(/\/$/, '');
  var CACHE_KEY = 'silvera_blog_cache_v1';
  var FEED_BATCH = 150;

  var RESPALDO = [
    {
      id: 'r0',
      title: 'El “estoy bien” automático: el peso invisible de ser la hija fuerte',
      url: BLOG_URL + '/2026/11/el-estoy-bien-automatico-el-peso.html',
      published: '2026-11-04T12:00:00-05:00',
      labels: ['Bienestar del cuidador'],
      external: true
    },
    {
      id: 'r1',
      title: 'De héroe a supervisado: la herida invisible de un padre que se niega a sentirse frágil',
      url: BLOG_URL + '/2026/11/de-heroe-supervisado-la-herida.html',
      published: '2026-11-04T12:00:00-05:00',
      labels: ['Autonomía'],
      external: true
    },
    {
      id: 'r2',
      title: '«Ya no la llamo para controlarla»: el día que entendí que mi mamá no me mentía',
      url: BLOG_URL + '/2026/11/ya-no-la-llamo-para-controlarla-el-dia.html',
      published: '2026-11-04T12:00:00-05:00',
      labels: ['Vínculo familiar'],
      external: true
    }
  ];

  /* ---------- Elementos ---------- */
  var $loading = document.getElementById('articuloLoading');
  var $error = document.getElementById('articuloError');
  var $paper = document.getElementById('articuloPaper');
  var $title = document.getElementById('articuloTitle');
  var $date = document.getElementById('articuloDate');
  var $readTime = document.getElementById('articuloReadTime');
  var $author = document.getElementById('articuloAuthor');
  var $cover = document.getElementById('articuloCover');
  var $coverImg = document.getElementById('articuloCoverImg');
  var $body = document.getElementById('articuloBody');
  var $tagsRow = document.getElementById('articuloTagsRow');
  var $tags = document.getElementById('articuloTags');
  var $crumbLabel = document.getElementById('articuloCrumbLabel');
  var $originLink = document.getElementById('articuloOriginLink');
  var $commentsNote = document.getElementById('articuloCommentsNote');
  var $commentsLink = document.getElementById('articuloCommentsLink');
  var $pagerPrev = document.getElementById('pagerPrev');
  var $pagerPrevTitle = document.getElementById('pagerPrevTitle');
  var $pagerNext = document.getElementById('pagerNext');
  var $pagerNextTitle = document.getElementById('pagerNextTitle');
  var $copyBtn = document.getElementById('articuloCopyLink');
  var $copyLabel = document.getElementById('articuloCopyLabel');
  var $retryBtn = document.getElementById('articuloRetryBtn');
  var $externalFallback = document.getElementById('articuloExternalFallback');
  var $status = document.getElementById('articuloStatus');
  var $statusText = document.getElementById('articuloStatusText');
  var $progress = document.getElementById('articuloProgress');

  var $recentSection = document.getElementById('sidebarRecentSection');
  var $recentList = document.getElementById('sidebarRecentList');
  var $archiveSection = document.getElementById('sidebarArchiveSection');
  var $archive = document.getElementById('sidebarArchive');
  var $labelsSection = document.getElementById('sidebarLabelsSection');
  var $labelsList = document.getElementById('sidebarLabels');
  var $sidebarBloggerLink = document.getElementById('sidebarBloggerLink');

  if (!$paper) return;
  if ($sidebarBloggerLink) $sidebarBloggerLink.href = BLOG_URL + '/';
  if ($externalFallback) $externalFallback.href = BLOG_URL + '/';

  var state = {
    posts: [],
    currentId: getRequestedId()
  };

  /* ---------- Utilidades ---------- */
  function getRequestedId() {
    try {
      var params = new URLSearchParams(window.location.search);
      var id = params.get('id');
      if (id) return id.trim();
    } catch (e) { /* URLSearchParams fallback */ }
    var hashMatch = /^#articulo-(.+)$/.exec(window.location.hash || '');
    return hashMatch ? decodeURIComponent(hashMatch[1]) : '';
  }

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

  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  }

  function formatMonthName(date) {
    try {
      var name = date.toLocaleDateString('es-PE', { month: 'long' });
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch (e) {
      return '';
    }
  }

  function bigImage(url) {
    return String(url || '')
      .replace(/\/s\d+(-c)?\//, '/w1200/')
      .replace(/=s\d+(-c)?$/, '=w1200');
  }

  function imageSignature(url) {
    var clean = String(url || '').split('?')[0].split('#')[0];
    var parts = clean.split('/');
    return parts[parts.length - 1] || clean;
  }

  function setStatus(kind, text) {
    if (!$status || !$statusText) return;
    $status.classList.remove('is-live', 'is-offline');
    if (kind) $status.classList.add(kind);
    $statusText.textContent = text;
  }

  /* ---------- Caché ---------- */
  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(posts) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), posts: posts }));
    } catch (e) { /* storage bloqueado o lleno */ }
  }

  /* ---------- JSONP Blogger ---------- */
  var cbCounter = 0;
  function jsonp(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var name = '__silveraArticleFeed' + (++cbCounter) + '_' + Date.now();
      var script = document.createElement('script');
      var done = false;
      var timer = setTimeout(function () { finish(new Error('timeout')); }, timeoutMs || 12000);

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
    if (e.media$thumbnail && e.media$thumbnail.url) {
      img = bigImage(e.media$thumbnail.url);
    } else {
      var m = /<img[^>]+src=["']([^"']+)["']/i.exec(html || '');
      if (m) img = bigImage(m[1]);
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

  function fetchAllPosts() {
    var all = [];
    function page(start) {
      var url = BLOG_URL + '/feeds/posts/default?alt=json-in-script&max-results=' + FEED_BATCH + '&start-index=' + start;
      return jsonp(url, 12000).then(function (data) {
        var feed = (data && data.feed) || {};
        var entries = feed.entry || [];
        entries.forEach(function (e) {
          var p = parseEntry(e);
          if (p) all.push(p);
        });
        var total = feed.openSearch$totalResults ? parseInt(feed.openSearch$totalResults.$t, 10) : all.length;
        if (entries.length === FEED_BATCH && all.length < total) return page(start + FEED_BATCH);
        return all;
      });
    }
    return page(1);
  }

  function fetchSinglePost(id) {
    if (!/^\d+$/.test(id)) return Promise.resolve(null);
    var url = BLOG_URL + '/feeds/posts/default/' + encodeURIComponent(id) + '?alt=json-in-script';
    return jsonp(url, 10000).then(function (data) {
      return data && data.entry ? parseEntry(data.entry) : null;
    }).catch(function () {
      return null;
    });
  }

  /* ---------- Saneamiento profundo del HTML heredado de Blogger ---------- */
  var purifyHooked = false;
  function ensurePurifyHook() {
    if (purifyHooked || !window.DOMPurify) return;
    purifyHooked = true;
    window.DOMPurify.addHook('afterSanitizeAttributes', function (node) {
      if (node.tagName === 'A' && node.getAttribute('href')) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
      if (node.tagName === 'IMG') {
        node.setAttribute('loading', 'lazy');
        node.setAttribute('referrerpolicy', 'no-referrer');
        node.removeAttribute('width');
        node.removeAttribute('height');
        var src = node.getAttribute('src');
        if (src && /blogspot\.com|bp\.blogspot\.com|blogger\.googleusercontent\.com/i.test(src)) {
          node.setAttribute('src', bigImage(src));
        }
      }
      if (node.tagName === 'IFRAME') {
        var iframeSrc = node.getAttribute('src') || '';
        if (!/^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|www\.blogger\.com)\//.test(iframeSrc)) {
          node.remove();
        }
      }
    });
  }

  function cleanBloggerHtml(rawHtml, coverUrl) {
    if (!window.DOMPurify) {
      return { html: '<p>' + esc(htmlToText(rawHtml)) + '</p>', hasLeadingCover: false };
    }
    ensurePurifyHook();

    var clean = window.DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target', 'referrerpolicy'],
      FORBID_TAGS: ['style', 'script', 'form', 'input', 'font'],
      FORBID_ATTR: ['style', 'bgcolor', 'color', 'face', 'size', 'align', 'border', 'cellpadding', 'cellspacing', 'width', 'height']
    });

    var wrap = document.createElement('div');
    wrap.innerHTML = clean;

    // Convertir tablas tr-caption-container clásicas de Blogger en <figure>
    wrap.querySelectorAll('table.tr-caption-container').forEach(function (tbl) {
      var img = tbl.querySelector('img');
      if (!img) return;
      var captionEl = tbl.querySelector('.tr-caption');
      var fig = document.createElement('figure');
      fig.appendChild(img.cloneNode(true));
      if (captionEl && captionEl.textContent.trim()) {
        var fc = document.createElement('figcaption');
        fc.textContent = captionEl.textContent.trim();
        fig.appendChild(fc);
      }
      tbl.replaceWith(fig);
    });

    // Envolver tablas de contenido en contenedor desplazable
    wrap.querySelectorAll('table').forEach(function (tbl) {
      if (tbl.closest('.articulo-table-wrap')) return;
      var box = document.createElement('div');
      box.className = 'articulo-table-wrap';
      tbl.parentNode.insertBefore(box, tbl);
      box.appendChild(tbl);
    });

    // Envolver videos iframe en contenedor responsivo 16:9
    wrap.querySelectorAll('iframe').forEach(function (frame) {
      if (frame.closest('.articulo-video-embed')) return;
      var box = document.createElement('div');
      box.className = 'articulo-video-embed';
      frame.parentNode.insertBefore(box, frame);
      box.appendChild(frame);
    });

    // Desenvolver enlaces de Blogger que solo envuelven una imagen hacia sí misma
    wrap.querySelectorAll('a > img').forEach(function (img) {
      var a = img.parentElement;
      if (a && a.children.length === 1 && !a.textContent.trim()) {
        var href = a.getAttribute('href') || '';
        if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(href) || /blogger\.googleusercontent\.com|bp\.blogspot\.com/i.test(href)) {
          a.replaceWith(img);
        }
      }
    });

    // Limpiar bloques vacíos heredados del editor de Blogger
    wrap.querySelectorAll('p, div, span').forEach(function (el) {
      if (el.querySelector('img, iframe, video, figure, table, ul, ol')) return;
      var txt = el.textContent.replace(/\u00a0/g, '').trim();
      if (!txt) el.remove();
    });

    // Detectar si la primera imagen del cuerpo es la misma que la portada
    var hasLeadingCover = false;
    if (coverUrl) {
      var firstImg = wrap.querySelector('img');
      if (firstImg) {
        var firstSig = imageSignature(firstImg.getAttribute('src'));
        var coverSig = imageSignature(coverUrl);
        if (firstSig && coverSig && firstSig === coverSig) {
          hasLeadingCover = true;
        }
      }
    }

    return { html: wrap.innerHTML, hasLeadingCover: hasLeadingCover };
  }

  /* ---------- Renderizado de artículo y riel estilo Blogger ---------- */
  function postHref(id) {
    return 'articulo.html?id=' + encodeURIComponent(id);
  }

  function renderSidebar(posts, activePost) {
    // 1. Entradas recientes
    if ($recentSection && $recentList && posts.length) {
      $recentSection.hidden = false;
      $recentList.innerHTML = posts.slice(0, 5).map(function (p) {
        var isCurrent = activePost && p.id === activePost.id;
        return '' +
          '<li>' +
            '<a href="' + postHref(p.id) + '" class="sidebar-recent-link' + (isCurrent ? ' is-current' : '') + '"' + (isCurrent ? ' aria-current="page"' : '') + '>' +
              '<span class="sidebar-recent-title">' + esc(p.title) + '</span>' +
              (p.published ? '<span class="sidebar-recent-date">' + esc(formatDate(p.published)) + '</span>' : '') +
            '</a>' +
          '</li>';
      }).join('');
    }

    // 2. Archivo del blog (Año > Mes)
    if ($archiveSection && $archive && posts.length) {
      var groups = {};
      posts.forEach(function (p) {
        if (!p.published) return;
        var d = new Date(p.published);
        if (isNaN(d.getTime())) return;
        var y = String(d.getFullYear());
        var mIdx = d.getMonth();
        var mKey = (mIdx < 10 ? '0' : '') + mIdx;
        if (!groups[y]) groups[y] = { year: y, total: 0, months: {} };
        if (!groups[y].months[mKey]) {
          groups[y].months[mKey] = { key: mKey, name: formatMonthName(d), posts: [] };
        }
        groups[y].months[mKey].posts.push(p);
        groups[y].total += 1;
      });

      var years = Object.keys(groups).sort(function (a, b) { return Number(b) - Number(a); });
      if (years.length) {
        $archiveSection.hidden = false;
        var activeDate = activePost && activePost.published ? new Date(activePost.published) : null;
        var activeYear = activeDate && !isNaN(activeDate.getTime()) ? String(activeDate.getFullYear()) : years[0];
        var activeMonth = activeDate && !isNaN(activeDate.getTime())
          ? ((activeDate.getMonth() < 10 ? '0' : '') + activeDate.getMonth())
          : '';

        $archive.innerHTML = years.map(function (y) {
          var g = groups[y];
          var monthKeys = Object.keys(g.months).sort(function (a, b) { return Number(b) - Number(a); });
          var openYear = y === activeYear;
          var monthsHtml = monthKeys.map(function (mk) {
            var m = g.months[mk];
            var openMonth = openYear && (mk === activeMonth || (!activeMonth && mk === monthKeys[0]));
            var itemsHtml = m.posts.map(function (p) {
              var isCurr = activePost && p.id === activePost.id;
              return '<a href="' + postHref(p.id) + '"' + (isCurr ? ' class="is-current" aria-current="page"' : '') + '>' + esc(p.title) + '</a>';
            }).join('');
            return '' +
              '<details class="archive-month"' + (openMonth ? ' open' : '') + '>' +
                '<summary><span>' + esc(m.name) + '</span><span class="archive-count">' + m.posts.length + '</span></summary>' +
                '<div class="archive-posts">' + itemsHtml + '</div>' +
              '</details>';
          }).join('');

          return '' +
            '<details class="archive-year"' + (openYear ? ' open' : '') + '>' +
              '<summary><span>' + esc(y) + '</span><span class="archive-count">' + g.total + '</span></summary>' +
              '<div class="archive-months">' + monthsHtml + '</div>' +
            '</details>';
        }).join('');
      }
    }

    // 3. Etiquetas
    if ($labelsSection && $labelsList) {
      var counts = {};
      posts.forEach(function (p) {
        (p.labels || []).forEach(function (l) {
          counts[l] = (counts[l] || 0) + 1;
        });
      });
      var labelNames = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
      if (labelNames.length) {
        $labelsSection.hidden = false;
        $labelsList.innerHTML = labelNames.map(function (l) {
          return '' +
            '<li>' +
              '<a href="blog.html?etiqueta=' + encodeURIComponent(l) + '" class="sidebar-label-link">' +
                '<span>' + esc(l) + '</span>' +
                '<span class="sidebar-label-count">' + counts[l] + '</span>' +
              '</a>' +
            '</li>';
        }).join('');
      }
    }
  }

  function renderArticle(post, allPosts) {
    if (!post || !post.html) {
      showError(post ? post.url : '');
      return;
    }

    $loading.hidden = true;
    $error.hidden = true;
    $paper.hidden = false;

    // Título y metadatos del documento
    document.title = post.title + ' | Blog SilveraCalm';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && post.excerpt) metaDesc.setAttribute('content', post.excerpt);

    // Subnav migas de pan
    if ($crumbLabel) {
      if (post.labels && post.labels.length) {
        $crumbLabel.textContent = post.labels[0];
        $crumbLabel.href = 'blog.html?etiqueta=' + encodeURIComponent(post.labels[0]);
      } else {
        $crumbLabel.textContent = 'Todas las entradas';
        $crumbLabel.href = 'blog.html';
      }
    }

    // Cabecera
    $title.textContent = post.title;
    if ($date) {
      $date.textContent = post.published ? formatDate(post.published) : '';
      $date.setAttribute('datetime', post.published || '');
    }
    if ($readTime) {
      $readTime.textContent = (post.minutes || 1) + ' min de lectura';
    }
    if ($author) {
      $author.textContent = post.author || 'Equipo SilveraCalm';
    }
    if ($originLink) {
      $originLink.href = post.url || (BLOG_URL + '/');
    }

    // Limpiar y renderizar cuerpo íntegro de Blogger
    var cleaned = cleanBloggerHtml(post.html, post.img);
    if (post.img && !cleaned.hasLeadingCover) {
      $coverImg.src = post.img;
      $coverImg.alt = post.title;
      $cover.hidden = false;
    } else {
      $cover.hidden = true;
      $coverImg.removeAttribute('src');
    }

    $body.innerHTML = cleaned.html;

    // Etiquetas
    if ($tagsRow && $tags) {
      if (post.labels && post.labels.length) {
        $tagsRow.hidden = false;
        $tags.innerHTML = post.labels.map(function (l) {
          return '<a href="blog.html?etiqueta=' + encodeURIComponent(l) + '" class="articulo-tag-link">' + esc(l) + '</a>';
        }).join('');
      } else {
        $tagsRow.hidden = true;
        $tags.innerHTML = '';
      }
    }

    // Comentarios estilo Blogger
    if ($commentsLink && $commentsNote) {
      var baseUrl = post.url || (BLOG_URL + '/');
      $commentsLink.href = baseUrl + (baseUrl.indexOf('#') === -1 ? '#comments' : '');
      if (typeof post.comments === 'number' && !isNaN(post.comments)) {
        $commentsNote.textContent = post.comments === 0
          ? 'Sé la primera persona en dejar un comentario en la entrada original de Blogger.'
          : (post.comments === 1
            ? 'Esta entrada tiene 1 comentario publicado en Blogger.'
            : 'Esta entrada tiene ' + post.comments + ' comentarios publicados en Blogger.');
      }
    }

    // Navegación Anterior / Siguiente (feed viene ordenado del más reciente al más antiguo)
    var idx = -1;
    for (var i = 0; i < allPosts.length; i++) {
      if (allPosts[i].id === post.id) { idx = i; break; }
    }
    var newerPost = idx > 0 ? allPosts[idx - 1] : null;
    var olderPost = idx > -1 && idx < allPosts.length - 1 ? allPosts[idx + 1] : null;

    if ($pagerPrev && $pagerPrevTitle) {
      if (newerPost) {
        $pagerPrev.hidden = false;
        $pagerPrev.href = postHref(newerPost.id);
        $pagerPrevTitle.textContent = newerPost.title;
      } else {
        $pagerPrev.hidden = true;
      }
    }

    if ($pagerNext && $pagerNextTitle) {
      if (olderPost) {
        $pagerNext.hidden = false;
        $pagerNext.href = postHref(olderPost.id);
        $pagerNextTitle.textContent = olderPost.title;
      } else {
        $pagerNext.hidden = true;
      }
    }

    renderSidebar(allPosts, post);
    updateReadingProgress();
  }

  function showError(fallbackPostUrl) {
    $loading.hidden = true;
    $paper.hidden = true;
    $error.hidden = false;
    if ($externalFallback) $externalFallback.href = fallbackPostUrl || (BLOG_URL + '/');
    setStatus('is-offline', 'No pudimos conectar con Blogger');
  }

  /* ---------- Barra de progreso de lectura ---------- */
  function updateReadingProgress() {
    if (!$progress || $paper.hidden) return;
    var rect = $paper.getBoundingClientRect();
    var total = Math.max(1, $paper.offsetHeight - window.innerHeight * 0.65);
    var passed = Math.max(0, -rect.top + 110);
    var pct = Math.min(100, Math.max(0, (passed / total) * 100));
    $progress.style.width = pct.toFixed(1) + '%';
  }

  var scrollScheduled = false;
  window.addEventListener('scroll', function () {
    if (scrollScheduled) return;
    scrollScheduled = true;
    window.requestAnimationFrame(function () {
      scrollScheduled = false;
      updateReadingProgress();
    });
  }, { passive: true });
  window.addEventListener('resize', updateReadingProgress, { passive: true });

  /* ---------- Copiar enlace ---------- */
  if ($copyBtn && $copyLabel) {
    $copyBtn.addEventListener('click', function () {
      var urlToCopy = window.location.href;
      function done() {
        $copyBtn.classList.add('is-copied');
        $copyLabel.textContent = 'Enlace copiado';
        setTimeout(function () {
          $copyBtn.classList.remove('is-copied');
          $copyLabel.textContent = 'Copiar enlace';
        }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(urlToCopy).then(done).catch(done);
      } else {
        done();
      }
    });
  }

  if ($retryBtn) {
    $retryBtn.addEventListener('click', function () {
      $error.hidden = true;
      $loading.hidden = false;
      loadFromBlogger();
    });
  }

  /* ---------- Flujo principal de carga ---------- */
  function findPost(posts, id) {
    if (!posts || !posts.length) return null;
    if (!id) return posts[0];
    for (var i = 0; i < posts.length; i++) {
      if (posts[i].id === id || posts[i].url === id) return posts[i];
    }
    return null;
  }

  function loadFromBlogger() {
    setStatus('', 'Sincronizando con Blogger…');
    fetchAllPosts().then(function (posts) {
      if (!posts.length) {
        if (!state.posts.length) showError('');
        return;
      }
      state.posts = posts;
      writeCache(posts);

      var target = findPost(posts, state.currentId);
      if (target) {
        if (!state.currentId && window.history && window.history.replaceState) {
          state.currentId = target.id;
          window.history.replaceState(null, '', postHref(target.id));
        }
        renderArticle(target, posts);
        setStatus('is-live', 'Conectado en vivo con Blogger');
        return;
      }

      // Si el ID no apareció en el primer lote, consultamos la entrada directa en Blogger
      if (state.currentId) {
        fetchSinglePost(state.currentId).then(function (single) {
          if (single) {
            renderArticle(single, posts);
            setStatus('is-live', 'Conectado en vivo con Blogger');
          } else {
            renderSidebar(posts, null);
            showError('');
          }
        });
      } else {
        showError('');
      }
    }).catch(function () {
      if (state.posts.length) {
        setStatus('is-offline', 'Sin conexión · mostrando copia guardada');
        return;
      }
      renderSidebar(RESPALDO, null);
      var respaldoMatch = findPost(RESPALDO, state.currentId);
      showError(respaldoMatch ? respaldoMatch.url : '');
    });
  }

  // Pintado instantáneo desde caché si ya existe
  var cached = readCache();
  if (cached && cached.posts && cached.posts.length) {
    state.posts = cached.posts;
    var cachedTarget = findPost(cached.posts, state.currentId);
    if (cachedTarget && cachedTarget.html) {
      renderArticle(cachedTarget, cached.posts);
    } else {
      renderSidebar(cached.posts, null);
    }
  }

  loadFromBlogger();
})();
