// Utilidades de autenticación para Mochileros Viajeros
(function (global) {
  const USERS_KEY = 'mv_users';
  const SESSION_KEY = 'mv_session';

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

    if (session) {
      const displayName = getDisplayName(session);
      if (greetingWrapper) {
        greetingWrapper.hidden = false;
        if (nameTarget) nameTarget.textContent = displayName;
      }
      if (loginLink) loginLink.hidden = true;
      if (sidebarName) sidebarName.textContent = displayName || 'Usuario';
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
        return;
      }

      startSession(user);
      const nameToShow = user.name || user.login || user.email;
      setMessage(messageBox, `¡Bienvenido ${nameToShow}!`, 'success');
      form.reset();
      updateAuthUI();
    });
  }

  function initRegisterForm() {
    const form = document.getElementById('register-form');
    if (!form) return;

    const messageBox = document.getElementById('register-message');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = form.querySelector('#nombre')?.value.trim() || '';
      const surname = form.querySelector('#apellidos')?.value.trim() || '';
      const email = form.querySelector('#correo')?.value.trim().toLowerCase() || '';
      const emailConfirm = form.querySelector('#correo2')?.value.trim().toLowerCase() || '';
      const birthDate = form.querySelector('#fecha')?.value || '';
      const login = form.querySelector('#login')?.value.trim() || '';
      const password = form.querySelector('#password')?.value || '';
      const privacy = form.querySelector('#privacidad')?.checked || false;

      setMessage(messageBox, '', 'info');

      if (!name || !surname || !email || !emailConfirm || !birthDate || !login || !password) {
        setMessage(messageBox, 'Completa todos los campos requeridos.', 'error');
        return;
      }

      if (email !== emailConfirm) {
        setMessage(messageBox, 'Los correos electrónicos no coinciden.', 'error');
        return;
      }

      if (!privacy) {
        setMessage(messageBox, 'Debes aceptar la política de privacidad.', 'error');
        return;
      }

      const users = loadUsers();
      if (users.some((user) => user.email.toLowerCase() === email)) {
        setMessage(messageBox, 'Ese correo ya está registrado.', 'error');
        return;
      }

      const newUser = {
        name,
        surname,
        email,
        login,
        password,
        birthDate,
      };

      saveUsers([...users, newUser]);
      startSession(newUser);
      form.reset();
      setMessage(messageBox, 'Registro completado. Redirigiendo...', 'success');
      updateAuthUI();
      setTimeout(() => {
        window.location.href = 'acceso.html';
      }, 1200);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    initLoginForm();
    initRegisterForm();

    document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        clearSession();
        updateAuthUI(null);
        if (window.location.pathname.includes('acceso.html')) {
          window.location.reload();
        } else {
          window.location.href = 'mochileros_viajeros.html';
        }
      });
    });
  });
})(window);
