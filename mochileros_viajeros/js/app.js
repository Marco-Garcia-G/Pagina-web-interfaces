(function () {
  const NAME_MIN_LENGTH = 3;
  const CARD_LENGTHS = new Set([13, 15, 16, 19]);

  const digitOnly = (value = '') => value.replace(/\D/g, '');

  const isValidName = (value = '') => value.trim().length >= NAME_MIN_LENGTH;
  const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidCardNumber = (value = '') => CARD_LENGTHS.has(digitOnly(value).length);
  const isValidCVV = (value = '') => /^\d{3}$/.test(value.trim());
  const isValidExpiry = (value = '') => {
    if (!value) return false;
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) return false;
    const selected = new Date(year, month - 1, 1);
    const now = new Date();
    const current = new Date(now.getFullYear(), now.getMonth(), 1);
    return selected >= current;
  };

  const formatCardNumber = (input) => {
    if (!input) return;
    input.addEventListener('input', () => {
      const digits = digitOnly(input.value);
      const groups = digits.match(/.{1,4}/g) || [];
      input.value = groups.join(' ').trim();
    });
  };

  const ensureMessageBox = (form) => {
    let box = form.querySelector('.purchase-message');
    if (!box) {
      box = document.createElement('p');
      box.className = 'purchase-message';
      box.style.minHeight = '1.2em';
      box.style.fontSize = '0.95rem';
      box.style.margin = '4px 0 0';
      box.style.textAlign = 'center';
      form.appendChild(box);
    }
    return box;
  };

  const setMessage = (box, text, type) => {
    if (!box) return;
    box.textContent = text;
    if (!text) {
      box.style.color = '';
      return;
    }
    box.style.color = type === 'error' ? '#d32f2f' : '#2e7d32';
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.purchase-form').forEach((form) => {
      const nameInput = form.querySelector('input[name="nombre"]');
      const emailInput = form.querySelector('input[name="email"]');
      const typeSelect = form.querySelector('select[name="tipo-tarjeta"]');
      const numberInput = form.querySelector('input[name="numero-tarjeta"]');
      const holderInput = form.querySelector('input[name="nombre-titular"]');
      const expiryInput = form.querySelector('input[name="caducidad"]');
      const cvvInput = form.querySelector('input[name="cvv"]');
      const messageBox = ensureMessageBox(form);

      formatCardNumber(numberInput);

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const errors = [];

        if (!isValidName(nameInput?.value)) errors.push('El nombre debe tener al menos 3 caracteres.');
        if (!isValidEmail(emailInput?.value)) errors.push('El correo electrónico no es válido.');
        if (!typeSelect?.value) errors.push('Selecciona un tipo de tarjeta.');

        if (!isValidCardNumber(numberInput?.value)) {
          errors.push('El número de tarjeta debe tener 13, 15, 16 o 19 dígitos.');
        }

        if (!isValidName(holderInput?.value)) {
          errors.push('El titular debe tener al menos 3 caracteres.');
        }

        if (!isValidExpiry(expiryInput?.value)) {
          errors.push('La fecha de caducidad no puede estar vencida.');
        }

        if (!isValidCVV(cvvInput?.value)) {
          errors.push('El CVV debe tener 3 dígitos.');
        }

        if (errors.length) {
          setMessage(messageBox, errors.join(' '), 'error');
          alert('Revisa los datos del formulario.');
          return;
        }

        alert('Compra realizada');
        setMessage(messageBox, 'Compra realizada con éxito.', 'success');
        form.reset();
      });

      form.addEventListener('reset', () => {
        setMessage(messageBox, '', 'info');
      });
    });
  });
})();
