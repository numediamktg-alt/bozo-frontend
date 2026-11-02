(() => {
  if (location.hostname === 'thisoldhippie.com' || location.hostname === 'www.thisoldhippie.com') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', 'G-7B7R3WVPJW');
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=G-7B7R3WVPJW';
    document.head.appendChild(tag);
  }
  const form = document.getElementById('newsletter');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button');
    const status = document.getElementById('newsletter-status');
    button.disabled = true;
    status.textContent = 'Signing you up…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const email = document.getElementById('email').value.trim();
      const response = await fetch('https://toh-subscribe.chuck-3ba.workers.dev/subscribe?email=' + encodeURIComponent(email) + '&source=homepage', {signal: controller.signal});
      if (!response.ok) throw new Error('Subscription failed');
      const body = await response.text();
      if (body.trim().startsWith('{')) {
        const data = JSON.parse(body);
        if (data.error || data.success === false || data.ok === false) throw new Error('Subscription rejected');
      }
      status.textContent = 'Thank you. Your signup was received. Check your inbox for any confirmation steps.';
      form.reset();
    } catch (_) {
      status.textContent = 'We couldn’t confirm your signup. Please try again in a moment, or use Contact Chuck below.';
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
    }
  });
  try {
    const email = (localStorage.getItem('bozo_email') || '').trim().toLowerCase();
    if (['chuck@chuckjonesphotography.com', 'editor@thecameraforum.com'].includes(email)) document.getElementById('admin-link').hidden = false;
  } catch (_) { /* Navigation remains available when storage is disabled. */ }
})();
