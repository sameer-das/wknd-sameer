import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * carousel block
 *
 * A simple, accessible image carousel. Each block row holds one slide image.
 * Renders a horizontal scroll-snap track with clickable Previous/Next buttons
 * and indicator dots. Prev/Next scroll the track by one slide; the active dot
 * and button state update as slides come into view.
 *
 * Initial content structure (one image per row):
 *   | carousel |
 *   | <img>    |
 *   | <img>    |
 */

let carouselId = 0;

function updateActive(block, index) {
  const slides = block.querySelectorAll('.carousel-slide');
  const dots = block.querySelectorAll('.carousel-dot');
  const total = slides.length;
  block.dataset.activeSlide = index;

  slides.forEach((slide, i) => {
    slide.setAttribute('aria-hidden', i !== index ? 'true' : 'false');
  });
  dots.forEach((dot, i) => {
    const active = i === index;
    dot.setAttribute('aria-selected', active ? 'true' : 'false');
    dot.setAttribute('tabindex', active ? '0' : '-1');
  });

  const prev = block.querySelector('.carousel-prev');
  const next = block.querySelector('.carousel-next');
  if (prev) prev.disabled = index <= 0;
  if (next) next.disabled = index >= total - 1;
}

function showSlide(block, index) {
  const slides = block.querySelectorAll('.carousel-slide');
  const clamped = Math.max(0, Math.min(index, slides.length - 1));
  const track = block.querySelector('.carousel-track');
  track.scrollTo({ left: slides[clamped].offsetLeft - track.offsetLeft, behavior: 'smooth' });
  updateActive(block, clamped);
}

export default function decorate(block) {
  carouselId += 1;
  const id = carouselId;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Image gallery');

  // Collect the images from the authored rows into slides. The track/slides use
  // <div>s (not <ul>/<li>) so the ARIA carousel roles (group/slide) are valid —
  // role="group" is not allowed on a list item, and role-bearing children make
  // a <ul> an invalid list (both flagged by axe/Lighthouse).
  const rows = [...block.children];
  const track = document.createElement('div');
  track.className = 'carousel-track';

  rows.forEach((row, i) => {
    const img = row.querySelector('img');
    if (!img) return;
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.id = `carousel-${id}-slide-${i}`;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${rows.length}`);
    const optimized = createOptimizedPicture(img.src, img.alt, i === 0, [{ width: '1200' }]);
    slide.append(optimized);
    track.append(slide);
  });

  const slideCount = track.children.length;
  block.replaceChildren(track);
  if (slideCount === 0) return;

  // Single image: no controls needed.
  if (slideCount === 1) {
    updateActive(block, 0);
    return;
  }

  // Prev / Next controls
  const nav = document.createElement('div');
  nav.className = 'carousel-nav';
  nav.innerHTML = `
    <button type="button" class="carousel-prev" aria-label="Previous slide"></button>
    <button type="button" class="carousel-next" aria-label="Next slide"></button>`;
  block.append(nav);

  // Indicator dots
  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Choose slide to display');
  for (let i = 0; i < slideCount; i += 1) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.dataset.slide = i;
    dot.addEventListener('click', () => showSlide(block, i));
    dots.append(dot);
  }
  block.append(dots);

  const prev = nav.querySelector('.carousel-prev');
  const next = nav.querySelector('.carousel-next');
  prev.addEventListener('click', () => showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1));
  next.addEventListener('click', () => showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1));

  // Keyboard: arrow keys move slides when focus is within the carousel.
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { showSlide(block, parseInt(block.dataset.activeSlide || '0', 10) - 1); e.preventDefault(); }
  });

  // Keep the active slide/dots in sync when the user scrolls/swipes the track.
  const track2 = block.querySelector('.carousel-track');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const slides = [...block.querySelectorAll('.carousel-slide')];
        updateActive(block, slides.indexOf(entry.target));
      }
    });
  }, { root: track2, threshold: 0.6 });
  block.querySelectorAll('.carousel-slide').forEach((s) => observer.observe(s));

  updateActive(block, 0);
}
