/* =========================================================
   SilveraCalm — Interacciones generales
   Menú móvil, botones del test y modales.
   ========================================================= */
(function () {
  'use strict';
  var CFG = window.SILVERA_CONFIG || {};

  /* ---------- Menú móvil ---------- */
  var toggle = document.getElementById('menuToggle');
  var menu = document.getElementById('mobileMenu');

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.hidden = !open;
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (menu) {
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
  }

  /* ---------- Modales (reutilizable) ---------- */
  var lastFocus = null;

  function openModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.hidden = false;
    document.body.classList.add('modal-open');
    var btn = m.querySelector('.modal-close');
    if (btn) btn.focus();
  }

  function closeModal(m) {
    if (!m || m.hidden) return;
    m.hidden = true;
    if (!document.querySelector('.modal:not([hidden])')) document.body.classList.remove('modal-open');
    m.dispatchEvent(new CustomEvent('modal:closed'));
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var closer = e.target.closest('[data-close]');
    if (closer) {
      closeModal(closer.closest('.modal'));
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var open = document.querySelectorAll('.modal:not([hidden])');
      if (open.length) closeModal(open[open.length - 1]);
      setMenu(false);
    }
  });

  // Exponer para blog.js
  window.SilveraModal = { open: openModal, close: closeModal };

  /* ---------- Botones del test ---------- */
  document.querySelectorAll('[data-test-cta]').forEach(function (el) {
    if (CFG.TEST_URL) {
      el.setAttribute('href', CFG.TEST_URL);
      if (CFG.TEST_NEW_TAB) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      }
    } else {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openModal('testModal');
      });
    }
  });

  /* ---------- Año del footer ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
