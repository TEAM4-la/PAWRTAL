// Lightweight mock Base44 client so the UI can run locally.
// Replace this with the real SDK-backed implementation when wiring to your backend.

const getStoredRole = () => (typeof window !== 'undefined' ? window.sessionStorage.getItem('pawrtal_role') : null) || 'owner';
const getStoredEmail = () => (typeof window !== 'undefined' ? window.sessionStorage.getItem('pawrtal_email') : null) || 'demo@example.com';

function mockUser(role) {
  const email = getStoredEmail();
  const isVet = role === 'vet';
  const isAdmin = role === 'admin';
  return {
    id: `demo-${role || 'user'}`,
    email: email || 'demo@example.com',
    full_name: isVet ? 'Dr. Jane Smith' : isAdmin ? 'Clinic Admin' : 'Demo Pet Owner',
    user_type: isVet ? 'veterinarian' : isAdmin ? 'admin' : 'owner',
    phone: '',
    address: '',
    avatar_url: null,
    notification_preferences: { email: true, appointments: true, vaccinations: true, medications: true },
  };
}

export const base44 = {
  auth: {
    async me() {
      const role = getStoredRole();
      return mockUser(role);
    },
    async updateMe(data) {
      // Stub: in a real app this would persist to backend
      return { ...mockUser(getStoredRole()), ...data };
    },
    async logout(redirectUrl) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('pawrtal_role');
        window.sessionStorage.removeItem('pawrtal_email');
        if (redirectUrl) window.location.href = redirectUrl;
      }
    },
    redirectToLogin(redirectUrl) {
      if (typeof window !== 'undefined') window.location.href = '/sign-in';
    },
  },
  entities: {
    Pet: {
      async filter(opts = {}) {
        if (opts.id) return [{ id: opts.id, name: 'Demo Pet', species: 'dog', owner_email: getStoredEmail() }];
        return [];
      },
      async list(order, limit = 100) {
        return [];
      },
    },
    Appointment: {
      async filter() {
        return [];
      },
      async list(order, limit = 100) {
        return [];
      },
      async update(id, data) {
        return { id, ...data };
      },
    },
    Vaccination: {
      async filter() {
        return [];
      },
      async create(data) {
        return { id: 'vax-' + Date.now(), ...data };
      },
    },
    Medication: {
      async filter() {
        return [];
      },
      async create(data) {
        return { id: 'med-' + Date.now(), ...data };
      },
    },
    Notification: {
      async filter() {
        return [];
      },
      async update(id, data) {
        return { id, ...data };
      },
    },
    JournalEntry: {
      async filter() {
        return [];
      },
      async create(data) {
        return { id: 'je-' + Date.now(), ...data };
      },
    },
    HealthRecord: {
      async list(order, limit = 100) {
        return [];
      },
      async create(data) {
        return { id: 'hr-' + Date.now(), ...data };
      },
    },
    User: {
      async filter() {
        return [];
      },
      async list(order, limit = 100) {
        return [];
      },
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        return { file_url: URL.createObjectURL(file || new Blob()) };
      },
    },
  },
  appLogs: {
    async logUserInApp(pageName) {
      console.log('[base44.appLogs.logUserInApp]', pageName);
    },
  },
};

