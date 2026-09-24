// Login form — demo only: validation + a fake "wrong credentials" alert after 1.8s.
(function() {
  const pwInput = document.getElementById('password');
  const pwToggle = document.getElementById('pwToggle');
  const eyeShow = document.getElementById('eye-show');
  const eyeHide = document.getElementById('eye-hide');

  pwToggle.addEventListener('click', () => {
    const isText = pwInput.type === 'text';
    pwInput.type = isText ? 'password' : 'text';
    eyeShow.style.display = isText ? 'block' : 'none';
    eyeHide.style.display = isText ? 'none' : 'block';
  });

  function showError(fieldId, errorId) {
    document.getElementById(fieldId).classList.add('error');
    document.getElementById(errorId).classList.add('show');
  }
  function clearError(fieldId, errorId) {
    document.getElementById(fieldId).classList.remove('error');
    document.getElementById(errorId).classList.remove('show');
  }
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  document.getElementById('email').addEventListener('input', function() {
    if (this.value && isValidEmail(this.value)) clearError('email', 'email-error');
  });
  document.getElementById('password').addEventListener('input', function() {
    if (this.value) clearError('password', 'password-error');
  });

  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const alertEl = document.getElementById('alert-error');
    let valid = true;

    alertEl.classList.remove('show');
    clearError('email', 'email-error');
    clearError('password', 'password-error');

    if (!email || !isValidEmail(email)) {
      showError('email', 'email-error');
      valid = false;
    }
    if (!password) {
      showError('password', 'password-error');
      valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('submitBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
      btn.classList.remove('loading');
      btn.disabled = false;
      alertEl.classList.add('show');
    }, 1800);
  });

  document.getElementById('forgot-link').addEventListener('click', (e) => {
    e.preventDefault();
    const alertEl = document.getElementById('alert-error');
    alertEl.classList.remove('show');
    const email = document.getElementById('email').value.trim();
    if (email && isValidEmail(email)) {
      const successEl = document.createElement('div');
      successEl.className = 'alert alert-success show';
      successEl.innerHTML = `<span class="alert-icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke="#1e7e34" stroke-width="1"/><polyline points="4,7 6.5,9.5 10,5" stroke="#1e7e34" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>Reset link sent to <strong>${email}</strong>. Check your inbox.</span>`;
      alertEl.after(successEl);
      setTimeout(() => successEl.remove(), 5000);
    } else {
      document.getElementById('email-error').textContent = 'Enter your email address first.';
      showError('email', 'email-error');
    }
  });
})();
