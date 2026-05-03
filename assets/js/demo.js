// Demo form — preventDefault submit and show inline success state (no backend wired)
(function() {
  // Prevent info-icon clicks from toggling the parent checkbox label
  document.querySelectorAll('.demo-check-info').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
  });

  const form = document.getElementById('demoForm');
  const success = document.getElementById('demoSuccess');
  const submitBtn = document.getElementById('demoSubmit');
  const consent = document.getElementById('df-consent');
  if (!form || !success || !submitBtn) return;

  function updateSubmitState() {
    submitBtn.disabled = !consent.checked;
  }
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
