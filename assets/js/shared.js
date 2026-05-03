// Product suite mega-menu (nav rail/pane interaction)
(function() {
  const railItems = document.querySelectorAll('.suite-rail-item');
  const panes = document.querySelectorAll('.suite-pane');
  if (!railItems.length || !panes.length) return;

  function activate(target) {
    railItems.forEach(item => item.classList.toggle('is-active', item.getAttribute('data-pane') === target));
    panes.forEach(pane => pane.classList.toggle('is-visible', pane.getAttribute('data-pane') === target));
  }

  railItems.forEach(item => {
    item.addEventListener('mouseenter', () => activate(item.getAttribute('data-pane')));
    item.addEventListener('focus', () => activate(item.getAttribute('data-pane')));
  });
})();

// Scroll reveal
(function() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-fast').forEach(el => observer.observe(el));
  document.querySelectorAll('.reveal.visible, .reveal-fast.visible').forEach(el => el.classList.add('visible'));
})();
