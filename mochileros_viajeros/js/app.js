// filepath: /Users/marcogarcia/Pagina-web-interfaces/Pagina-web-interfaces-1/mochileros_viajeros/js/app.js
(function(){
  const STORAGE_KEY = 'mv_user';

  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));

  function getUser(){ try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; } }
  function setUser(u){ try { localStorage.setItem(STORAGE_KEY, u); } catch {} }
  function clearUser(){ try { localStorage.removeItem(STORAGE_KEY); } catch {} }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m])); }

  // Inserta el nombre de usuario en elementos con data-bind="username"
  function insertUsernameBindings(username){
    if (!username) return;
    qsa('[data-bind="username"]').forEach(el => { el.textContent = username; });
  }

  // Muestra un banner y oculta el formulario de acceso cuando está logueado
  function showAuthBanner(username){
    const form = qs('.form-acceso');
    if (!form) return;

    let banner = document.getElementById('auth-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'auth-banner';
      banner.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px;margin-bottom:12px;border:1px solid #c7ccd1;border-radius:10px;background:#eef7ff;';
      form.parentNode.insertBefore(banner, form);
    }
    banner.innerHTML = `Hola, <strong>${escapeHtml(username)}</strong><button type="button" id="auth-logout" style="padding:8px 14px;border:none;border-radius:8px;background:#e74c3c;color:#fff;cursor:pointer;">Cerrar sesión</button>`;

    const logoutBtn = qs('#auth-logout');
    logoutBtn?.addEventListener('click', () => { clearUser(); location.reload(); });

    form.style.display = 'none';
  }

  // Helpers de validación
  function showError(input, msg){
    if (!input) return;
    input.classList.add('input-error');
    input.setAttribute('aria-invalid', 'true');
    let err = input.nextElementSibling;
    if (!err || !err.classList || !err.classList.contains('error-msg')) {
      err = document.createElement('div');
      err.className = 'error-msg';
      input.insertAdjacentElement('afterend', err);
    }
    err.textContent = msg;
  }

  function clearError(input){
    if (!input) return;
    input.classList.remove('input-error');
    input.removeAttribute('aria-invalid');
    const err = input.nextElementSibling;
    if (err && err.classList && err.classList.contains('error-msg')) err.remove();
  }

  function clearAllErrors(form){
    qsa('.input-error', form).forEach(el => clearError(el));
    qsa('.error-msg', form).forEach(el => el.remove());
  }

  function isEmail(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
  function luhnCheck(num){
    const arr = num.replace(/\D/g,'').split('').reverse().map(n => parseInt(n,10));
    if (!arr.length) return false;
    let sum = 0;
    for (let i=0;i<arr.length;i++){
      let n = arr[i];
      if (i % 2 === 1){ n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }
    return sum % 10 === 0;
  }

  function formatCardNumber(input){
    if (!input) return;
    input.addEventListener('input', () => {
      const digits = input.value.replace(/\D/g,'');
      const groups = digits.match(/.{1,4}/g) || [];
      input.value = groups.join(' ');
    });
  }

  // Gestión de sesión: login/logout y saludo dinámico
  function initAuth(){
    const username = getUser();
    const loginForm = qs('.form-acceso');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAllErrors(loginForm);

        const userEl = qs('#usuario', loginForm);
        const passEl = qs('#contrasena', loginForm);
        const user = (userEl?.value || '').trim();
        const pass = passEl?.value || '';
        let ok = true;

        if (!user || user.length < 3) { showError(userEl, 'Usuario mínimo 3 caracteres'); ok = false; }
        if (!pass || pass.length < 6) { showError(passEl, 'Contraseña mínimo 6 caracteres'); ok = false; }
        if (!ok) return;

        setUser(user);
        location.href = 'acceso.html';
      });
    }

    const logoutBtn = qs('#btn-logout');
    if (logoutBtn) {
      if (username) {
        logoutBtn.removeAttribute('aria-disabled');
        logoutBtn.style.cursor = 'pointer';
        logoutBtn.style.background = '#e74c3c';
        logoutBtn.style.color = '#fff';
        logoutBtn.addEventListener('click', () => { clearUser(); location.href = 'mochileros_viajeros.html'; });
      }
    }

    const sidebarName = qs('#usuario-sidebar');
    if (username && sidebarName) sidebarName.textContent = username;

    if (username && loginForm) showAuthBanner(username);

    insertUsernameBindings(username);
  }

  // Validación del formulario de registro
  function initRegistro(){
    const form = qs('.form-registro');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      clearAllErrors(form);
      let ok = true;

      const nombre = qs('#nombre', form);
      const apellidos = qs('#apellidos', form);
      const correo = qs('#correo', form);
      const correo2 = qs('#correo2', form);
      const fecha = qs('#fecha', form);
      const login = qs('#login', form);
      const password = qs('#password', form);
      const privacidad = qs('#privacidad', form);

      if (!nombre.value.trim()) { showError(nombre, 'Nombre requerido'); ok = false; }
      if (!apellidos.value.trim()) { showError(apellidos, 'Apellidos requeridos'); ok = false; }
      if (!isEmail(correo.value)) { showError(correo, 'Correo no válido'); ok = false; }
      if (correo.value !== correo2.value) { showError(correo2, 'Los correos no coinciden'); ok = false; }
      if (!fecha.value) { showError(fecha, 'Fecha requerida'); ok = false; }
      else {
        const dob = new Date(fecha.value);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        if (age < 14) { showError(fecha, 'Debes tener al menos 14 años'); ok = false; }
      }
      if (login.value.trim().length < 3) { showError(login, 'Login mínimo 3 caracteres'); ok = false; }
      if (password.value.length < 6) { showError(password, 'Password mínimo 6 caracteres'); ok = false; }
      if (!privacidad.checked) { showError(privacidad, 'Debes aceptar la privacidad'); ok = false; }

      if (!ok) { e.preventDefault(); return; }

      // Persistimos el usuario para mantener la sesión tras registrarse
      setUser(login.value.trim() || nombre.value.trim());
      // Se permitirá la navegación por defecto a acceso.html (action del form)
    });
  }

  // Validación de los formularios de compra
  function initCompras(){
    qsa('.purchase-form').forEach((form) => {
      const nombre = qs('input[name="nombre"]', form);
      const email = qs('input[name="email"]', form);
      const tipo = qs('select[name="tipo-tarjeta"]', form);
      const numero = qs('input[name="numero-tarjeta"]', form);
      const titular = qs('input[name="nombre-titular"]', form);
      const cad = qs('input[name="caducidad"]', form);
      const cvv = qs('input[name="cvv"]', form);

      formatCardNumber(numero);

      form.addEventListener('submit', (e) => {
        clearAllErrors(form);
        let ok = true;

        if (!nombre.value.trim()) { showError(nombre, 'Nombre requerido'); ok = false; }
        if (!isEmail(email.value)) { showError(email, 'Email no válido'); ok = false; }
        if (!tipo.value) { showError(tipo, 'Selecciona tipo de tarjeta'); ok = false; }

        const digits = (numero.value || '').replace(/\D/g,'');
        const isAmex = tipo.value === 'amex';
        const expectedLen = isAmex ? 15 : 16;
        if (digits.length !== expectedLen || !luhnCheck(digits)) { showError(numero, 'Número de tarjeta no válido'); ok = false; }

        if (!titular.value.trim()) { showError(titular, 'Titular requerido'); ok = false; }
        if (!cad.value) { showError(cad, 'Caducidad requerida'); ok = false; }
        else {
          const [y, m] = cad.value.split('-').map(Number);
          const lastDay = new Date(y, m, 0); // fin del mes indicado
          if (lastDay < new Date()) { showError(cad, 'Tarjeta caducada'); ok = false; }
        }

        const cvvDigits = (cvv.value || '').replace(/\D/g,'');
        const cvvLen = isAmex ? 4 : 3;
        if (cvvDigits.length !== cvvLen) { showError(cvv, `CVV debe tener ${cvvLen} dígitos`); ok = false; }

        if (!ok) e.preventDefault();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initRegistro();
    initCompras();
  });
})();
