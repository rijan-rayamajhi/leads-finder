import { analyzeWebsite } from './analyzer';

export type ScoreResult = {
  opportunityScore: number;       // raw digital gap points (pre-norm)
  revenueScore: number;           // raw revenue points (pre-norm)
  contactScore: number;           // raw contact points (pre-norm)
  intentScore: number;            // raw intent points (pre-norm)
  digitalGapNorm: number;         // normalized 0–100
  revenueNorm: number;            // normalized 0–100
  contactNorm: number;            // normalized 0–100
  intentNorm: number;             // normalized 0–100
  finalScore: number;             // weighted final 0–100
  tier: 'hot' | 'warm' | 'nurture' | 'cold';
  isDisqualified: boolean;
  disqualifyReason?: string;
  problems: {
    primary: string;
    list: string[];
    confidence: number;
  };
  recommended_service: string;
  estimated_loss: number;
  outreach_context: {
    hook: string;
    pain_point: string;
    offer: string;
  };
  segment: string[];
  priority_rank: number;
  conversion_probability: number;
  extractedEmail: string | null;  // NEW — from analyzer
};

export type LeadScoringData = {
  name: string;
  phone?: string;
  website?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  query?: string;
  reviewsList?: Array<{ text?: string; author_name?: string }>;
  business_status?: string;        // NEW from Places API
  types?: string[];                // NEW from Places API
  photos?: unknown[];              // NEW from Places API
  opening_hours?: {               // NEW from Places API
    weekday_text?: string[];
    open_now?: boolean;
  };
};

export type AnalysisResult = {
  status: 'none' | 'broken' | 'weak' | 'ok';
  hasContactForm: boolean;
  hasEmail: boolean;
  hasWeakContent: boolean;
  html?: string;
  problems: {
    primary: string;
    secondary: string[];
    confidence: number;
  };
  extractedEmail?: string | null;
};

// Existing loss estimation multiplier record
const categoryMultiplier: Record<string, number> = {
  dentist: 2.0,
  clinic: 1.8,
  gym: 1.5,
  salon: 1.3,
  restaurant: 1.2,
  others: 1.0,
  default: 1.0,
};

// Upgraded getCategory function supporting Places types
function getCategory(
  name: string, 
  query: string, 
  types?: string[]
): string {
  const combined = (name + ' ' + query + ' ' + (types || []).join(' ')).toLowerCase();

  if (/dentist|dental|teeth|clinic|hospital|doctor|medical|health|physician|ortho|eye|vision/i.test(combined))
    return 'clinic';
  if (/real.?estate|builder|property|flat|apartment|housing|realty|realtor/i.test(combined))
    return 'real_estate';
  if (/gym|fitness|yoga|wellness|spa|salon|beauty|hair|nails|massage|pilates/i.test(combined))
    return 'gym';
  if (/hotel|resort|lodge|inn|stay|airbnb/i.test(combined))
    return 'hotel';
  if (/restaurant|cafe|food|dhaba|biryani|pizza|dining|eatery|kitchen|bakery/i.test(combined))
    return 'restaurant';
  if (/lawyer|advocate|legal|law firm|ca |chartered|consultant|advisory|finance|tax/i.test(combined))
    return 'consultant';
  if (/school|college|institute|coaching|tuition|academy|education|tutorial|university/i.test(combined))
    return 'education';
  if (/shop|store|retail|boutique|mart|outlet|showroom|emporium/i.test(combined))
    return 'retail';
  return 'others';
}

// Helper to keep existing estimated_loss logic
function estimateLoss(reviews: number, problem: string, category: string): number {
  let base = 0;

  if (reviews > 200) base = 30000;
  else if (reviews > 100) base = 15000;
  else if (reviews > 50) base = 8000;

  base *= categoryMultiplier[category] || 1.0;

  if (problem === "missed_calls") base *= 1.5;
  if (problem === "no_online_presence") base *= 1.3;
  if (problem === "no_lead_capture") base *= 1.2;

  return Math.round(base);
}

