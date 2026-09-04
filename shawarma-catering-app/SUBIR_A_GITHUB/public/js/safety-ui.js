(() => {
  'use strict';
  // Limpiar cualquier residuo bloqueante en el navegador
  try {
    localStorage.removeItem('shawarma_unconfirmed_submission_v1');
    localStorage.removeItem('shawarma_conflict_copy_v1');
    localStorage.removeItem('shawarma_safety_conflict_v1');
  } catch(e) {}

  window.ShawarmaSafety = {
    valid: () => true,
    savePoint: () => true,
    showSafetyState: () => {},
    readPoints: () => []
  };

  const app = window.app;
  if (app) {
    app.safetyConflict = null;
    app.safetyUnconfirmed = null;
    app.safetyClosing = false;
  }
})();
