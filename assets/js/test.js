/* =========================================================
   SilveraCalm — Test de Tranquilidad Familiar (test.js)
   Controla las 4 pantallas, validación, puntaje, atajos de
   teclado y persistencia local en localStorage ("sc_test").
   ========================================================= */

(function () {
  'use strict';

  var STORAGE_KEY = 'sc_test';
  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var ADVANCE_DELAY_MS = 300;
  var CALC_DELAY_MS = 1500;

  var QUESTIONS = [
    {
      text: '¿Cuántos medicamentos toma tu papá o mamá al día?',
      tip: 'Cada pastilla extra suma un horario distinto que recordar; identificar la carga diaria es el primer paso.',
      options: [
        'Ninguno o solo 1 medicamento ocasional',
        '1 o 2 medicamentos fijos al día',
        '3 o 4 medicamentos en distintos horarios',
        '5 o más medicamentos al día'
      ]
    },
    {
      text: '¿Cada cuánto olvida o retrasa una toma?',
      tip: 'Olvidar una toma de vez en cuando es humano; lo importante es notarlo a tiempo sin reproches.',
      options: [
        'Casi nunca, lleva su control al día',
        'Una o dos veces al mes, sin mayores problemas',
        'Una o dos veces por semana',
        'Varias veces a la semana o no recuerda si ya la tomó'
      ]
    },
    {
      text: '¿Quién organiza hoy sus medicinas?',
      tip: 'Un orden sencillo evita confusiones con nombres parecidos, sobre todo cuando hay recetas nuevas.',
      options: [
        'Él o ella con un pastillero ordenado y claro',
        'Yo o un familiar se las dejamos listas cada semana',
        'Las guarda en sus cajas originales y busca cada dosis',
        'No hay un orden fijo; a veces se mezclan recetas antiguas'
      ]
    },
    {
      text: '¿Cuántas veces al día lo llamas para preguntar si tomó sus pastillas?',
      tip: 'Llamar con cariño cansa cuando la conversación gira siempre en torno a las pastillas.',
      options: [
        'Ninguna vez; confío en su rutina actual',
        'Una vez al día, solo para confirmar',
        'Dos o tres veces al día en medio de mi jornada',
        'Cuatro o más veces, o insisto hasta que conteste'
      ]
    },
    {
      text: '¿Cómo reacciona cuando le recuerdas su medicación?',
      tip: 'Nadie quiere sentirse supervisado por sus hijos; cuidar su orgullo también es cuidar su salud.',
      options: [
        'Lo toma con calma y agradece el recordatorio',
        'Responde rápido, aunque a veces cambia de tema',
        'Se incomoda o siente que lo estoy controlando',
        'Se molesta o discutimos porque siente que pierde independencia'
      ]
    },
    {
      text: '¿Cuánto te cuesta concentrarte en el trabajo por esta preocupación?',
      tip: 'Tu mente necesita foco para trabajar bien; estar alerta todo el día agota en silencio.',
      options: [
        'Nada, trabajo con total tranquilidad',
        'Un poco, reviso el celular en mis pausas',
        'Bastante, me cuesta soltar la duda durante el día',
        'Mucho, vivo pendiente del teléfono por si pasa algo'
      ]
    },
    {
      text: '¿Tienes reuniones o turnos en los que no puedes contestar el teléfono?',
      tip: 'No poder contestar en una reunión no te hace mal hijo o hija; necesitas un respaldo pensado para esos momentos.',
      options: [
        'Casi nunca, tengo horario flexible para responder',
        'A veces, unas pocas horas a la semana',
        'Casi todos los días durante mis bloques de trabajo',
        'Turnos largos o reuniones continuas donde estoy incomunicado'
      ]
    },
    {
      text: '¿Tus hermanos u otros familiares comparten el cuidado?',
      tip: 'Cuidar en equipo alivia la carga y evita que todo dependa de una sola persona.',
      options: [
        'Sí, nos turnamos y estamos bien coordinados',
        'A veces ayudan cuando se los pido puntualmente',
        'Muy poco; casi toda la coordinación recae en mí',
        'No, llevo toda la responsabilidad por mi cuenta'
      ]
    },
    {
      text: '¿Vive solo o pasa varias horas del día sin compañía?',
      tip: 'Estar solo en casa no significa estar desprotegido si cuentas con una señal silenciosa y respetuosa.',
      options: [
        'Vive acompañado casi todo el día',
        'Pasa solo algunas horas puntuales de la tarde',
        'Pasa solo gran parte de la jornada laboral',
        'Vive completamente solo y nadie pasa a diario'
      ]
    },
    {
      text: '¿Cuánta autonomía quieres que conserve?',
      tip: 'No hay una respuesta única: el mejor cuidado es el que respeta su ritmo y te da paz a ti.',
      options: [
        'Toda la posible: que siga su rutina libremente y yo reciba confirmación silenciosa',
        'Bastante autonomía, con recordatorios suaves si retrasa una toma',
        'Acompañamiento cercano para organizar dosis sin confundirse',
        'Supervisión familiar cercana, priorizando seguridad ante todo'
      ]
    }
  ];

  var REC_ICONS = {
    team: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    meeting: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    sensor: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M9 8h6M12 5v6"/><path d="M8 16h8"/></svg>',
    routine: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    shield: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    autonomy: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    ocr: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
  };

  /* ---------- Referencias del DOM ---------- */
  var screenIntro = document.getElementById('screenIntro');
  var screenQuiz = document.getElementById('screenQuiz');
  var screenCalc = document.getElementById('screenCalc');
  var screenResults = document.getElementById('screenResults');
  var liveRegion = document.getElementById('testLiveRegion');

  var titleIntro = document.getElementById('titleIntro');
  var titleQuiz = document.getElementById('titleQuiz');
  var titleCalc = document.getElementById('titleCalc');
  var titleResults = document.getElementById('titleResults');

  var emailForm = document.getElementById('testEmailForm');
  var emailInput = document.getElementById('testEmailInput');
  var emailRow = emailForm ? emailForm.querySelector('.test-email-row') : null;
  var emailError = document.getElementById('testEmailError');

  var quizBackBtn = document.getElementById('quizBackBtn');
  var quizProgressText = document.getElementById('quizProgressText');
  var quizProgressBar = document.getElementById('quizProgressBar');
  var quizProgressFill = document.getElementById('quizProgressFill');
  var quizLegend = document.getElementById('quizLegend');
  var quizOptions = document.getElementById('quizOptions');
  var silvioTipText = document.getElementById('silvioTipText');

  var resultsEmailNote = document.getElementById('resultsEmailNote');
  var scoreRingCircle = document.getElementById('scoreRingCircle');
  var scoreNumber = document.getElementById('scoreNumber');
  var scoreLevelLabel = document.getElementById('scoreLevelLabel');
  var riskChip = document.getElementById('riskChip');
  var caregiverLoadValue = document.getElementById('caregiverLoadValue');
  var silvioResultHeading = document.getElementById('silvioResultHeading');
  var silvioResultMessage = document.getElementById('silvioResultMessage');
  var resultsRecommendations = document.getElementById('resultsRecommendations');
  var retryTestBtn = document.getElementById('retryTestBtn');

  if (!screenIntro || !screenQuiz || !screenCalc || !screenResults) return;

  /* ---------- Estado persistente ---------- */
  // step: 0 = portada, 1..10 = pregunta 1..10, 11 = cálculo, 12 = resultados
  var state = {
    email: '',
    answers: [],
    step: 0
  };

  var advanceTimer = null;
  var calcTimer = null;

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // Ignorar si el navegador restringe localStorage
    }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        state.email = typeof parsed.email === 'string' ? parsed.email : '';
        state.answers = Array.isArray(parsed.answers) ? parsed.answers : [];
        state.step = typeof parsed.step === 'number' ? parsed.step : 0;
      }
    } catch (err) {
      // Ignorar errores de parseo
    }
  }

  /* ---------- Fallback elegante de imágenes ---------- */
  function attachImageFallbacks() {
    document.querySelectorAll('img[data-fallback-img]').forEach(function (img) {
      function applyFallback() {
        var frame = img.closest('.test-media-frame');
        if (!frame || frame.classList.contains('is-broken')) return;
        img.style.display = 'none';
        frame.classList.add('is-broken');
        var text = document.createElement('span');
        text.className = 'test-img-fallback';
        text.textContent = img.getAttribute('alt') || 'Ilustración de SilveraCalm';
        frame.appendChild(text);
      }

      img.addEventListener('error', applyFallback);
      if (img.complete && img.naturalWidth === 0) {
        applyFallback();
      }
    });
  }

  /* ---------- Navegación entre pantallas ---------- */
  function clearTimers() {
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    if (calcTimer) {
      clearTimeout(calcTimer);
      calcTimer = null;
    }
  }

  function announce(msg) {
    if (liveRegion) liveRegion.textContent = msg;
  }

  function showScreen(targetScreen, focusEl, shouldFocus) {
    [screenIntro, screenQuiz, screenCalc, screenResults].forEach(function (sec) {
      sec.hidden = sec !== targetScreen;
    });

    if (shouldFocus && focusEl) {
      focusEl.focus({ preventScroll: false });
    }
  }

  function goToStep(nextStep, shouldFocus) {
    clearTimers();
    state.step = nextStep;
    saveState();

    if (nextStep === 0) {
      showScreen(screenIntro, titleIntro, shouldFocus);
      announce('Portada del Test de Tranquilidad Familiar');
      return;
    }

    if (nextStep >= 1 && nextStep <= QUESTIONS.length) {
      renderQuestion(nextStep - 1);
      showScreen(screenQuiz, titleQuiz, shouldFocus);
      announce('Pregunta ' + nextStep + ' de ' + QUESTIONS.length);
      return;
    }

    if (nextStep === 11) {
      showScreen(screenCalc, titleCalc, shouldFocus);
      announce('Silvio está preparando tu diagnóstico');
      calcTimer = setTimeout(function () {
        goToStep(12, true);
      }, CALC_DELAY_MS);
      return;
    }

    renderResults();
    showScreen(screenResults, titleResults, shouldFocus);
    announce('Resultados del Test de Tranquilidad Familiar listos');
  }

  /* ---------- Pantalla 1: Validación de correo ---------- */
  function setEmailError(message) {
    if (!emailError || !emailRow) return;
    if (message) {
      emailRow.classList.add('is-invalid');
      emailError.textContent = message;
      emailError.hidden = false;
    } else {
      emailRow.classList.remove('is-invalid');
      emailError.textContent = '';
      emailError.hidden = true;
    }
  }

  if (emailInput) {
    emailInput.addEventListener('input', function () {
      if (!emailError.hidden) setEmailError('');
    });
  }

  if (emailForm) {
    emailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = emailInput ? emailInput.value.trim() : '';

      if (!value || !EMAIL_REGEX.test(value)) {
        setEmailError('Por favor, escribe un correo válido (ejemplo: maria@correo.com) para guardar tu diagnóstico.');
        if (emailInput) emailInput.focus();
        return;
      }

      setEmailError('');
      state.email = value;
      // TODO: conectar envío de correo
      goToStep(1, true);
    });
  }

  /* ---------- Pantalla 2: Preguntas ---------- */
  function renderQuestion(index) {
    var q = QUESTIONS[index];
    var total = QUESTIONS.length;
    var stepNum = index + 1;
    var savedVal = state.answers[index];

    if (titleQuiz) titleQuiz.textContent = q.text;
    if (quizLegend) quizLegend.textContent = q.text;
    if (silvioTipText) silvioTipText.textContent = q.tip;
    if (quizProgressText) quizProgressText.textContent = 'Pregunta ' + stepNum + ' de ' + total;
    if (quizProgressBar) quizProgressBar.setAttribute('aria-valuenow', String(stepNum));
    if (quizProgressFill) quizProgressFill.style.width = ((stepNum / total) * 100) + '%';

    if (!quizOptions) return;
    quizOptions.innerHTML = '';

    q.options.forEach(function (optText, optIndex) {
      var inputId = 'q' + stepNum + '_opt' + optIndex;
      var label = document.createElement('label');
      label.className = 'test-option-card' + (savedVal === optIndex ? ' is-selected' : '');
      label.setAttribute('for', inputId);

      var radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'quizOption';
      radio.id = inputId;
      radio.value = String(optIndex);
      radio.className = 'test-option-radio';
      radio.checked = savedVal === optIndex;

      var numBadge = document.createElement('span');
      numBadge.className = 'test-option-num';
      numBadge.setAttribute('aria-hidden', 'true');
      numBadge.textContent = String(optIndex + 1);

      var textSpan = document.createElement('span');
      textSpan.className = 'test-option-label';
      textSpan.textContent = optText;

      label.appendChild(radio);
      label.appendChild(numBadge);
      label.appendChild(textSpan);

      radio.addEventListener('change', function () {
        selectOption(index, optIndex, true);
      });

      label.addEventListener('click', function (e) {
        // Si ya estaba marcada y el usuario vuelve a hacer clic, también avanza
        if (e.target !== radio && radio.checked) {
          selectOption(index, optIndex, true);
        }
      });

      quizOptions.appendChild(label);
    });
  }

  function selectOption(questionIndex, optionIndex, autoAdvance) {
    state.answers[questionIndex] = optionIndex;
    saveState();

    if (quizOptions) {
      var cards = quizOptions.querySelectorAll('.test-option-card');
      cards.forEach(function (card, idx) {
        var isCurr = idx === optionIndex;
        card.classList.toggle('is-selected', isCurr);
        var radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = isCurr;
      });
    }

    if (autoAdvance) {
      clearTimers();
      advanceTimer = setTimeout(function () {
        advanceFromQuestion(questionIndex);
      }, ADVANCE_DELAY_MS);
    }
  }

  function advanceFromQuestion(questionIndex) {
    if (typeof state.answers[questionIndex] !== 'number') return;
    if (questionIndex < QUESTIONS.length - 1) {
      goToStep(questionIndex + 2, true);
    } else {
      goToStep(11, true);
    }
  }

  function goBack() {
    if (state.step >= 1 && state.step <= QUESTIONS.length) {
      goToStep(state.step - 1, true);
    }
  }

  if (quizBackBtn) {
    quizBackBtn.addEventListener('click', goBack);
  }

  /* ---------- Atajos de teclado (1-4, Enter, Escape) ---------- */
  document.addEventListener('keydown', function (e) {
    if (document.querySelector('.modal:not([hidden])')) return;

    if (state.step >= 1 && state.step <= QUESTIONS.length) {
      var qIdx = state.step - 1;

      if (e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        selectOption(qIdx, parseInt(e.key, 10) - 1, true);
        return;
      }

      if (e.key === 'Enter') {
        if (e.target && e.target.tagName === 'BUTTON') return;
        if (typeof state.answers[qIdx] === 'number') {
          e.preventDefault();
          clearTimers();
          advanceFromQuestion(qIdx);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        goBack();
      }
    }
  });

  /* ---------- Pantalla 4: Cálculo de resultados y render ---------- */
  function getAnswer(idx) {
    return typeof state.answers[idx] === 'number' ? state.answers[idx] : 0;
  }

  function buildRecommendations() {
    var recs = [];

    if (getAnswer(7) >= 2) {
      recs.push({
        icon: REC_ICONS.team,
        title: 'Comparte las alertas con tus hermanos',
        desc: 'Configura una red familiar para turnarse confirmaciones y evitar que todo el seguimiento dependa solo de ti.'
      });
    }

    if (getAnswer(6) >= 2) {
      recs.push({
        icon: REC_ICONS.meeting,
        title: 'Activa el modo reunión',
        desc: 'Silencia avisos no urgentes mientras estás en turnos o juntas y delega alertas críticas a un familiar de respaldo.'
      });
    }

    if (getAnswer(3) >= 2) {
      recs.push({
        icon: REC_ICONS.sensor,
        title: 'Sensor del botiquín: menos llamadas',
        desc: 'Recibe una confirmación discreta cuando abre su botiquín habitual, sin tener que interrumpir su día ni el tuyo.'
      });
    }

    if (getAnswer(1) >= 2) {
      recs.push({
        icon: REC_ICONS.routine,
        title: 'Recordatorios suaves en su rutina',
        desc: 'Asocia cada toma con momentos cotidianos como el desayuno o el lonche mediante avisos cálidos y respetuosos.'
      });
    }

    if (getAnswer(8) >= 2) {
      recs.push({
        icon: REC_ICONS.shield,
        title: 'Aviso discreto si algo no ocurre',
        desc: 'Si pasa muchas horas sin compañía, recibe una señal solo cuando el botiquín no se abre en la ventana esperada.'
      });
    }

    if (getAnswer(9) === 0) {
      recs.push({
        icon: REC_ICONS.autonomy,
        title: 'Él decide, tú solo confirmas',
        desc: 'Tu papá mantiene su ritmo propio sin cámaras ni micrófonos, mientras tú conservas la calma desde tu trabajo.'
      });
    }

    var fallbacks = [
      {
        icon: REC_ICONS.ocr,
        title: 'Ordena sus recetas en un solo lugar',
        desc: 'Digitaliza las indicaciones médicas para tener dosis y horarios claros siempre a mano para toda la familia.'
      },
      {
        icon: REC_ICONS.autonomy,
        title: 'Llamadas de cariño, no de control',
        desc: 'Cuando la medicación ya está confirmada en silencio, tus llamadas vuelven a ser para conversar y disfrutar.'
      },
      {
        icon: REC_ICONS.routine,
        title: 'Pastillero visible en su rutina diaria',
        desc: 'Ubica sus medicinas en un espacio habitual y bien iluminado para reforzar la memoria sin cambiar sus costumbres.'
      }
    ];

    for (var i = 0; recs.length < 3 && i < fallbacks.length; i++) {
      var exists = recs.some(function (r) { return r.title === fallbacks[i].title; });
      if (!exists) recs.push(fallbacks[i]);
    }

    return recs.slice(0, 3);
  }

  function animateScoreRing(targetScore) {
    var radius = 66;
    var circumference = 2 * Math.PI * radius;
    scoreRingCircle.style.strokeDasharray = String(circumference);

    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      scoreRingCircle.style.strokeDashoffset = String(circumference * (1 - targetScore / 100));
      scoreNumber.textContent = String(targetScore);
      return;
    }

    var duration = 850;
    var startTime = null;
    scoreRingCircle.style.strokeDashoffset = String(circumference);
    scoreNumber.textContent = '0';

    function frame(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var currentVal = Math.round(eased * targetScore);

      scoreNumber.textContent = String(currentVal);
      scoreRingCircle.style.strokeDashoffset = String(circumference * (1 - (eased * targetScore) / 100));

      if (progress < 1) {
        window.requestAnimationFrame(frame);
      }
    }

    window.requestAnimationFrame(frame);
  }

  function renderResults() {
    // Puntos totales (preguntas 1 a 9; máx 27)
    var totalPoints = 0;
    for (var i = 0; i < 9; i++) {
      totalPoints += getAnswer(i);
    }

    var score = Math.max(0, Math.min(100, Math.round(100 - (totalPoints / 27) * 100)));

    // Riesgo de omisión médica: P1(0), P2(1), P3(2), P9(8) -> máx 12
    var omissionRisk = getAnswer(0) + getAnswer(1) + getAnswer(2) + getAnswer(8);

    // Carga del cuidador: P4(3), P5(4), P6(5), P7(6), P8(7) -> máx 15
    var caregiverLoad = getAnswer(3) + getAnswer(4) + getAnswer(5) + getAnswer(6) + getAnswer(7);

    if (resultsEmailNote) {
      resultsEmailNote.textContent = state.email
        ? 'Diagnóstico guardado para ' + state.email
        : 'Diagnóstico personalizado listo para tu familia';
    }

    // Nivel de tranquilidad y mensaje de Silvio
    var levelText = '';
    var silvioHeading = '';
    var silvioCopy = '';

    if (score >= 70) {
      levelText = 'Tranquilidad alta';
      scoreRingCircle.style.stroke = '#009245';
      silvioHeading = 'Van por muy buen camino';
      silvioCopy = 'Ya tienen una base sólida de respeto y orden. Con confirmaciones discretas puedes proteger aún más tu tiempo laboral sin perder la cercanía.';
    } else if (score >= 40) {
      levelText = 'Tranquilidad media';
      scoreRingCircle.style.stroke = '#D97706';
      silvioHeading = 'Estás haciendo mucho con poco respaldo';
      silvioCopy = 'Es natural sentir cansancio cuando intentas cumplir en el trabajo y cuidar a distancia. Pequeños ajustes en la rutina devolverán calma a ambos.';
    } else {
      levelText = 'Necesitas apoyo';
      scoreRingCircle.style.stroke = '#C94A4A';
      silvioHeading = 'No tienes que cargar con todo en silencio';
      silvioCopy = 'Cuidar así desgasta a cualquiera, y no es tu culpa. Apoyarte en tu familia y en señales silenciosas te permitirá respirar tranquilo otra vez.';
    }

    if (scoreLevelLabel) scoreLevelLabel.textContent = levelText;
    if (silvioResultHeading) silvioResultHeading.textContent = silvioHeading;
    if (silvioResultMessage) silvioResultMessage.textContent = silvioCopy;
    if (caregiverLoadValue) caregiverLoadValue.textContent = caregiverLoad + ' / 15 pts';

    // Chip de riesgo de omisión médica
    if (riskChip) {
      riskChip.className = 'test-risk-chip';
      if (omissionRisk <= 4) {
        riskChip.classList.add('test-risk-chip--low');
        riskChip.textContent = 'Bajo (' + omissionRisk + '/12)';
      } else if (omissionRisk <= 8) {
        riskChip.classList.add('test-risk-chip--moderate');
        riskChip.textContent = 'Moderado (' + omissionRisk + '/12)';
      } else {
        riskChip.classList.add('test-risk-chip--high');
        riskChip.textContent = 'Alto (' + omissionRisk + '/12)';
      }
    }

    // 3 recomendaciones
    if (resultsRecommendations) {
      var recs = buildRecommendations();
      resultsRecommendations.innerHTML = '';
      recs.forEach(function (rec) {
        var card = document.createElement('article');
        card.className = 'test-rec-card';
        card.innerHTML =
          '<div class="test-rec-icon">' + rec.icon + '</div>' +
          '<h4></h4>' +
          '<p></p>';
        card.querySelector('h4').textContent = rec.title;
        card.querySelector('p').textContent = rec.desc;
        resultsRecommendations.appendChild(card);
      });
    }

    animateScoreRing(score);
  }

  /* ---------- Repetir test ---------- */
  if (retryTestBtn) {
    retryTestBtn.addEventListener('click', function () {
      clearTimers();
      state = { email: '', answers: [], step: 0 };
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        // Ignorar
      }
      if (emailInput) emailInput.value = '';
      setEmailError('');
      goToStep(0, true);
    });
  }

  /* ---------- Inicialización ---------- */
  attachImageFallbacks();
  loadState();

  if (emailInput && state.email) {
    emailInput.value = state.email;
  }

  // Validar estado restaurado para retomar en el paso correcto
  if (state.step > 0 && !state.email) {
    state.step = 0;
  } else if (state.step === 12 && state.answers.length < QUESTIONS.length) {
    state.step = Math.min(state.answers.length + 1, QUESTIONS.length);
  }

  goToStep(state.step, false);
})();
