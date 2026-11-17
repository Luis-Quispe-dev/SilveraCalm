/**
 * SilveraCalm — Interacciones de Planes (planes.js)
 * Manejo de botones de tiendas con estado "Próximamente" y utilidades de la página.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Manejo de botones de descarga de tiendas en estado "Próximamente"
  const storeButtons = document.querySelectorAll('.store-badge-card');

  storeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarAvisoProximamente();
    });
  });

  function mostrarAvisoProximamente() {
    // Si ya existe una notificación activa, no duplicar
    if (document.getElementById('planesToast')) return;

    const toast = document.createElement('div');
    toast.id = 'planesToast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(24, 30, 25, 0.95);
      color: #FFFFFF;
      padding: 12px 24px;
      border-radius: 9999px;
      font-family: var(--font-title, sans-serif);
      font-size: 0.9rem;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.15);
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.25s ease, transform 0.25s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      text-align: center;
      max-width: 90vw;
    `;

    toast.innerHTML = `
      <span style="color: var(--brand-lime, #8BC43F);">●</span>
      <span>Nuestras apps para iOS y Android estarán disponibles muy pronto.</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }
});
