export type WebsiteStatus = 'none' | 'broken' | 'weak' | 'ok';

export type ProblemDetail = {
  primary: string;
  secondary: string[];
  confidence: number;
};

export async function analyzeWebsite(
  website: string | null,
  reviewsList?: Array<{ text: string; rating?: number }> | null
): Promise<{
  status: WebsiteStatus;
  hasContactForm: boolean;
  hasEmail: boolean;
  hasWeakContent: boolean;
  html?: string;
  problems: ProblemDetail;
  extractedEmail: string | null;
}> {
  // Flag tracking for review complaints
  let missedCalls = false;
  let poorService = false;

  // Scan reviews for complaints
  if (reviewsList && Array.isArray(reviewsList)) {
    for (const r of reviewsList) {
      const text = (r.text || '').toLowerCase();
      const rating = r.rating || 5;

      if (rating <= 2) {
        if (
          text.includes('call') ||
          text.includes('phone') ||
          text.includes('answer') ||
          text.includes('reach') ||
          text.includes('response') ||
          text.includes('unresponsive') ||
          text.includes('voicemail')
        ) {
          missedCalls = true;
        }

        if (
          text.includes('service') ||
          text.includes('rude') ||
          text.includes('terrible') ||
          text.includes('bad') ||
          text.includes('unprofessional') ||
          text.includes('disappointed') ||
          text.includes('poor')
        ) {
          poorService = true;
        }
      }
    }
  }

  // Helper to compile problems
  const compileProblems = (
    status: WebsiteStatus,
    hasContactForm: boolean,
    hasWeakContent: boolean
  ): ProblemDetail => {
    const detected: string[] = [];

    if (status === 'none' || status === 'broken') {
      detected.push('no_online_presence');
    }

    if (missedCalls) {
      detected.push('missed_calls');
    }

    if (!hasContactForm) {
      detected.push('no_lead_capture');
    }

    if (hasWeakContent) {
      detected.push('low_seo_content');
    }

    if (poorService) {
      detected.push('poor_service');
    }

    let primary = 'none';
    let secondary: string[] = [];
    let confidence = 1.0;

    if (detected.length > 0) {
      primary = detected[0];
      secondary = detected.slice(1);

      // Determine confidence based on the primary issue:
      if (primary === 'no_online_presence') {
        confidence = 1.0;
      } else if (primary === 'no_lead_capture') {
        confidence = 0.9;
      } else if (primary === 'low_seo_content') {
        confidence = 0.85;
      } else if (primary === 'missed_calls' || primary === 'poor_service') {
        confidence = 0.8;
      }
    }

    return {
      primary,
      secondary,
      confidence,
    };
  };

  // If no website
  if (!website) {
    return {
      status: 'none',
      hasContactForm: false,
      hasEmail: false,
      hasWeakContent: true,
      problems: compileProblems('none', false, true),
      extractedEmail: null,
    };
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
      return {
        status: 'broken',
        hasContactForm: false,
        hasEmail: false,
        hasWeakContent: true,
        problems: compileProblems('broken', false, true),
        extractedEmail: null,
      };
    }

    const html = await res.text();

    // FIX 1 — Real email extraction
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = html.match(emailRegex);
    // Filter out common false positives
    const filtered = (emailMatches || []).filter(e =>
      !e.includes('example.com') &&
      !e.includes('yourdomain') &&
      !e.includes('domain.com') &&
      !e.includes('email.com') &&
      !e.endsWith('.png') &&
      !e.endsWith('.jpg')
    );
    const extractedEmail = filtered.length > 0 ? filtered[0] : null;
    const hasEmail = extractedEmail !== null;

    // FIX 2 — Better contact form detection
    const hasFormTag = html.includes('<form');
    const hasInputInForm = html.includes('<input') && html.includes('<form');
    const hasWhatsAppLink = html.includes('wa.me') || html.includes('whatsapp.com/send');
    const hasContactForm = (hasFormTag && hasInputInForm) || hasWhatsAppLink;

    // Weak content = very short page
    const textLength = html.replace(/<[^>]+>/g, '').trim().length;
    const hasWeakContent = textLength < 300;

    return {
      status: 'ok',
      hasContactForm,
      hasEmail,
      hasWeakContent,
      html,
      problems: compileProblems('ok', hasContactForm, hasWeakContent),
      extractedEmail,
    };
  } catch {
    // Network error, timeout, or DNS failure = broken
    return {
      status: 'broken',
      hasContactForm: false,
      hasEmail: false,
      hasWeakContent: true,
      problems: compileProblems('broken', false, true),
      extractedEmail: null,
    };
  }
}
