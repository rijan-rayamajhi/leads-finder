export function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Take last 10 digits
  return digits.slice(-10) || null;
}

export function normalizeWebsite(website: string | null): string | null {
  if (!website) return null;
  return website
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim() || null;
}
