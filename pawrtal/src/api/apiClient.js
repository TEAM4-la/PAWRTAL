const getStoredEmail = () =>
  (typeof window !== 'undefined'
    ? window.sessionStorage.getItem('pawrtal_email')
    : null) || 'demo@example.com';

const getStoredRole = () =>
  (typeof window !== 'undefined'
    ? window.sessionStorage.getItem('pawrtal_role')
    : null) || 'owner'; // owner | vet | admin

/** Trimmed VITE_API_BASE_URL, or '' to use same origin (Vite proxy → backend in dev). */
function getApiBaseUrl() {
  const raw =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL != null
      ? String(import.meta.env.VITE_API_BASE_URL)
      : '';
  return raw.trim();
}

function buildRequestUrl(path, query) {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const segment = path.startsWith('/') ? path : `/${path}`;
  const href = base
    ? new URL(`${base}${segment}`).href
    : new URL(segment, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').href;
  const url = new URL(href);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function extractApiErrorMessage(status, data, rawText) {
  if (data && typeof data === 'object') {
    if (typeof data.error === 'string') return data.error;
    if (typeof data.title === 'string' && data.title) return data.title;
    if (typeof data.detail === 'string' && data.detail) return data.detail;
    if (typeof data.message === 'string' && data.message) return data.message;
    if (data.errors && typeof data.errors === 'object') {
      const parts = Object.entries(data.errors).flatMap(([k, v]) =>
        Array.isArray(v) ? v.map((x) => `${k}: ${x}`) : [`${k}: ${v}`]
      );
      if (parts.length) return parts.join(' ');
    }
  }
  if (rawText && rawText.length < 400 && !rawText.trim().startsWith('<')) return rawText.trim();
  return `Request failed (HTTP ${status}).`;
}

async function http(path, { method = 'GET', query, body, headers, isFormData, skipAuthHeaders = false } = {}) {
  const url = buildRequestUrl(path, query);

  const email = getStoredEmail();
  const role = getStoredRole();
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(skipAuthHeaders
          ? {}
          : {
              'X-User-Email': email,
              'X-User-Role': role,
            }),
        ...(headers || {}),
      },
      body: body
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
    });
  } catch (e) {
    const name = e && typeof e === 'object' && 'name' in e ? e.name : '';
    const baseHint = getApiBaseUrl() || (typeof window !== 'undefined' ? `${window.location.origin} (via /api proxy)` : '');
    if (name === 'TypeError' || (e && String(e.message || '').includes('Failed to fetch'))) {
      throw new Error(
        `Cannot reach the API (${baseHint}). In a second terminal, from the React folder run: npm run dev:api ` +
          `(starts http://localhost:5035). Keep that running while using npm run dev. Restart Vite after editing .env.local.`
      );
    }
    throw e instanceof Error ? e : new Error(String(e));
  }

  const rawText = await res.text();
  let data = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new Error(extractApiErrorMessage(res.status, data, rawText));
  }

  if (res.status === 204 || rawText === '') return null;
  if (data === null) {
    throw new Error(
      'Server returned non-JSON (often HTML). If the UI runs on the Vite port, set VITE_API_BASE_URL to your API or use an empty value so /api is proxied.'
    );
  }
  return data;
}

/** Map API user_type to session role header (owner | vet | admin). */
export function userTypeToRole(userType) {
  const t = String(userType || '').toLowerCase();
  if (t === 'pet_owner') return 'owner';
  if (t === 'veterinarian') return 'vet';
  if (t === 'admin') return 'admin';
  return 'owner';
}

