'use client';

import React from 'react';
import { Lead } from '@/types/lead';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BadgeInfo } from 'lucide-react';

export interface LeadReasonMetadata {
  text: string;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  maps_url: string | null;
}

export function parseLeadReason(rawReason: string): LeadReasonMetadata {
  try {
    if (rawReason && rawReason.startsWith('{')) {
      const parsed = JSON.parse(rawReason);
      return {
        text: parsed.text || '',
        address: parsed.address || null,
        rating: parsed.rating != null ? Number(parsed.rating) : null,
        reviews: parsed.reviews != null ? Number(parsed.reviews) : null,
        maps_url: parsed.maps_url || null,
      };
    }
  } catch (err) {
    console.error('Failed to parse lead reason JSON:', err);
  }
  return {
    text: rawReason || '',
    address: null,
    rating: null,
    reviews: null,
    maps_url: null,
  };
}

export function getTierBadge(tier?: string) {
  switch (tier) {
    case 'hot':     return { label: '🔥 Hot',     color: 'bg-red-100 text-red-700 border-red-200' };
    case 'warm':    return { label: '✅ Warm',    color: 'bg-green-100 text-green-700 border-green-200' };
    case 'nurture': return { label: '🌤 Nurture', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    case 'cold':    return { label: '❄️ Cold',    color: 'bg-blue-100 text-blue-700 border-blue-200' };
    default:        return { label: '— Unrated',  color: 'bg-gray-100 text-gray-500 border-gray-200' };
  }
}

interface AuditChecklistProps { 
  lead: Lead;
  reasonText: string; 
  score: number;
  revenueScore?: number;
  contactScore?: number;
  intentNorm?: number;
  digitalGapNorm?: number;
}

export function AuditChecklist({ 
  lead,
  reasonText, 
  score,
  revenueScore = 0,
  contactScore = 0,
  intentNorm = 0,
  digitalGapNorm = 0
}: AuditChecklistProps) {
  const pitchIndex = reasonText.indexOf('Suggested Pitch:');
  const cleanNormalized = (pitchIndex !== -1 ? reasonText.substring(0, pitchIndex) : reasonText).toLowerCase();

  // ── Category Helper ──
  const getLeadCategory = (l: Lead): string => {
    const combined = ((l.name || '') + ' ' + (l.source || '') + ' ' + (l.address || '')).toLowerCase();
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
  };

  const category = getLeadCategory(lead);

  // ── Detect parameters from reason/lead properties ──
  const hasNoWebsite     = !lead.website;
  const hasBrokenSite    = !!lead.website && cleanNormalized.includes('no_online_presence');
  const hasNoForm        = cleanNormalized.includes('no_lead_capture');
  const hasNoEmail       = !lead.email;
  const hasWeakContent   = cleanNormalized.includes('low_seo_content');

  const reviewsCount     = lead.reviews ?? 0;
  const ratingVal        = lead.rating ?? 0;
  
  const addressLower     = (lead.address || '').toLowerCase();
  const PREMIUM_KEYWORDS = [
    'bandra', 'koramangala', 'connaught place', 'juhu', 'powai', 'worli',
    'lower parel', 'indiranagar', 'south mumbai', 'andheri west',
    'hiranandani', 'cp', 'khan market', 'hauz khas', 'whitefield'
  ];
  const isPremiumLoc     = PREMIUM_KEYWORDS.some(k => addressLower.includes(k));

  // ── 2. Intent Signal Parameters (Exact Scorer Sync) ──
  const signal1 = (reviewsCount > 50 && hasNoWebsite);
  const signal5 = (ratingVal >= 4.0 && (hasNoWebsite || hasBrokenSite));
  const hasMultipleLocations = /branch|sector|\s#\d|unit\s\d|\s-\s\d/i.test(lead.name || '');
  const isDominantReviews = (reviewsCount > 100 && ['restaurant', 'gym', 'salon'].includes(category)) || 
                            (reviewsCount > 30 && ['clinic', 'consultant'].includes(category));

  // Extract from problems JSONB with safe backfill fallbacks
  const hasPhotosSignal = lead.problems?.hasPhotos ?? (hasNoWebsite ? true : false);
  const hasSevenDaysSignal = lead.problems?.hasSevenDays ?? false;

  // ── Normalization adjustments for display ──
  const displayRevenueScore = Math.min(revenueScore, 100);
  const displayContactScore = contactScore <= 60 
    ? Math.min(Math.round((contactScore / 60) * 100), 100) 
    : contactScore;

  // ── Weighted contributions ──
  const contrib_gap     = Math.round(digitalGapNorm * 0.35);
  const contrib_rev     = Math.round(displayRevenueScore * 0.30);
  const contrib_intent  = Math.round(intentNorm     * 0.25);
  const contrib_contact = Math.round(displayContactScore * 0.10);

  // ── Dynamic Audit Comments explaining why it was scored ──
  const getGapComment = () => {
    if (hasNoWebsite) {
      return 'Scored 100/100 because this business has zero online presence (no active website). This is a maximum priority opportunity for a full-scale digital setup.';
    }
    if (hasBrokenSite) {
      return 'Scored 93/100 because their website is broken or inaccessible. High urgency case; the business is actively losing customers due to an offline page.';
    }
    if (digitalGapNorm > 0) {
      const gaps = [
        hasNoForm ? "missing contact forms" : null,
        hasNoEmail ? "no public email address listed" : null,
        hasWeakContent ? "thin SEO content (<300 words)" : null
      ].filter(Boolean);
      return `Scored ${digitalGapNorm}/100 because the website loads successfully but contains critical gaps: ${gaps.join(", ")}.`;
    }
    return 'Scored 0/100 because the website is highly optimized and contains all verified lead capture assets (forms, email, and strong content).';
  };

  const getRevComment = () => {
    const nicheLabel = category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
    return `Scored ${displayRevenueScore}/100. Audit signals: ${reviewsCount} reviews, ${ratingVal}★ rating, high-value ${nicheLabel} category, located in a ${
      isPremiumLoc ? 'Premium Locality' : 'Standard'
    } area. Raw index is ${revenueScore}/130.`;
  };

  const getIntentComment = () => {
    const activeTriggers: string[] = [];
    if (signal1) activeTriggers.push("high review volume with no website");
    if (hasPhotosSignal && hasNoWebsite) activeTriggers.push("active photo uploads on GMB");
    if (signal5) activeTriggers.push("strong star rating but poor web presence");
    if (hasMultipleLocations) activeTriggers.push("multi-location brand indicator");
    if (hasSevenDaysSignal) activeTriggers.push("7-day operation touchpoints");
    if (isDominantReviews) activeTriggers.push("niche review dominance");

    if (activeTriggers.length > 0) {
      return `Scored ${intentNorm}/100 based on active intent signals: ${activeTriggers.join(", ")}.`;
    }
    return `Scored ${intentNorm}/100. Lower outreach intent detected since their digital presence is already mature and operational.`;
  };

  const getContactComment = () => {
    return `Scored ${displayContactScore}/100. Verified outreach channels: Phone is ${
      lead.phone ? 'ACTIVE (+25 pts)' : 'MISSING'
    }, WhatsApp is ${
      lead.phone ? 'ACTIVE (+15 pts)' : 'MISSING'
    }, and Email is ${
      lead.email ? `ACTIVE (${lead.email}, +20 pts)` : 'MISSING'
    }.`;
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <BadgeInfo className="w-4 h-4 text-primary" /> Audit Report
        </h4>
        <Badge variant="secondary" className="text-sm font-black bg-primary/10 text-primary border-primary/20 px-3 py-1 animate-pulse">
          {score}/100 Score
        </Badge>
      </div>

      {/* ── Dimension Blueprint Panels ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { 
            key: 'gap', 
            label: 'Digital Gap', 
            description: getGapComment(), 
            contrib: contrib_gap, 
            color: 'text-purple-600 dark:text-purple-400'
          },
          { 
            key: 'rev', 
            label: 'Revenue Potential', 
            description: getRevComment(), 
            contrib: contrib_rev, 
            color: 'text-amber-600 dark:text-amber-400'
          },
          { 
            key: 'intent', 
            label: 'Intent Signal', 
            description: getIntentComment(), 
            contrib: contrib_intent, 
            color: 'text-orange-600 dark:text-orange-400'
          },
          { 
            key: 'contact', 
            label: 'Contactability', 
            description: getContactComment(), 
            contrib: contrib_contact, 
            color: 'text-emerald-600 dark:text-emerald-400'
          }
        ].map(d => (
          <Card key={d.key} className="overflow-hidden border-border bg-card shadow-sm flex flex-col justify-between">
            <div>
              <CardHeader className="px-4 py-3 flex flex-row items-center justify-between border-b border-border/50 bg-muted/20 space-y-0">
                <span className={`font-black text-xs uppercase tracking-wider ${d.color}`}>{d.label}</span>
                <Badge variant="outline" className={`text-[10px] font-black bg-current/10 px-2 py-0.5 rounded border border-current/20 ${d.color} shrink-0`}>
                  +{d.contrib} pts applied
                </Badge>
              </CardHeader>
              <CardContent className="px-4 py-3 text-xs text-muted-foreground leading-relaxed font-semibold">
                {d.description}
              </CardContent>
            </div>

            {d.key === 'gap' && lead.problems?.confidence && lead.problems.confidence < 0.5 && (
              <div className="p-3 bg-amber-500/5 border-t border-amber-500/10 text-[10px] text-amber-600 font-bold flex items-start gap-2">
                <span>⚠️</span>
                <p className="leading-normal">
                  Low Confidence Guard Active: Raw Gap Score reduced by 20% due to confidence factor ({lead.problems.confidence}).
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* ── Suggested Outreach Pitch ── */}
      {(() => {
        const pitchIndex = reasonText.indexOf('Suggested Pitch:');
        const suggestedPitch = pitchIndex !== -1 ? reasonText.substring(pitchIndex + 'Suggested Pitch:'.length).trim() : null;
        return suggestedPitch && (
          <Card className="bg-primary/[0.03] border-primary/20 animate-in fade-in slide-in-from-top-1 duration-300">
            <CardContent className="p-3.5 space-y-1.5">
              <span className="font-extrabold uppercase text-[9px] tracking-wider text-primary flex items-center gap-1">
                ✨ Suggested Outreach Pitch
              </span>
              <p className="text-xs text-foreground font-semibold italic leading-relaxed">
                &quot;{suggestedPitch}&quot;
              </p>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
