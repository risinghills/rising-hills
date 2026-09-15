const header = document.querySelector('.site-header');

const updateHeader = () => {
  header?.classList.toggle('scrolled', window.scrollY > 24);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const contactForm = document.querySelector('.contact-form');
const formStatus = document.querySelector('.form-status');

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const formData = new FormData(contactForm);
  const payload = Object.fromEntries(formData.entries());
  payload.consent = formData.has('consent');

  if (submitButton) submitButton.disabled = true;
  if (formStatus) {
    formStatus.className = 'form-status';
    formStatus.textContent = '문의를 전송하고 있습니다.';
  }

  try {
    const result = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await result.json();
    if (!result.ok) throw new Error(data.message || '문의 전송에 실패했습니다.');

    contactForm.reset();
    if (formStatus) {
      formStatus.className = 'form-status is-success';
      formStatus.textContent = data.message;
    }
  } catch (error) {
    if (formStatus) {
      formStatus.className = 'form-status is-error';
      formStatus.textContent = error.message || '문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
    }
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});
