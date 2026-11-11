const form = document.getElementById('booking-form');
const slotsBox = document.getElementById('slots');
const msg = document.getElementById('form-msg');
const api = (url, opts) => fetch(url, opts).then(async r => ({ ok: r.ok, data: await r.json() }));

function showMessage(text, isError) {
  msg.textContent = text;
  msg.className = isError ? 'error' : '';
  msg.hidden = false;
}

function showErrors(errors = {}) {
  document.querySelectorAll('.err').forEach(el => (el.textContent = errors[el.dataset.for] || ''));
}

async function loadServices() {
  const { data } = await api('/api/services');
  const list = document.getElementById('treatment-list');
  list.innerHTML = '';
  form.service.innerHTML = '<option value="">Choose a treatment</option>';
  data.forEach(s => {
    const li = document.createElement('li');
    const name = document.createElement('strong'); name.textContent = s.name;
    const desc = document.createElement('span'); desc.textContent = s.description;
    li.append(name, desc);
    list.append(li);
    form.service.add(new Option(s.name, s.name));
  });
}

async function loadSlots() {
  if (!form.date.value) return;
  slotsBox.innerHTML = '<p class="muted">Checking availability…</p>';
  const { ok, data } = await api(`/api/slots?date=${form.date.value}`);
  slotsBox.innerHTML = '';
  if (!ok || !data.slots.length) { slotsBox.innerHTML = '<p class="muted">No times available on this date. Please choose another.</p>'; return; }
  data.slots.forEach(t => {
    const label = document.createElement('label');
    label.innerHTML = '<input type="radio" name="time"><span></span>';
    label.querySelector('input').value = t;
    label.querySelector('span').textContent = t;
    slotsBox.append(label);
  });
}

function validate(v) {
  const errors = {};
  if (!v.service) errors.service = 'Choose a treatment.';
  if (!v.date) errors.date = 'Choose a date.';
  if (!v.time) errors.time = 'Choose a time.';
  if (v.name.trim().length < 2) errors.name = 'Enter your full name.';
  if (!/^\+?[\d\s-]{7,15}$/.test(v.phone.trim())) errors.phone = 'Enter a valid phone number.';
  return errors;
}

form.date.min = new Date().toLocaleDateString('en-CA');
form.date.addEventListener('change', loadSlots);

form.addEventListener('submit', async e => {
  e.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  values.time ||= '';
  const errors = validate(values);
  showErrors(errors);
  if (Object.keys(errors).length) return showMessage('Please check the highlighted fields.', true);

  const btn = form.querySelector('button');
  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    const { ok, data } = await api('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    if (ok) { form.reset(); slotsBox.innerHTML = '<p class="muted">Choose a date to see times.</p>'; showErrors(); showMessage(data.message, false); }
    else { showErrors(data.errors); showMessage(data.error, true); if (data.errors?.time) loadSlots(); }
  } catch {
    showMessage('Could not reach the server. Please check your connection and try again.', true);
  } finally {
    btn.disabled = false; btn.textContent = 'Send request';
  }
});

loadServices();
api('/api/clinic').then(({ data }) => {
  if (data.phone || data.address) document.getElementById('contact-info').textContent = [data.phone, data.address].filter(Boolean).join(' · ');
});