// Helper to keep existing recommended_service logic
function mapService(problem: string): string {
  switch(problem) {
    case "missed_calls":
      return "whatsapp_auto_reply_system";
    case "no_online_presence":
      return "high_converting_website_setup";
    case "no_lead_capture":
      return "lead_capture_funnel_optimization";
    case "low_seo_content":
      return "seo_content_rebuild";
    default:
      return "digital_growth_system";
  }
}

// Helper to keep existing generateHook logic
function generateHook(problem: string): string {
  const hooks: Record<string, string[]> = {
    missed_calls: [
      "customers may not be able to reach you instantly",
      "you might be missing inquiries during busy hours",
      "potential clients could be dropping off when calls aren’t answered"
    ],
    no_online_presence: [
      "people searching online may not find you properly",
      "you might be invisible to high-intent Google searches",
      "customers could be choosing competitors with better presence"
    ]
  };

  const list = hooks[problem] || ["there may be a gap in your lead flow"];
  return list[Math.floor(Math.random() * list.length)];
}

// Helper to keep existing estimateOutcome logic
function estimateOutcome(estimated_loss: number): string {
  if (estimated_loss > 20000) {
    return "recover ₹20k–₹30k/month in lost leads";
  }
  if (estimated_loss > 10000) {
    return "recover ₹10k–₹20k/month";
  }
  return "increase inbound leads";
}

function buildOutreachContext(
  primaryProblem: string,
  estimatedLoss: number,
  recommendedService: string
) {
  const hook = generateHook(primaryProblem);
  const pain_point = primaryProblem;
  const outcome = estimateOutcome(estimatedLoss);
  
  let offer = recommendedService;
  if (recommendedService === 'whatsapp_auto_reply_system') {
    offer = `Deploy a 24/7 AI-powered auto-reply system to capture missed calls and ${outcome}.`;
  } else if (recommendedService === 'high_converting_website_setup') {
    offer = `Build a high-performance modern website optimized to convert Google traffic and ${outcome}.`;
  } else if (recommendedService === 'lead_capture_funnel_optimization') {
    offer = `Install high-converting lead capture funnels & conversion widgets to ${outcome}.`;
  } else if (recommendedService === 'seo_content_rebuild') {
    offer = `Rebuild local SEO content to dominate search results and ${outcome}.`;
  }

  return {
    hook,
    pain_point,
    offer
  };
}

// Helper to keep existing priority_rank calculation
function calculatePriority(finalScore: number, revenueScore: number, estimatedLoss: number): number {
  return Math.round(
    finalScore * 0.5 +
    revenueScore * 0.3 +
    Math.min(estimatedLoss / 1000, 50) * 0.2
  );
}

// Helper to keep existing segment array building
function assignSegments(lead: {
  website: string | undefined;
  primaryProblem: string;
  revenueScore: number;
}): string[] {
  const segments: string[] = [];

  if (!lead.website) segments.push("quick_win");
  if (lead.primaryProblem === "missed_calls") segments.push("automation");
  if (lead.revenueScore > 50 && lead.website) segments.push("high_ticket");

  if (segments.length === 0) segments.push("low_value");

  return segments;
}

// Helper to keep existing conversion probability logic
function calculateConversionProbability(lead: {
  revenueScore: number;
  opportunityScore: number;
  contactScore: number;
  primaryProblem: string;
  website: string | undefined;
}): number {
  let score = 0;

  if (lead.revenueScore > 50) score += 30;
  if (lead.opportunityScore > 50) score += 25;
  if (lead.contactScore > 20) score += 20;
  if (lead.primaryProblem === "missed_calls") score += 15;
  if (lead.website) score += 10;

  return Math.min(score, 100);
}

