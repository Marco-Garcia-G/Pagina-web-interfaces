(function () {
  const key = 'mvPurchaseEntry';
  function redirectHome() {
    window.location.replace('mochileros_viajeros.html');
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      const allowed = sessionStorage.getItem(key) === '1';
      if (!allowed) {
        redirectHome();
        return;
      }
      sessionStorage.removeItem(key);
      window.scrollTo(0, 0);
    } catch (err) {
      redirectHome();
    }
  });
})();