export const api = {
  auth: {
    async me() {
      return await http('/api/auth/me');
    },
    async login({ email, password }) {
      return await http('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuthHeaders: true,
      });
    },
    async register({ email, password, full_name }) {
      return await http('/api/auth/register', {
        method: 'POST',
        body: { email, password, fullName: full_name },
        skipAuthHeaders: true,
      });
    },
    async registerStaff(body) {
      return await http('/api/auth/register-staff', {
        method: 'POST',
        body: {
          email: body.email,
          password: body.password,
          fullName: body.full_name,
          userType: body.user_type,
          licenseNumber: body.license_number,
          specialization: body.specialization,
          clinicName: body.clinic_name,
        },
      });
    },
    async updateMe(data) {
      return await http('/api/auth/me', { method: 'PUT', body: data });
    },
    async changePassword({ current_password, new_password }) {
      return await http('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword: current_password, newPassword: new_password },
      });
    },
    async logout(redirectUrl) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('pawrtal_role');
        window.sessionStorage.removeItem('pawrtal_email');
        if (redirectUrl) window.location.href = redirectUrl;
      }
    },
    redirectToLogin(redirectUrl) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectUrl || '/sign-in';
      }
    },
  },
  entities: {
    Pet: {
      async filter(opts = {}) {
        return await http('/api/pets', { query: opts });
      },
      async list(order, limit = 100) {
        return await http('/api/pets/list', { query: { order, limit } });
      },
      async create(data) {
        return await http('/api/pets', { method: 'POST', body: data });
      },
      async update(id, data) {
        return await http(`/api/pets/${id}`, { method: 'PUT', body: data });
      },
      async delete(id) {
        return await http(`/api/pets/${id}`, { method: 'DELETE' });
      },
    },
    Appointment: {
      async filter(opts = {}, order, limit) {
        return await http('/api/appointments', { query: { ...opts, order, limit } });
      },
      async list(order, limit = 100) {
        return await http('/api/appointments/list', { query: { order, limit } });
      },
      async create(data) {
        return await http('/api/appointments', { method: 'POST', body: data });
      },
      async update(id, data) {
        return await http(`/api/appointments/${id}`, { method: 'PUT', body: data });
      },
    },
    Vaccination: {
      async filter(opts = {}, order, limit) {
        return await http('/api/vaccinations', { query: { ...opts, order, limit } });
      },
      async create(data) {
        return await http('/api/vaccinations', { method: 'POST', body: data });
      },
    },
    Medication: {
      async filter(opts = {}, order, limit) {
        return await http('/api/medications', { query: { ...opts, order, limit } });
      },
      async create(data) {
        return await http('/api/medications', { method: 'POST', body: data });
      },
    },
    Notification: {
      async filter(opts = {}, order, limit) {
        return await http('/api/notifications', { query: { ...opts, order, limit } });
      },
      async update(id, data) {
        return await http(`/api/notifications/${id}`, { method: 'PUT', body: data });
      },
    },
    JournalEntry: {
      async filter(opts = {}, order) {
        return await http('/api/journal-entries', { query: { ...opts, order } });
      },
      async create(data) {
        return await http('/api/journal-entries', { method: 'POST', body: data });
      },
      async update(id, data) {
        return await http(`/api/journal-entries/${id}`, { method: 'PUT', body: data });
      },
      async delete(id) {
        return await http(`/api/journal-entries/${id}`, { method: 'DELETE' });
      },
    },
    HealthRecord: {
      async filter(opts = {}, order, limit) {
        return await http('/api/health-records', { query: { ...opts, order, limit } });
      },
      async list(order, limit = 100) {
        return await http('/api/health-records/list', { query: { order, limit } });
      },
      async create(data) {
        return await http('/api/health-records', { method: 'POST', body: data });
      },
    },
    GroomingRecord: {
      async filter(opts = {}, order, limit) {
        return await http('/api/grooming-records', { query: { ...opts, order, limit } });
      },
      async list(order, limit = 100) {
        return await http('/api/grooming-records/list', { query: { order, limit } });
      },
      async create(data) {
        return await http('/api/grooming-records', { method: 'POST', body: data });
      },
    },
    Message: {
      async filter(opts = {}, order, limit) {
        return await http('/api/messages', { query: { ...opts, order, limit } });
      },
      async conversation(userEmail, otherEmail, limit = 200) {
        return await http('/api/messages/conversation', { query: { user_email: userEmail, other_email: otherEmail, limit } });
      },
      async create(data) {
        return await http('/api/messages', { method: 'POST', body: data });
      },
      async markRead(id) {
        return await http(`/api/messages/${id}/read`, { method: 'PUT' });
      },
      async markReadBulk(senderEmail) {
        return await http('/api/messages/mark-read-bulk', { method: 'PUT', query: { sender_email: senderEmail } });
      },
      async unreadCount() {
        return await http('/api/messages/unread-count');
      },
    },
    User: {
      async filter(opts = {}) {
        return await http('/api/users', { query: opts });
      },
      async list(order, limit = 200) {
        return await http('/api/users/list', { query: { order, limit } });
      },
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const form = new FormData();
        form.append('file', file);
        return await http('/api/uploads', { method: 'POST', body: form, isFormData: true });
      },
    },
  },
  appLogs: {
    async logUserInApp(pageName) {
      // optional hook (no-op server side for now)
      console.log('[api.appLogs.logUserInApp]', pageName);
    },
  },
};

