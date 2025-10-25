// Utilidades de autenticación para Mochileros Viajeros
(function (global) {
  const USERS_KEY = 'mv_users';
  const SESSION_KEY = 'mv_session';
  const TIPS_KEY = 'mv_tips';
  const DEFAULT_TIPS = [
    { title: 'Cómo elegir tu mochila ideal', description: 'Revisa capacidad, estructura y peso antes de comprar.', url: '#' },
    { title: 'Consejos para ahorrar viajando', description: 'Planifica con antelación y aprovecha transportes locales.', url: '#' },
    { title: 'Qué llevar en tu botiquín de viaje', description: 'Incluye analgésicos, vendas y tus medicinas básicas.', url: '#' },
  ];

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn('[MVAuth] JSON inválido en localStorage', err);
      return fallback;
    }
  }

  function loadUsers() {
    try {
      return safeParse(localStorage.getItem(USERS_KEY), []);
    } catch (err) {
      console.warn('[MVAuth] No se pudo leer usuarios', err);
      return [];
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (err) {
      console.warn('[MVAuth] No se pudo guardar usuarios', err);
    }
  }

  function findUser(email, password) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) return null;
    return loadUsers().find(
      (user) =>
        user.email?.toLowerCase() === normalizedEmail && user.password === password
    ) || null;
  }

  function startSession(user) {
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          email: user.email,
          name: user.name || '',
          login: user.login || '',
          avatar: user.avatar || '',
        })
      );
    } catch (err) {
      console.warn('[MVAuth] No se pudo iniciar la sesión', err);
    }
  }

  function getSession() {
    try {
      return safeParse(localStorage.getItem(SESSION_KEY), null);
    } catch (err) {
      console.warn('[MVAuth] No se pudo leer la sesión', err);
      return null;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.warn('[MVAuth] No se pudo cerrar la sesión', err);
    }
  }

  function isValidName(value) {
    return typeof value === 'string' && value.trim().length >= 3;
  }

  function isValidSurname(value) {
    if (typeof value !== 'string') return false;
    const parts = value.trim().split(/\s+/).filter(Boolean);
    return parts.length >= 2 && parts.every((part) => part.length >= 3);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidLogin(value) {
    return typeof value === 'string' && value.trim().length >= 5;
  }

  function isValidPassword(value) {
    // 8+ chars, at least 2 digits, 1 uppercase, 1 lowercase, 1 special
    return /^(?=.*[a-z])(?=.*[A-Z])(?=(?:.*\d){2,})(?=.*[^\w\s]).{8,}$/.test(value || '');
  }

  function isValidBirthDate(value) {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    if (date > now) return false;
    const minAgeDate = new Date();
    minAgeDate.setFullYear(minAgeDate.getFullYear() - 14);
    if (date > minAgeDate) return false;
    const maxAgeDate = new Date();
    maxAgeDate.setFullYear(maxAgeDate.getFullYear() - 120);
    if (date < maxAgeDate) return false;
    return true;
  }

  function isValidImage(file) {
    if (!file) return false;
    const allowedTypes = ['image/webp', 'image/png', 'image/jpeg'];
    const allowedExts = ['webp', 'png', 'jpg', 'jpeg'];
    const ext = file.name?.split('.').pop()?.toLowerCase() || '';
    return allowedTypes.includes(file.type) || allowedExts.includes(ext);
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
      reader.readAsDataURL(file);
    });
  }

  global.MVAuth = {
    loadUsers,
    saveUsers,
    findUser,
    startSession,
    getSession,
    clearSession,
  };

  function getDisplayName(session) {
    if (!session) return '';
    return session.name || session.login || session.email || '';
  }

  function setMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    if (!text) {
      element.style.color = '';
      return;
    }
    if (type === 'error') element.style.color = '#d32f2f';
    else if (type === 'success') element.style.color = '#2e7d32';
    else element.style.color = '#424242';
  }

  function updateAuthUI(session = getSession()) {
    const greetingWrapper = document.getElementById('header-user');
    const nameTarget = greetingWrapper?.querySelector('[data-auth-name]');
    const loginLink = document.getElementById('header-login');
    const sidebarName = document.getElementById('usuario-sidebar');
    const logoutLinks = document.querySelectorAll('[data-action="logout"]');
    const avatarImgs = document.querySelectorAll('[data-profile-avatar]');
    const sessionNameEls = document.querySelectorAll('[data-session-name]');
    const loginPanes = document.querySelectorAll('[data-login-pane]');
    const sessionPanes = document.querySelectorAll('[data-session-pane]');

    if (session) {
      const displayName = getDisplayName(session) || 'Usuario';
      if (greetingWrapper) {
        greetingWrapper.hidden = false;
        if (nameTarget) nameTarget.textContent = displayName;
      }
      if (loginLink) loginLink.hidden = true;
      if (sidebarName) sidebarName.textContent = displayName;
      sessionNameEls.forEach((el) => { el.textContent = displayName; });
      avatarImgs.forEach((img) => {
        const fallback = img.dataset.defaultAvatar || './images/logo.png';
        img.src = session.avatar || fallback;
      });
      loginPanes.forEach((pane) => { pane.hidden = true; });
      sessionPanes.forEach((pane) => { pane.hidden = false; });
      logoutLinks.forEach((btn) => {
        btn.hidden = false;
        btn.removeAttribute('aria-disabled');
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#e74c3c';
        btn.style.color = '#fff';
      });
    } else {
      if (greetingWrapper) greetingWrapper.hidden = true;
      if (loginLink) {
        loginLink.hidden = false;
        loginLink.setAttribute('href', 'acceso.html');
      }
      if (sidebarName) sidebarName.textContent = 'Usuario';
      sessionNameEls.forEach((el) => { el.textContent = 'Usuario'; });
      avatarImgs.forEach((img) => {
        const fallback = img.dataset.defaultAvatar || './images/logo.png';
        img.src = fallback;
      });
      loginPanes.forEach((pane) => { pane.hidden = false; });
      sessionPanes.forEach((pane) => { pane.hidden = true; });
      logoutLinks.forEach((btn) => {
        btn.hidden = true;
        btn.setAttribute('aria-disabled', 'true');
        btn.style.cursor = 'default';
        btn.style.backgroundColor = '';
        btn.style.color = '';
      });
    }
  }

  function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const emailInput = form.querySelector('#login-email');
    const passwordInput = form.querySelector('#login-password');
    const messageBox = form.querySelector('#login-message');
    const redirectUrl = form.dataset.redirect || '';

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = (emailInput?.value || '').trim();
      const password = passwordInput?.value || '';
      setMessage(messageBox, '', 'info');

      if (!email || !password) {
        setMessage(messageBox, 'Completa correo y contraseña.', 'error');
        return;
      }

      const user = findUser(email, password);
      if (!user) {
        setMessage(messageBox, 'Credenciales no válidas. Intenta de nuevo.', 'error');
        window.alert('No hemos encontrado un usuario con esas credenciales. Por favor, regístrate o verifica los datos.');
        return;
      }

      startSession(user);
      const nameToShow = user.name || user.login || user.email;
      setMessage(messageBox, `¡Bienvenido ${nameToShow}!`, 'success');
      form.reset();
      updateAuthUI();
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    });
  }

  function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    const messageBox = document.getElementById('register-message');
    const privacyCheckbox = form.querySelector('#privacidad');
    const submitBtn = form.querySelector('button[type="submit"]');
    const imageInput = form.querySelector('#imagen');

    const syncSubmitState = () => {
      if (!submitBtn) return;
      const enabled = !!privacyCheckbox?.checked;
      submitBtn.disabled = !enabled;
      submitBtn.style.opacity = enabled ? '1' : '0.6';
      submitBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    };
    syncSubmitState();
    privacyCheckbox?.addEventListener('change', syncSubmitState);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = form.querySelector('#nombre')?.value.trim() || '';
      const surname = form.querySelector('#apellidos')?.value.trim() || '';
      const email = form.querySelector('#correo')?.value.trim().toLowerCase() || '';
      const emailConfirm = form.querySelector('#correo2')?.value.trim().toLowerCase() || '';
      const birthDate = form.querySelector('#fecha')?.value || '';
      const login = form.querySelector('#login')?.value.trim() || '';
      const password = form.querySelector('#password')?.value || '';
      const privacy = privacyCheckbox?.checked || false;

      setMessage(messageBox, '', 'info');

      const errors = [];
      if (!isValidName(name)) errors.push('El nombre debe tener al menos 3 caracteres.');
      if (!isValidSurname(surname)) errors.push('Introduce dos apellidos de al menos 3 letras cada uno.');
      if (!isValidEmail(email)) errors.push('El correo electrónico no tiene un formato válido.');
      if (email !== emailConfirm) errors.push('Los correos electrónicos no coinciden.');
      if (!isValidBirthDate(birthDate)) errors.push('Introduce una fecha de nacimiento real (mínimo 14 años).');
      if (!isValidLogin(login)) errors.push('El login debe tener al menos 5 caracteres.');
      if (!isValidPassword(password)) errors.push('La contraseña debe tener 8 caracteres, 2 números, 1 mayúscula, 1 minúscula y 1 símbolo.');
      const avatarFile = imageInput?.files?.[0];
      if (!isValidImage(avatarFile)) errors.push('Sube una imagen en formato PNG, JPG o WEBP.');
      if (!privacy) errors.push('Debes aceptar la política de privacidad.');

      const users = loadUsers();
      if (users.some((user) => user.email?.toLowerCase() === email)) {
        errors.push('Ese correo ya está registrado.');
      }

      if (errors.length) {
        setMessage(messageBox, errors.join(' '), 'error');
        return;
      }

      let avatarData = '';
      try {
        avatarData = avatarFile ? await readFileAsDataURL(avatarFile) : '';
      } catch (err) {
        setMessage(messageBox, err.message, 'error');
        return;
      }

      const newUser = {
        name,
        surname,
        email,
        login,
        password,
        birthDate,
        avatar: avatarData,
      };

      saveUsers([...users, newUser]);
      startSession(newUser);
      form.reset();
      imageInput.value = '';
      syncSubmitState();
      setMessage(messageBox, 'Registro completado. Redirigiendo...', 'success');
      updateAuthUI();
      setTimeout(() => {
        window.location.href = 'acceso.html';
      }, 1200);
    });
  }

  function loadTips() {
    try {
      const parsed = safeParse(localStorage.getItem(TIPS_KEY), null);
      if (Array.isArray(parsed) && parsed.length) return parsed;
      const fallback = DEFAULT_TIPS.slice();
      saveTips(fallback);
      return fallback;
    } catch {
      const fallback = DEFAULT_TIPS.slice();
      saveTips(fallback);
      return fallback;
    }
  }

  function saveTips(tips) {
    try {
      localStorage.setItem(TIPS_KEY, JSON.stringify(tips));
    } catch (err) {
      console.warn('[MVAuth] No se pudo guardar consejos', err);
    }
  }

  function renderTips(listEl, tips, previewEl) {
    if (!listEl) return;
    listEl.innerHTML = '';
    const setPreview = (tip) => {
      if (!previewEl) return;
      previewEl.innerHTML = `<strong>${tip.title}</strong><br>${tip.description}`;
    };
    tips.slice(0, 3).forEach((tip) => {
      const li = document.createElement('li');
      li.style.marginBottom = '7px';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tip-link';
      button.textContent = tip.title;
      button.addEventListener('click', () => setPreview(tip));
      li.appendChild(button);
      listEl.appendChild(li);
    });
    if (tips.length && previewEl) setPreview(tips[0]);
  }

  function initTipsSection() {
    const tipsList = document.getElementById('tips-list');
    const tipsForm = document.getElementById('tips-form');
    const tipsPreview = document.getElementById('tips-preview');
    if (!tipsList && !tipsForm) return;

    let tipsData = loadTips();
    renderTips(tipsList, tipsData, tipsPreview);

    if (!tipsForm) return;
    const titleInput = tipsForm.querySelector('#tip-title');
    const descriptionInput = tipsForm.querySelector('#tip-description');
    const messageEl = document.getElementById('tips-message');

    tipsForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const errors = [];
      const title = (titleInput?.value || '').trim();
      const description = (descriptionInput?.value || '').trim();
      if (title.length < 15) errors.push('El título necesita al menos 15 caracteres.');
      if (description.length < 30) errors.push('La descripción necesita al menos 30 caracteres.');

      if (errors.length) {
        setMessage(messageEl, errors.join(' '), 'error');
        return;
      }

      const newTip = { title, description, url: '#' };
      tipsData = [newTip, ...tipsData].slice(0, 20);
      saveTips(tipsData);
      renderTips(tipsList, tipsData, tipsPreview);
      setMessage(messageEl, 'Consejo añadido correctamente.', 'success');
      tipsForm.reset();
    });
  }

  function enforceProtectedPage() {
    const requiresAuth = document.body?.dataset?.requiresAuth === 'true';
    if (!requiresAuth) return;
    const session = getSession();
    if (!session) {
      alert('Debes iniciar sesión para acceder a esta página.');
      window.location.href = 'mochileros_viajeros.html';
      return;
    }
  }

  function performLogout() {
    clearSession();
    updateAuthUI(null);
    window.location.href = 'mochileros_viajeros.html';
  }

  function initLogoutFlow() {
    const buttons = document.querySelectorAll('[data-action="logout"]');
    if (!buttons.length) return;
    const modal = document.getElementById('logout-modal');
    if (!modal) {
      buttons.forEach((btn) => {
        if (btn.dataset.logoutHandler) return;
        btn.dataset.logoutHandler = '1';
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          performLogout();
        });
      });
      return;
    }

    const confirmBtn = modal.querySelector('[data-confirm-logout]');
    const cancelBtn = modal.querySelector('[data-cancel-logout]');

    const openModal = () => modal.removeAttribute('hidden');
    const closeModal = () => modal.setAttribute('hidden', '');

    buttons.forEach((btn) => {
      if (btn.dataset.logoutHandler) return;
      btn.dataset.logoutHandler = '1';
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        openModal();
      });
    });

    confirmBtn?.addEventListener('click', () => {
      closeModal();
      performLogout();
    });
    cancelBtn?.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    enforceProtectedPage();
    updateAuthUI();
    initLoginForm();
    initRegisterForm();
    initTipsSection();
    initLogoutFlow();
  });
})(window);
