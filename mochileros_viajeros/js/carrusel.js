// filepath: /Users/marcogarcia/Pagina-web-interfaces/Pagina-web-interfaces-1/mochileros_viajeros/js/carrusel.js

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);

  const carousels = document.querySelectorAll('.carrusel');
  carousels.forEach((carousel) => {
    carousel.classList.add('js-enabled');

    const slides = Array.from(carousel.querySelectorAll('.carrusel-slide'));
    if (!slides.length) return;

    const info = carousel.querySelector('.carrusel-pack-info');
    const titleEl = info?.querySelector('h3') || null;
    const priceEl = info?.querySelector('.price-pill') || null;

    // Prepare slides
    slides.forEach((slide) => {
      const btn = slide.querySelector('.carrusel-comprar');
      const url = slide.dataset.url;
      if (btn && url) btn.setAttribute('href', url);
    });

    let index = Math.max(0, slides.findIndex(s => s.classList.contains('active')));
    if (index === -1) index = 0;

    const setActive = (i) => {
      slides.forEach((s, k) => s.classList.toggle('active', k === i));
      const s = slides[i];
      if (s) {
        if (titleEl && s.dataset.title) titleEl.textContent = s.dataset.title;
        if (priceEl && s.dataset.price) priceEl.textContent = s.dataset.price;
      }
    };

    setActive(index);

    // --- Temporizador fiable de 2 segundos con reinicio tras cada interacción ---
    const ROTATION_MS = 2000;
    let timerId = null;
    let paused = false;

    const scheduleNext = () => {
      clearTimeout(timerId);
      if (paused) return;
      timerId = setTimeout(() => {
        index = (index + 1) % slides.length;
        setActive(index);
        scheduleNext();
      }, ROTATION_MS);
    };

    const pauseTimer = () => {
      paused = true;
      clearTimeout(timerId);
      timerId = null;
    };

    const resumeTimer = () => {
      paused = false;
      scheduleNext();
    };

    const prevBtn = carousel.querySelector('.carrusel-arrow.prev');
    const nextBtn = carousel.querySelector('.carrusel-arrow.next');

    prevBtn?.addEventListener('click', () => {
      index = (index - 1 + slides.length) % slides.length;
      setActive(index);
      resumeTimer();
    });

    nextBtn?.addEventListener('click', () => {
      index = (index + 1) % slides.length;
      setActive(index);
      resumeTimer();
    });

    carousel.addEventListener('mouseenter', pauseTimer);
    carousel.addEventListener('mouseleave', resumeTimer);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') pauseTimer();
      else resumeTimer();
    });

    // Iniciar el conteo desde 0 en la carga
    resumeTimer();
  });
});
