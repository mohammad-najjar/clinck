const $ = id => document.getElementById(id);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const json = { 'Content-Type': 'application/json' };

async function api(url, method = 'GET', body) {
  const res = await fetch('/api/admin' + url, { method, headers: json, body: body && JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { showLogin(); throw new Error('auth'); }
  if (!res.ok) { alert(data.error || 'Request failed'); throw new Error(data.error); }
  return data;
}

function showLogin() { $('app').hidden = true; $('login').hidden = false; }

$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const res = await fetch('/api/admin/login', { method: 'POST', headers: json, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
  if (!res.ok) { $('login-err').textContent = (await res.json()).error; return; }
  e.target.reset(); $('login-err').textContent = ''; start();
});

$('logout').addEventListener('click', async () => { await fetch('/api/admin/logout', { method: 'POST' }); showLogin(); });

document.querySelector('aside nav').addEventListener('click', e => {
  const tab = e.target.dataset.tab; if (!tab) return;
  document.querySelectorAll('.tab').forEach(t => (t.hidden = t.id !== tab));
  document.querySelectorAll('aside nav button').forEach(b => b.classList.toggle('on', b === e.target));
});

function cell(tr, text, cls) { const td = tr.insertCell(); td.textContent = text; if (cls) td.className = cls; }

async function loadAppointments() {
  const q = new URLSearchParams({ q: $('f-q').value, status: $('f-status').value, service: $('f-service').value, date: $('f-date').value });
  [...q.keys()].forEach(k => !q.get(k) && q.delete(k));
  const [list, stats] = await Promise.all([api('/appointments?' + q), api('/stats')]);
  $('stats').innerHTML = '';
  Object.entries(stats).forEach(([k, v]) => { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.firstChild.textContent = v; d.lastChild.textContent = k; $('stats').append(d); });
  $('rows').innerHTML = '';
  list.forEach(a => {
    const tr = $('rows').insertRow();
    cell(tr, a.date); cell(tr, a.time); cell(tr, a.name); cell(tr, a.service); cell(tr, a.status, 's-' + a.status);
    const b = document.createElement('button'); b.textContent = 'View'; b.onclick = () => openDetail(a); tr.insertCell().append(b);
  });
}

const NEXT = { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled'] };
function openDetail(a) {
  const d = $('detail'); d.innerHTML = '';
  const info = document.createElement('p');
  info.textContent = `${a.name} · ${a.phone}\n${a.service}\n${a.date} ${a.time}\nStatus: ${a.status}\nNotes: ${a.notes || 'None'}`;
  info.style.whiteSpace = 'pre-line'; d.append(info);
  (NEXT[a.status] || []).forEach(s => {
    const b = document.createElement('button'); b.textContent = s[0].toUpperCase() + s.slice(1); b.style.marginRight = '.5rem';
    b.onclick = async () => { await api('/appointments/' + a._id, 'PATCH', { status: s }); d.close(); loadAppointments(); };
    d.append(b);
  });
  const c = document.createElement('button'); c.textContent = 'Close'; c.onclick = () => d.close(); d.append(c); d.showModal();
}
['f-q', 'f-status', 'f-service', 'f-date'].forEach(id => $(id).addEventListener('input', loadAppointments));

async function loadServices() {
  const list = await api('/services');
  $('service-list').innerHTML = ''; $('f-service').length = 1;
  list.forEach(s => {
    $('f-service').add(new Option(s.name, s.name));
    const f = document.createElement('form');
    f.innerHTML = '<input name="name" required><input name="description"><label><input type="checkbox" name="active"> Shown on website</label><button>Save</button>';
    f.name.value = s.name; f.description.value = s.description; f.active.checked = s.active;
    f.onsubmit = async e => { e.preventDefault(); await api('/services/' + s._id, 'PUT', { name: f.name.value, description: f.description.value, active: f.active.checked }); loadServices(); };
    $('service-list').append(f);
  });
}
$('service-new').addEventListener('submit', async e => { e.preventDefault(); await api('/services', 'POST', Object.fromEntries(new FormData(e.target))); e.target.reset(); loadServices(); });

async function loadSettings() {
  const s = await api('/settings'), f = $('settings-form');
  ['startTime', 'endTime', 'slotMinutes', 'phone', 'address'].forEach(k => (f[k].value = s[k]));
  $('days').innerHTML = '';
  DAYS.forEach((name, i) => { const l = document.createElement('label'); l.innerHTML = '<input type="checkbox"> '; l.firstChild.value = i; l.firstChild.checked = s.closedDays.includes(i); l.append(name); $('days').append(l); });
}
$('settings-form').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target;
  const closedDays = [...$('days').querySelectorAll('input:checked')].map(i => Number(i.value));
  await api('/settings', 'PUT', { startTime: f.startTime.value, endTime: f.endTime.value, slotMinutes: f.slotMinutes.value, phone: f.phone.value, address: f.address.value, closedDays });
  $('settings-msg').textContent = 'Saved.';
});

async function start() {
  try { await api('/me'); } catch { return; }
  $('login').hidden = true; $('app').hidden = false;
  await loadServices(); loadAppointments(); loadSettings();
}
start();
