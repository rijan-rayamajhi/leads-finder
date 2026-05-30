export type WebsiteStatus = 'none' | 'broken' | 'weak' | 'ok';

export async function analyzeWebsite(website: string | null): Promise<{
  status: WebsiteStatus;
  hasContactForm: boolean;
  hasEmail: boolean;
  hasWeakContent: boolean;
}> {
  // If no website
  if (!website) {
    return { status: 'none', hasContactForm: false, hasEmail: false, hasWeakContent: false };
  }

  try {
    const url = website.startsWith('http') ? website : `https://${website}`;

    // Attempt HTTP GET with 5 second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return { status: 'broken', hasContactForm: false, hasEmail: false, hasWeakContent: false };
    }

    const html = await res.text();
    const lower = html.toLowerCase();

    const hasContactForm =
      lower.includes('<form') ||
      lower.includes('contact') ||
      lower.includes('whatsapp');

    const hasEmail = lower.includes('@') && lower.includes('.');

    // Weak content = very short page
    const textLength = html.replace(/<[^>]+>/g, '').trim().length;
    const hasWeakContent = textLength < 300;

    return {
      status: 'ok',
      hasContactForm,
      hasEmail,
      hasWeakContent,
    };
  } catch {
    // Network error, timeout, or DNS failure = broken
    return { status: 'broken', hasContactForm: false, hasEmail: false, hasWeakContent: false };
  }
}
