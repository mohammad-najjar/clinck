const header = document.getElementById('header');
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function setMenu(open) {
  menu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
}
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', e => e.target.closest('a') && setMenu(false));

const observer = new IntersectionObserver((entries, obs) => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
}), { threshold: 0.15 });
document.querySelectorAll('.reveal, .reveal-image').forEach(el => observer.observe(el));

const parallax = document.querySelectorAll('[data-parallax]');
let ticking = false;
addEventListener('scroll', () => {
  header.classList.toggle('scrolled', scrollY > 30);
  if (reduced || ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    parallax.forEach(el => (el.style.transform = `translateY(${scrollY * el.dataset.parallax}px)`));
    ticking = false;
  });
}, { passive: true });

document.getElementById('year').textContent = new Date().getFullYear();
