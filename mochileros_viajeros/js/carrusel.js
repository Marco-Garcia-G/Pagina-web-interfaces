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
      if (btn && url) {
        btn.setAttribute('href', url);
        btn.addEventListener('click', () => {
          try { sessionStorage.setItem('mvPurchaseEntry', '1'); } catch {}
        });
      }
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

    const ROTATION_MS = 1500;

    let timer = setInterval(() => {
      index = (index + 1) % slides.length;
      setActive(index);
    }, ROTATION_MS);

    const resetTimer = () => {
      clearInterval(timer);
      timer = setInterval(() => {
        index = (index + 1) % slides.length;
        setActive(index);
      }, ROTATION_MS);
    };

    const prevBtn = carousel.querySelector('.carrusel-arrow.prev');
    const nextBtn = carousel.querySelector('.carrusel-arrow.next');

    prevBtn?.addEventListener('click', () => { index = (index - 1 + slides.length) % slides.length; setActive(index); resetTimer(); });
    nextBtn?.addEventListener('click', () => { index = (index + 1) % slides.length; setActive(index); resetTimer(); });

    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', () => resetTimer());
  });
});
