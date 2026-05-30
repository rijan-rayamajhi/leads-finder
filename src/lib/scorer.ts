import { analyzeWebsite } from './analyzer';

export type ScoreResult = {
  score: number;
  reason: string;
};

export async function scoreLead(website: string | null): Promise<ScoreResult> {
  const analysis = await analyzeWebsite(website);

  let score = 0;
  const reasons: string[] = [];

  if (analysis.status === 'none') {
    score += 60;
    reasons.push('No website');
  } else if (analysis.status === 'broken') {
    score += 40;
    reasons.push('Broken website');
  }

  if (!analysis.hasContactForm) {
    score += 15;
    reasons.push('No contact form');
  }

  if (!analysis.hasEmail) {
    score += 10;
    reasons.push('No email');
  }

  if (analysis.hasWeakContent) {
    score += 10;
    reasons.push('Weak content');
  }

  return {
    score,
    reason: reasons.join(', ') || 'Site looks OK',
  };
}
