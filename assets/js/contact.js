// Contact form — preventDefault submit and show inline success state (no backend wired)
(function() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  const submitBtn = document.getElementById('contactSubmit');
  const consent = document.getElementById('cf-consent');
  if (!form || !success || !submitBtn) return;

  function updateSubmitState() { submitBtn.disabled = !consent.checked; }
  consent.addEventListener('change', updateSubmitState);
  updateSubmitState();

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.style.display = 'none';
    success.classList.add('is-visible');
    window.scrollTo({ top: success.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
  });
})();
