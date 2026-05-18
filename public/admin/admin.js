const userIdInput = document.getElementById('userId');
const premiumDaysInput = document.getElementById('premiumDays');
const checkBtn = document.getElementById('checkBtn');
const grantBtn = document.getElementById('grantBtn');
const resultCard = document.getElementById('resultCard');
const resultOutput = document.getElementById('resultOutput');
const refreshListBtn = document.getElementById('refreshListBtn');
const listLoading = document.getElementById('listLoading');
const subscriptionsTable = document.getElementById('subscriptionsTable');
const toast = document.getElementById('toast');

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

function showResult(data) {
  resultCard.hidden = false;
  resultOutput.textContent = JSON.stringify(data, null, 2);
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Требуется авторизация');
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    payload = { error: await res.text() };
  }

  if (!res.ok) {
    throw new Error(payload.error || `HTTP ${res.status}`);
  }

  return payload;
}

function requireUserId() {
  const userId = userIdInput.value.trim();
  if (!userId) {
    showToast('Укажите User ID', true);
    return null;
  }
  return userId;
}

async function checkUser() {
  const userId = requireUserId();
  if (!userId) return;

  checkBtn.disabled = true;
  try {
    const data = await apiFetch(`/admin/api/subscription/${encodeURIComponent(userId)}`);
    showResult(data);
    showToast(data.message || 'Статус получен');
  } catch (err) {
    showToast(err.message, true);
  } finally {
    checkBtn.disabled = false;
  }
}

async function grantPremium() {
  const userId = requireUserId();
  if (!userId) return;

  const days = Number(premiumDaysInput.value) || 31;
  if (!confirm(`Выдать премиум на ${days} дн. пользователю ${userId}?`)) {
    return;
  }

  grantBtn.disabled = true;
  try {
    const data = await apiFetch('/admin/api/grant-premium', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, days }),
    });
    showResult(data);
    showToast(data.message || 'Премиум выдан');
    await loadSubscriptions();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    grantBtn.disabled = false;
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ru-RU');
  } catch {
    return iso;
  }
}

async function loadSubscriptions() {
  listLoading.classList.remove('hidden');
  refreshListBtn.disabled = true;

  try {
    const data = await apiFetch('/admin/api/subscriptions');
    const tbody = subscriptionsTable.querySelector('tbody');
    tbody.innerHTML = '';

    for (const row of data.subscriptions || []) {
      const tr = document.createElement('tr');
      const premium = row.isPremium || row.is_premium;
      tr.innerHTML = `
        <td><code>${row.user_id}</code></td>
        <td><span class="badge ${premium ? 'badge-yes' : 'badge-no'}">${premium ? 'Да' : 'Нет'}</span></td>
        <td>${formatDate(row.expires_at)}</td>
        <td>${row.payment_id || '—'}</td>
      `;
      tr.addEventListener('click', () => {
        userIdInput.value = row.user_id;
      });
      tbody.appendChild(tr);
    }
  } catch (err) {
    showToast(err.message, true);
  } finally {
    listLoading.classList.add('hidden');
    refreshListBtn.disabled = false;
  }
}

checkBtn.addEventListener('click', checkUser);
grantBtn.addEventListener('click', grantPremium);
refreshListBtn.addEventListener('click', loadSubscriptions);

loadSubscriptions();
