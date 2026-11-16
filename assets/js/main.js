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

    // Fecha objetivo: Sábado 28 de Noviembre de 2026, 10:00:00 AM (Hora de Lima / UTC-5)
    var targetDate = new Date('2026-11-28T10:00:00-05:00').getTime();

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
      // 28 Nov 2026, 10:00 a 10:45 AM Lima (15:00 a 15:45 UTC)
      var dates = '20261128T150000Z/20261128T154500Z';
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

})();
