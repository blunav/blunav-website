// Contact form — submits to FormSubmit.co via AJAX; inline success / error states.
(function () {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  const submitBtn = document.getElementById('contactSubmit');
  const consent = document.getElementById('cf-consent');
  if (!form || !success || !submitBtn) return;

  function updateSubmitState() { submitBtn.disabled = !consent.checked; }
  consent.addEventListener('change', updateSubmitState);
  updateSubmitState();

  let errorEl = null;
  function clearError() { if (errorEl) { errorEl.remove(); errorEl = null; } }
  function showError(msg) {
    clearError();
    errorEl = document.createElement('p');
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = msg;
    errorEl.style.cssText = 'margin-top:14px;padding:10px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;color:#dc2626;font-size:13px;line-height:1.5;';
    submitBtn.insertAdjacentElement('afterend', errorEl);
  }

  const originalBtnHTML = submitBtn.innerHTML;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    clearError();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error('Server returned ' + res.status);
      form.style.display = 'none';
      success.classList.add('is-visible');
      window.scrollTo({
        top: success.getBoundingClientRect().top + window.scrollY - 100,
        behavior: 'smooth',
      });
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
      showError("Something went wrong sending your message. Please try again, or email info@blunav.in directly.");
    }
  });
})();