// Disqualifier Check
export function isDisqualified(leadData: LeadScoringData): 
  { disqualified: boolean; reason?: string } {

  // Rule 1: Permanently closed
  if (leadData.business_status === 'CLOSED_PERMANENTLY') {
    return { disqualified: true, reason: 'Permanently closed' };
  }

  // Rule 2: Franchise / Chain
  const CHAIN_KEYWORDS = [
    'mcdonalds', "mcdonald's", 'dominos', "domino's", 'subway',
    'kfc', 'pizza hut', 'starbucks', 'cafe coffee day', 'ccd',
    'hdfc bank', 'icici bank', 'axis bank', 'sbi bank', 'kotak',
    'reliance fresh', 'dmart', 'big bazaar', 'zara', 'h&m',
    'samsung store', 'apple store', 'burger king', 'tata',
    'jio store', 'airtel store', 'bata', 'woodland'
  ];
  const nameLower = (leadData.name || '').toLowerCase();
  const chainMatch = CHAIN_KEYWORDS.find(k => nameLower.includes(k));
  if (chainMatch) {
    return { disqualified: true, reason: `Chain/franchise: ${chainMatch}` };
  }

  // Rule 3: Government entity
  const GOVT_KEYWORDS = [
    'government', 'municipal', 'nagar palika', 'panchayat',
    'district', 'taluka', 'collector office', 'tehsil',
    'ward office', 'public sector', 'railway station',
    'post office', 'police station', 'court', 'tribunal'
  ];
  const addressLower = (leadData.address || '').toLowerCase();
  const govtMatch = GOVT_KEYWORDS.find(
    k => nameLower.includes(k) || addressLower.includes(k)
  );
  if (govtMatch) {
    return { disqualified: true, reason: `Government entity: ${govtMatch}` };
  }

  // Rule 4: Ghost listing
  const reviewCount = leadData.reviews ?? 0;
  const hasPhone = !!leadData.phone;
  const hasWebsite = !!leadData.website;
  if (reviewCount === 0 && !hasPhone && !hasWebsite) {
    return { disqualified: true, reason: 'Ghost listing — no reviews, phone, or website' };
  }

  return { disqualified: false };
}

// Dimension 1: Digital Gap Score Calculation
function calcDigitalGap(analysis: AnalysisResult): number {
  let score = 0;

  if (analysis.status === 'none') {
    // BRANCH A — No website
    score += 40;
    // Additional signals applied as safe defaults
    score += 10;  // assume no description
    score += 10;  // assume no photos bonus
    score += 10;  // assume incomplete hours
  } else if (analysis.status === 'broken') {
    // BRANCH B — Broken website
    score += 30;
    score += 15;  // no contact form (can't check)
    score += 10;  // no email (can't check)
    score += 10;  // weak content (can't check)
  } else {
    // BRANCH C — Website loads OK
    if (!analysis.hasContactForm)  score += 15;
    if (!analysis.hasEmail)        score += 10;
    if (analysis.hasWeakContent)   score += 10;
  }

  // Confidence guard
  if (analysis.problems.confidence < 0.5) score *= 0.8;

  // Normalize to 100
  const MAX_DIGITAL_GAP = 70;  // highest possible branch max
  return Math.min(Math.round((score / MAX_DIGITAL_GAP) * 100), 100);
}

