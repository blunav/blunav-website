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

// Mobile nav drawer
(function() {
  const toggle = document.querySelector('.nav-toggle');
  const navInner = document.querySelector('.nav-inner');
  if (!toggle || !navInner) return;

  const mobileMq = window.matchMedia('(max-width: 768px)');

  function setOpen(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) {
      navInner.querySelectorAll('.nav-item.is-open').forEach(el => el.classList.remove('is-open'));
    }
  }

  toggle.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('menu-open'));
  });

  navInner.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && document.body.classList.contains('menu-open')) {
      setOpen(false);
    }
  });

  navInner.querySelectorAll('.nav-item > button.nav-link').forEach(navBtn => {
    navBtn.addEventListener('click', (e) => {
      if (!mobileMq.matches) return;
      e.preventDefault();
      const item = navBtn.closest('.nav-item');
      const wasOpen = item.classList.contains('is-open');
      navInner.querySelectorAll('.nav-item.is-open').forEach(el => el.classList.remove('is-open'));
      if (!wasOpen) item.classList.add('is-open');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setOpen(false);
    }
  });

  mobileMq.addEventListener('change', (e) => {
    if (!e.matches) setOpen(false);
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
