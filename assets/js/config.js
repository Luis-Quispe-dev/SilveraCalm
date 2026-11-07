/* =========================================================
   CONFIGURACIÓN DE SILVERACALM
   Este es el ÚNICO archivo que necesitas tocar para lo básico.
   ========================================================= */
window.SILVERA_CONFIG = {
  // 1) Enlace del Test de Tranquilidad Familiar.
  //    Pega aquí la URL de tu test (Google Forms, Typeform, tu app...).
  //    Si lo dejas vacío (''), los botones mostrarán un aviso de "muy pronto".
  TEST_URL: '',

  //    true  = el test se abre en una pestaña nueva
  //    false = el test se abre en la misma pestaña
  TEST_NEW_TAB: false,

  // 2) Dirección de tu blog de Blogger (sin "/" al final).
  BLOG_URL: 'https://silveracalm.blogspot.com',

  // 3) Cuántos artículos se muestran al inicio y cuántos más con "Cargar más".
  BLOG_PAGE_SIZE: 6,

  // 4) Cada cuántos minutos se revisa si publicaste algo nuevo
  //    (también se revisa cada vez que alguien vuelve a la pestaña).
  BLOG_REFRESH_MINUTES: 3,

  // 5) Un artículo se marca como "Nuevo" si tiene menos de estos días.
  BLOG_NEW_DAYS: 7
};