// Master lead scoring pipeline
export async function scoreLead(
  website: string | null,
  leadData: LeadScoringData
): Promise<ScoreResult> {
  // Translate reviewsList format for analyzer compatibility
  const reviewsListForAnalyzer = leadData.reviewsList 
    ? leadData.reviewsList.map(r => ({ text: r.text || '', rating: 5 })) // default to high if not known
    : null;

  const analysis: AnalysisResult = await analyzeWebsite(website || null, reviewsListForAnalyzer);

  // 0. Disqualifier Check
  const dq = isDisqualified({
    ...leadData,
    website: website || undefined,
    business_status: leadData.business_status,
  });

  // 1. Digital Gap (Opportunity Score) pre-norm & normalized
  let rawDigitalGap = 0;
  if (analysis.status === 'none') {
    rawDigitalGap += 40;
    rawDigitalGap += 10;
    rawDigitalGap += 10;
    rawDigitalGap += 10;
  } else if (analysis.status === 'broken') {
    rawDigitalGap += 30;
    rawDigitalGap += 15;
    rawDigitalGap += 10;
    rawDigitalGap += 10;
  } else {
    if (!analysis.hasContactForm)  rawDigitalGap += 15;
    if (!analysis.hasEmail)        rawDigitalGap += 10;
    if (analysis.hasWeakContent)   rawDigitalGap += 10;
  }

  if (analysis.problems.confidence < 0.5) {
    rawDigitalGap *= 0.8;
  }

  const opportunityScore = Math.round(rawDigitalGap);
  const digitalGapNorm = calcDigitalGap(analysis);

  // 2. Revenue Potential Score
  let revenueScore = 0;
  
  // Step A: Review Volume
  const reviewsCount = leadData.reviews ?? 0;
  if (reviewsCount > 500)       revenueScore += 35;
  else if (reviewsCount >= 201) revenueScore += 25;
  else if (reviewsCount >= 101) revenueScore += 15;
  else if (reviewsCount >= 51)  revenueScore += 10;
  else if (reviewsCount >= 10)  revenueScore += 5;

  // Step B: Star Rating
  const ratingVal = leadData.rating ?? 0;
  if (ratingVal >= 4.0)      revenueScore += 15;
  else if (ratingVal >= 3.0) revenueScore += 8;

  // Step C: Niche Value
  const category = getCategory(leadData.name, leadData.query || '', leadData.types);
  let nichePoints = 8;
  if (category === 'clinic') nichePoints = 30;
  else if (category === 'real_estate') nichePoints = 25;
  else if (category === 'gym') nichePoints = 20;
  else if (category === 'hotel') nichePoints = 18;
  else if (category === 'restaurant') nichePoints = 18;
  else if (category === 'consultant') nichePoints = 15;
  else if (category === 'education') nichePoints = 15;
  else if (category === 'retail') nichePoints = 10;
  revenueScore += nichePoints;

  // Step D: City Tier Boost
  const addressLower = (leadData.address || '').toLowerCase();
  let cityBoost = 5;

  const PREMIUM_KEYWORDS = [
    'bandra', 'koramangala', 'connaught place', 'juhu', 'powai', 'worli',
    'lower parel', 'indiranagar', 'south mumbai', 'andheri west',
    'hiranandani', 'cp', 'khan market', 'hauz khas', 'whitefield'
  ];

  const METRO_KEYWORDS = [
    'mumbai', 'delhi', 'bengaluru', 'bangalore', 'hyderabad', 'chennai',
    'pune', 'kolkata', 'ahmedabad', 'gurgaon', 'gurugram', 'noida',
    'surat', 'jaipur'
  ];

  const TIER2_KEYWORDS = [
    'nagpur', 'indore', 'lucknow', 'bhopal', 'vadodara', 'coimbatore',
    'kochi', 'patna', 'chandigarh', 'visakhapatnam', 'vizag',
    'mysuru', 'mysore', 'rajkot', 'nashik', 'aurangabad'
  ];

  if (PREMIUM_KEYWORDS.some(k => addressLower.includes(k))) {
    cityBoost = 25;
  } else if (METRO_KEYWORDS.some(k => addressLower.includes(k))) {
    cityBoost = 20;
  } else if (TIER2_KEYWORDS.some(k => addressLower.includes(k))) {
    cityBoost = 12;
  }
  revenueScore += cityBoost;

  // Step E: Web Optimization Upside
  const hasWebsite = analysis.status !== 'none';
  const isPoor = analysis.status === 'broken' || 
                 analysis.hasWeakContent || 
                 !analysis.hasContactForm || 
                 !analysis.hasEmail;
  if (hasWebsite && isPoor) {
    revenueScore += 25;
  }

  const revenueNorm = Math.min(revenueScore, 100);

  // 3. Contactability Score
  let contactScore = 0;
  if (leadData.phone) {
    contactScore += 25; // Phone listed
    contactScore += 15; // WhatsApp (assumed)
  }

  const emailVal = analysis.hasEmail || !!leadData.phone && analysis.extractedEmail || false;
  if (emailVal || analysis.extractedEmail) {
    contactScore += 20; // Email available
  }

  const contactNorm = Math.min(Math.round((contactScore / 60) * 100), 100);

  // 4. Intent Signal Score
  let intentScore = 0;

  // Signal 1: High reviews but no website
  if (reviewsCount > 50 && analysis.status === 'none') {
    intentScore += 25;
  }

  // Signal 2: No website but listing has photos
  const photoCount = leadData.photos?.length ?? 0;
  if (analysis.status === 'none' && photoCount > 0) {
    intentScore += 20;
  }

  // Signal 3: Business is open 7 days a week
  if (leadData.opening_hours?.weekday_text?.length === 7) {
    intentScore += 10;
  }

  // Signal 4: Multiple locations detected
  const hasMultipleLocations = /branch|sector|\s#\d|unit\s\d|\s-\s\d/i.test(leadData.name);
  if (hasMultipleLocations) {
    intentScore += 15;
  }

  // Signal 5: Strong rating but poor web presence
  if (ratingVal >= 4.0 && (analysis.status === 'none' || analysis.status === 'broken')) {
    intentScore += 20;
  }

  // Signal 6: High reviews count relative to category
  if (reviewsCount > 100 && ['restaurant', 'gym', 'salon'].includes(category)) {
    intentScore += 10;
  }
  if (reviewsCount > 30 && ['clinic', 'consultant'].includes(category)) {
    intentScore += 10;
  }

  const intentNorm = Math.min(intentScore, 100);

  // 5. Final Weighted Score
  const finalScore = Math.min(Math.round(
    digitalGapNorm * 0.35 +
    revenueNorm    * 0.30 +
    intentNorm     * 0.25 +
    contactNorm    * 0.10
  ), 100);

  // Score Tiers
  let tier: 'hot' | 'warm' | 'nurture' | 'cold' = 'cold';
  if (finalScore >= 80)      tier = 'hot';
  else if (finalScore >= 60) tier = 'warm';
  else if (finalScore >= 40) tier = 'nurture';

  // 6. Monitization details (Keep existing)
  const lossCategory = category === 'clinic' ? 'clinic' : (category === 'gym' ? 'gym' : (category === 'restaurant' ? 'restaurant' : 'others'));
  const estimated_loss = estimateLoss(reviewsCount, analysis.problems.primary, lossCategory);
  const recommended_service = mapService(analysis.problems.primary);
  
  // New outreach context
  const outreach_context = buildOutreachContext(
    analysis.problems.primary,
    estimated_loss,
    recommended_service
  );

  // Priority & ranking metrics (Keep existing)
  const priority_rank = calculatePriority(finalScore, revenueNorm, estimated_loss);
  const segment = assignSegments({
    website: website || undefined,
    primaryProblem: analysis.problems.primary,
    revenueScore: revenueNorm,
  });
  const conversion_probability = calculateConversionProbability({
    revenueScore: revenueNorm,
    opportunityScore: digitalGapNorm,
    contactScore: contactNorm,
    primaryProblem: analysis.problems.primary,
    website: website || undefined,
  });

  return {
    opportunityScore,
    revenueScore,
    contactScore,
    intentScore,
    digitalGapNorm,
    revenueNorm,
    contactNorm,
    intentNorm,
    finalScore,
    tier,
    isDisqualified: dq.disqualified,
    disqualifyReason: dq.reason,
    problems: {
      primary: analysis.problems.primary,
      list: [analysis.problems.primary, ...analysis.problems.secondary],
      confidence: analysis.problems.confidence,
    },
    recommended_service,
    estimated_loss,
    outreach_context,
    segment,
    priority_rank,
    conversion_probability,
    extractedEmail: analysis.extractedEmail || null,
  };
}
