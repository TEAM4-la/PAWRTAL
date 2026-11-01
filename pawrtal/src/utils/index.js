import { parse, isPast } from 'date-fns';

/**
 * Build a path for a page name (and optional query).
 * e.g. createPageUrl('HealthRecords') -> '/health-records'
 *      createPageUrl('PetProfile?id=123') -> '/pet-profile?id=123'
 */
export function createPageUrl(pageSpec) {
  const [pageName, query] = String(pageSpec).split('?')
  const pathSegment = pageName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
  const path = pathSegment === 'welcome' ? '/' : `/${pathSegment}`
  return query ? `${path}?${query}` : path
}

export function getAppointmentStatus(appointment) {
  let derivedStatus = appointment.status;
  if (derivedStatus === 'pending') {
    try {
      const appointmentDateTime = parse(`${appointment.date} ${appointment.time}`, 'yyyy-MM-dd hh:mm a', new Date());
      if (isPast(appointmentDateTime)) {
        derivedStatus = 'expired';
      }
    } catch (e) {
      console.error('Error parsing appointment datetime:', e);
    }
  }
  return derivedStatus;
}

/**
 * Format a veterinarian or specialist's name with proper "Dr." prefix.
 * e.g. "Solangon" -> "Dr. Solangon"
 *      "Dr. Solangon" -> "Dr. Solangon"
 *      null, "Solangon@pawrtal.com" -> "Dr. Solangon"
 */
export function formatDoctorName(name, email) {
  if (name && typeof name === 'string' && name.trim()) {
    const clean = name.trim().replace(/^(dr\.?\s*)+/i, '').trim();
    if (clean) {
      return `Dr. ${clean}`;
    }
  }
  if (email && typeof email === 'string' && email.trim()) {
    let prefix = email.split('@')[0];
    prefix = prefix.replace(/^(dr\.?\s*)+/i, '').trim();
    if (prefix) {
      const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      return `Dr. ${capitalized}`;
    }
  }
  return null;
}

/**
 * Clean up notification message to eliminate duplicate 'Dr. Dr.' or similar artifacts
 */
export function cleanNotificationMessage(msg) {
  if (!msg || typeof msg !== 'string') return msg;
  return msg.replace(/(dr\.?\s*){2,}/gi, 'Dr. ');
}
