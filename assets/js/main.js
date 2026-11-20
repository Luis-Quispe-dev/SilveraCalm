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

  /* ---------- Botones de descarga de app (Próximamente) ---------- */
  document.querySelectorAll('[data-download-cta]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openModal('downloadModal');
    });
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

  /* ==========================================================
     SISTEMA INTERACTIVO WEBINAR (CONTADOR + REGISTRO + CALENDAR)
     ========================================================== */

  /* ---------- 1. Contador Regresivo en Tiempo Real ---------- */
  (function initWebinarCountdown() {
    var daysEl = document.getElementById('countdownDays');
    var hoursEl = document.getElementById('countdownHours');
    var minutesEl = document.getElementById('countdownMinutes');
    var secondsEl = document.getElementById('countdownSeconds');
    var countdownBox = document.getElementById('webinarCountdown');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    // Fecha objetivo: Sábado 28 de Noviembre de 2026, 7:00:00 PM (Hora de Lima / UTC-5)
    var targetDate = new Date('2026-11-28T19:00:00-05:00').getTime();

    function updateCountdown() {
      var now = new Date().getTime();
      var difference = targetDate - now;

      if (difference <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        if (countdownBox) {
          var label = countdownBox.querySelector('.countdown-heading span');
          if (label) label.textContent = '¡El evento está en transmisión en vivo!';
        }
        return;
      }

      var d = Math.floor(difference / (1000 * 60 * 60 * 24));
      var h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      var s = Math.floor((difference % (1000 * 60)) / 1000);

      daysEl.textContent = d < 10 ? '0' + d : String(d);
      hoursEl.textContent = h < 10 ? '0' + h : String(h);
      minutesEl.textContent = m < 10 ? '0' + m : String(m);
      secondsEl.textContent = s < 10 ? '0' + s : String(s);
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  })();

  /* ---------- 2. Formulario de Registro y Feedback Reactivo ---------- */
  (function initWebinarRegistration() {
    var form = document.getElementById('webinarRegistrationForm');
    var formContainer = document.getElementById('webinarFormContainer');
    var formState = document.getElementById('webinarFormState');
    var successState = document.getElementById('webinarSuccessState');
    var successUserName = document.getElementById('successUserName');
    var successUserContact = document.getElementById('successUserContact');
    var calendarLink = document.getElementById('webinarCalendarLink');
    var resetBtn = document.getElementById('webinarResetBtn');
    var ribbonCtaBtn = document.getElementById('webinarRibbonCtaBtn');

    if (!form || !formState || !successState) return;

    var nameInput = document.getElementById('webinarNombre');
    var emailInput = document.getElementById('webinarEmail');
    var phoneInput = document.getElementById('webinarCelular');

    var nameError = document.getElementById('nameError');
    var emailError = document.getElementById('emailError');
    var phoneError = document.getElementById('phoneError');

    var STORAGE_KEY = 'silveracalm_webinar_reg';

    function setFieldError(input, errorEl, message) {
      if (message) {
        input.classList.add('is-invalid');
        errorEl.textContent = message;
      } else {
        input.classList.remove('is-invalid');
        errorEl.textContent = '';
      }
    }

    function clearErrors() {
      setFieldError(nameInput, nameError, '');
      setFieldError(emailInput, emailError, '');
      setFieldError(phoneInput, phoneError, '');
    }

    function generateCalendarUrl(name) {
      var title = encodeURIComponent('Webinar SilveraCalm: Cuidado y Adherencia Médica en Adultos Mayores');
      var details = encodeURIComponent('Hola ' + (name || 'familiar') + '! Tu acceso al webinar interactivo de SilveraCalm está listo. Aprenderemos estrategias para organizar las medicinas de tus padres con serenidad y sin invadir su intimidad.\n\nEnlace de transmisión: Se enviará 1 hora antes por WhatsApp y correo.');
      var location = encodeURIComponent('Online vía Zoom / Google Meet');
      // 28 Nov 2026, 7:00 a 7:45 PM Lima (00:00 a 00:45 UTC del 29 Nov)
      var dates = '20261129T000000Z/20261129T004500Z';
      return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + title + '&dates=' + dates + '&details=' + details + '&location=' + location;
    }

    function showSuccess(data, animate) {
      formState.hidden = true;
      successState.hidden = false;

      var firstName = data.nombre.trim().split(' ')[0] || data.nombre;
      if (successUserName) successUserName.textContent = firstName;
      if (successUserContact) {
        var cleanPhone = data.celular ? '+51 ' + data.celular : '';
        successUserContact.textContent = data.email + (cleanPhone ? ' y ' + cleanPhone : '');
      }

      if (calendarLink) {
        calendarLink.setAttribute('href', generateCalendarUrl(firstName));
      }

      if (animate && formContainer) {
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function showForm() {
      successState.hidden = true;
      formState.hidden = false;
      clearErrors();
      if (nameInput) nameInput.focus();
    }

    // Auto-formateo del número de celular (solo dígitos y máximo 9)
    if (phoneInput) {
      phoneInput.addEventListener('input', function (e) {
        var val = this.value.replace(/\D/g, '');
        if (val.length > 9) val = val.slice(0, 9);
        this.value = val;
      });
    }

    // Comprobación de registro previo en localStorage
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && parsed.nombre) {
          showSuccess(parsed, false);
        }
      }
    } catch (e) {
      // Ignorar errores de localStorage en modo incógnito estricto
    }

    // Enviar formulario con validación comprensiva
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      var isValid = true;
      var nombre = nameInput ? nameInput.value.trim() : '';
      var email = emailInput ? emailInput.value.trim() : '';
      var celular = phoneInput ? phoneInput.value.trim() : '';

      // Validación de Nombre
      if (!nombre || nombre.length < 3) {
        setFieldError(nameInput, nameError, 'Por favor, ingresa tu nombre completo (mínimo 3 letras).');
        isValid = false;
      }

      // Validación de Email
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailPattern.test(email)) {
        setFieldError(emailInput, emailError, 'Por favor, ingresa un correo electrónico válido.');
        isValid = false;
      }

      // Validación de Celular (Perú: 9 dígitos comenzando por 9)
      var cleanPhone = celular.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 9 || cleanPhone.charAt(0) !== '9') {
        setFieldError(phoneInput, phoneError, 'Ingresa un celular válido de Perú (9 dígitos, comenzando por 9).');
        isValid = false;
      }

      if (!isValid) return;

      var regData = {
        nombre: nombre,
        email: email,
        celular: cleanPhone,
        registeredAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(regData));
      } catch (err) {
        // Fallback silencioso
      }

      showSuccess(regData, true);
    });

    // Botón para editar datos o registrar a otro familiar
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        showForm();
      });
    }

    // Botón inferior "QUIERO PARTICIPAR": scroll fluido hacia el formulario
    if (ribbonCtaBtn) {
      ribbonCtaBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (formContainer) {
          formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          formContainer.classList.add('is-highlighted');
          setTimeout(function () {
            formContainer.classList.remove('is-highlighted');
          }, 1800);

          if (!formState.hidden && nameInput) {
            setTimeout(function () {
              nameInput.focus();
            }, 600);
          }
        }
      });
    }
  })();

  /* ---------- Carrusel interactivo de Nuestro Equipo ---------- */
  (function initTeamCarousel() {
    var track = document.getElementById('teamTrack');
    if (!track) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll('.sc-team-card'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('[data-team-dot]'));
    var prevBtn = document.getElementById('teamPrev');
    var nextBtn = document.getElementById('teamNext');
    var counter = document.getElementById('teamCounter');
    if (!cards.length) return;

    var activeIndex = 0;

    function setActive(index) {
      activeIndex = Math.max(0, Math.min(index, cards.length - 1));
      cards.forEach(function (card, i) {
        card.classList.toggle('is-active', i === activeIndex);
      });
      dots.forEach(function (dot, i) {
        var isCurr = i === activeIndex;
        dot.classList.toggle('is-active', isCurr);
        dot.setAttribute('aria-selected', String(isCurr));
      });
      if (counter) {
        counter.textContent = (activeIndex + 1) + ' / ' + cards.length;
      }
      if (prevBtn) prevBtn.disabled = activeIndex === 0;
      if (nextBtn) nextBtn.disabled = activeIndex === cards.length - 1;
    }

    function scrollToCard(index) {
      var targetIndex = Math.max(0, Math.min(index, cards.length - 1));
      var card = cards[targetIndex];
      if (!card) return;
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
      setActive(targetIndex);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        scrollToCard(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        scrollToCard(activeIndex + 1);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.getAttribute('data-team-dot'), 10);
        if (!isNaN(idx)) scrollToCard(idx);
      });
    });

    cards.forEach(function (card, i) {
      card.addEventListener('click', function () {
        setActive(i);
      });
    });

    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToCard(activeIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToCard(activeIndex - 1);
      }
    });

    var scrollTimer = null;
    track.addEventListener('scroll', function () {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var trackLeft = track.scrollLeft + track.offsetLeft;
        var closest = 0;
        var minDist = Infinity;
        cards.forEach(function (card, i) {
          var dist = Math.abs(card.offsetLeft - trackLeft);
          if (dist < minDist) {
            minDist = dist;
            closest = i;
          }
        });
        setActive(closest);
      }, 60);
    }, { passive: true });

    // Arrastre con el mouse en escritorio
    var isDown = false;
    var startX = 0;
    var startScroll = 0;

    track.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      isDown = true;
      startX = e.pageX - track.offsetLeft;
      startScroll = track.scrollLeft;
      track.classList.add('is-dragging');
    });

    window.addEventListener('mouseup', function () {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('is-dragging');
    });

    track.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - track.offsetLeft;
      track.scrollLeft = startScroll - (x - startX) * 1.25;
    });

    setActive(0);
  })();

  /* =========================================================
     8. EJEMPLO INTERACTIVO ANTES Y DESPUÉS (#antes-despues)
     ========================================================= */
  (function initBeforeAfterShowcase() {
    var tabs = document.querySelectorAll('[data-ba-tab]');
    if (!tabs.length) return;

    var scenarios = {
      morning: {
        beforeTime: '8:15 a. m.',
        beforeEvent: 'Llamada saliente: «Papá» · 3er intento sin respuesta',
        beforeQuote: '«¡Papá! ¿Ya tomaste la pastilla de la presión? Te llamo porque me preocupo.»',
        beforeParent: 'Incómodo o regañado, como si perdiera su independencia.',
        beforeChild: 'Sales de tu reunión con estrés, culpa y dudas de si realmente la tomó.',
        afterTime: '8:14 a. m.',
        afterEvent: 'Silvio · Botiquín abierto a tiempo',
        afterQuote: '«Tu papá abrió su botiquín en su horario habitual. Todo en orden, no necesitas llamarlo.»',
        afterParent: 'Respetado y autónomo, sin cámaras ni recordatorios invasivos en casa.',
        afterChild: 'Trabajas enfocado y tranquilo sabiendo que su tratamiento va al día.'
      },
      afternoon: {
        beforeTime: '2:30 p. m.',
        beforeEvent: 'Foto borrosa por chat · Receta médica sin orden',
        beforeQuote: '«¿Esta pastilla era media o entera después del almuerzo? No entiendo la letra del doctor.»',
        beforeParent: 'Confundido frente al pastillero y con miedo a equivocarse de dosis.',
        beforeChild: 'Pierdes la tarde buscando recetas antiguas en chats y pidiendo favores.',
        afterTime: '2:30 p. m.',
        afterEvent: 'Silvio IA · Receta digitalizada con OCR',
        afterQuote: '«Receta leída y organizada: 1 tableta después del almuerzo. Horario guardado para la familia.»',
        afterParent: 'Seguro con su rutina habitual sin tener que descifrar papeles.',
        afterChild: 'Tienes el esquema médico claro en tu celular y respaldado por SilveraCalm.'
      },
      night: {
        beforeTime: '7:30 p. m.',
        beforeEvent: 'Llamada nocturna · Desgaste emocional',
        beforeQuote: '«¿Tomaste todo hoy? ¿Seguro? No te olvides mañana tampoco, por favor.»',
        beforeParent: 'Agotado de que cada conversación gire en torno a sus medicinas.',
        beforeChild: 'Sientes que dejaste de ser hijo o hija para convertirte en supervisor.',
        afterTime: '7:30 p. m.',
        afterEvent: 'Resumen diario · 100% de tomas confirmadas',
        afterQuote: '«Hoy se completaron las 2 tomas del día sin novedades. Buen momento para conversar.»',
        afterParent: 'Feliz de recibir una llamada de cariño sin sentirse interrogado.',
        afterChild: 'Recuperas el vínculo familiar: llamas para saber cómo estuvo su día.'
      }
    };

    var els = {
      beforeTime: document.getElementById('baBeforeTime'),
      beforeEvent: document.getElementById('baBeforeEvent'),
      beforeQuote: document.getElementById('baBeforeQuote'),
      beforeParent: document.getElementById('baBeforeParent'),
      beforeChild: document.getElementById('baBeforeChild'),
      afterTime: document.getElementById('baAfterTime'),
      afterEvent: document.getElementById('baAfterEvent'),
      afterQuote: document.getElementById('baAfterQuote'),
      afterParent: document.getElementById('baAfterParent'),
      afterChild: document.getElementById('baAfterChild')
    };

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-ba-tab');
        var data = scenarios[key];
        if (!data) return;

        tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        Object.keys(els).forEach(function (field) {
          if (els[field] && data[field]) {
            els[field].textContent = data[field];
          }
        });
      });
    });
  })();

})();
