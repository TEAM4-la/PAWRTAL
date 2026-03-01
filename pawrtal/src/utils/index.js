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
