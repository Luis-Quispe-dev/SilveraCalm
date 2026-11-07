/* =========================================================
   SilveraCalm — Interacciones generales + Animaciones Premium
   Menú móvil, modales, botones del test y orquestación
   de scroll-reveals a 60 fps con IntersectionObserver.
   ========================================================= */

(function () {
  'use strict';

  var CFG = window.SILVERA_CONFIG || {};

  /* ---------- Menú móvil accesible ---------- */
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

  /* ---------- Modales reutilizables ---------- */
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
    if (!document.querySelector('.modal:not([hidden])')) {
      document.body.classList.remove('modal-open');
    }
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
      var openModals = document.querySelectorAll('.modal:not([hidden])');
      if (openModals.length) closeModal(openModals[openModals.length - 1]);
      setMenu(false);
    }
  });

  // Exponer API modal para blog.js
  window.SilveraModal = { open: openModal, close: closeModal };

  /* ---------- Botones del test con soporte de fallback ---------- */
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

  /* ---------- Año dinámico del pie de página ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ==========================================================
     SISTEMA DE ANIMACIONES Y EXPERIENCIA INTERACTIVA
     ========================================================== */

  /* ---------- Header con sombra y compactación dinámica ---------- */
  (function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var ticking = false;
    function checkScroll() {
      var top = window.pageYOffset || document.documentElement.scrollTop;
      if (top > 40) {
        header.classList.add('is-compact');
      } else {
        header.classList.remove('is-compact');
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(checkScroll);
        ticking = true;
      }
    }, { passive: true });

    checkScroll();
  })();

  /* ---------- Scroll Reveals con IntersectionObserver ---------- */
  (function initScrollReveals() {
    var revealElements = document.querySelectorAll('[data-reveal]');
    if (!revealElements.length) return;

    // Fallback si el navegador no tiene soporte de IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  })();

  /* ---------- Stepper animado: barra de avance y pasos ---------- */
  (function initStepper() {
    var stepper = document.getElementById('stepper');
    if (!stepper) return;

    var stepElements = stepper.querySelectorAll('.step');
    if (!stepElements.length) return;

    if (!('IntersectionObserver' in window)) {
      stepper.classList.add('is-animated');
      stepElements.forEach(function (step) { step.classList.add('is-active'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          stepper.classList.add('is-animated');

          // Activación rítmica y escalonada de cada indicador numérico
          stepElements.forEach(function (step, index) {
            setTimeout(function () {
              step.classList.add('is-active');
            }, 250 + (index * 350));
          });

          observer.unobserve(stepper);
        }
      });
    }, {
      threshold: 0.25
    });

    observer.observe(stepper);
  })();

  /* ---------- Animación de la comparativa de tranquilidad ---------- */
  (function initCompare() {
    var compare = document.getElementById('compare');
    if (!compare) return;

    if (!('IntersectionObserver' in window)) {
      compare.classList.add('is-visible');
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          compare.classList.add('is-visible');
          observer.unobserve(compare);
        }
      });
    }, {
      threshold: 0.2
    });

    observer.observe(compare);
  })();

})();
