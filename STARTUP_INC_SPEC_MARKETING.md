# Startup Inc — Spec Addendum: Marketing

This document extends all previous spec files. Apply on top of everything else.

---

## Overview

Marketing gives the player an active lever to grow products after they ship. There are two layers: **passive marketing** (a weekly WU + cash commitment per product that continuously boosts growth and slows decay) and **one-off campaigns** (a burst of WU + cash for an immediate effect). Both compete for the same WU pool as development, patching, and self-hosting — so marketing is always a real tradeoff.

---

## Type Changes

### Updated `Project`

```typescript
interface Project {
  // ... existing fields ...
  marketing: MarketingState;
}

interface MarketingState {
  passiveLevel: MarketingLevel;       // current passive marketing tier (default: 'none')
  activeCampaign: Campaign | null;    // one-off campaign in progress
}

type MarketingLevel = 'none' | 'low' | 'medium' | 'high';

interface Campaign {
  id: string;
  type: CampaignType;
  wuRequired: number;
  wuInvested: number;
  cashCost: number;                   // paid upfront when campaign starts
  weekStarted: number;
  effect: CampaignEffect;
  weeksRemaining: number | null;      // how long the effect lasts after completion
}

type CampaignType =
  | 'social_media_blitz'
  | 'press_release'
  | 'influencer_deal'
  | 'product_hunt_launch'
  | 'paid_ads'
  | 'content_marketing';

interface CampaignEffect {
  growthMultiplier: number;           // multiplier on new subscriber/sales rate
  decayReduction: number;            // % points removed from decay rate (e.g. 0.2 = -0.2%/wk)
  durationWeeks: number;             // how many weeks the effect lasts after campaign completes
}
```

---

## Passive Marketing

A standing weekly commitment per product. The player sets the level on the product's detail page. Takes effect from the following week.

| Level | WU/wk | Cash/wk | Growth Boost | Decay Reduction |
|---|---|---|---|---|
| `none` | 0 | $0 | — | — |
| `low` | 1 | $100 | +15% new users/sales per week | -0.1%/wk decay |
| `medium` | 2 | $350 | +35% new users/sales per week | -0.25%/wk decay |
| `high` | 3 | $900 | +65% new users/sales per week | -0.4%/wk decay |

**Rules:**
- Passive marketing WU is drained from the player's weekly WU budget before development WU is allocated (same priority order as self-hosting)
- If total WU drain (self-hosting + passive marketing across all products) exceeds available WU, show the same red warning on the dashboard: "⚠️ WU overcommitted — reduce marketing or self-hosting"
- Cash cost is deducted each week automatically alongside hosting and self costs
- Passive level can be changed or set to `none` at any time — takes effect next week

---

## One-Off Campaigns

Campaigns are bursts of focused effort. The player launches one from the product detail page. A campaign consumes WU over several weeks (like a patch job) and costs cash upfront. When complete, the effect kicks in and lasts for a set number of weeks.

Only **one campaign** can be active per product at a time. The player can run campaigns on multiple different products simultaneously (unlike patches, which share a global slot — campaigns are per-product).

Campaigns do **not** block development — their WU cost is a separate drain on top of development WU. This means running a campaign while building a new project is expensive but possible.

### Campaign Definitions

| Campaign | WU Cost | Cash Cost | Growth Multiplier | Decay Reduction | Effect Duration |
|---|---|---|---|---|---|
| Social Media Blitz | 3 WU | $200 | +80% | -0.1%/wk | 4 weeks |
| Press Release | 2 WU | $500 | +50% | -0.15%/wk | 3 weeks |
| Influencer Deal | 4 WU | $1,500 | +120% | -0.2%/wk | 6 weeks |
| Product Hunt Launch | 5 WU | $0 | +200% | -0.1%/wk | 3 weeks |
| Paid Ads | 1 WU | $2,000 | +90% | -0.3%/wk | 5 weeks |
| Content Marketing | 6 WU | $300 | +60% | -0.35%/wk | 8 weeks |

**Notes on individual campaigns:**
- **Product Hunt Launch** is free cash-wise but expensive in WU, and can only be used **once per product** (greyed out after first use)
- **Paid Ads** is fast to execute (1 WU) but cash-heavy — best when the player is cash-rich but time-poor
- **Content Marketing** is slow and cheap — best for early-stage products or when WU is tight beyond the upfront cost
- **Influencer Deal** gives the biggest growth spike but is expensive in both dimensions

---

## How Effects Stack

Passive marketing and active campaign effects stack additively with each other and with the base growth/decay values:

```
effectiveDecayRate = baseDecayRate
                   - passiveLevel.decayReduction
                   - (activeCampaignEffect?.decayReduction ?? 0)

effectiveGrowthRate = baseGrowthRate
                    * (1 + passiveLevel.growthBoost)
                    * (1 + activeCampaignEffect?.growthMultiplier ?? 0)
```

Decay rate cannot go below 0.05%/wk (products always decay a tiny amount, even with heavy marketing).

---

## WU Budget Calculation (updated)

```
availableWu = laptopTier.wuPerWeek
            + (agileProcess ? 1 : 0)
            - sum(selfHostedProducts.hostingWuDrainPerWeek)
            - sum(allProducts.marketing.passiveLevel.wuPerWeek)
            - sum(allProducts.marketing.activeCampaign.wuPerWeek)  // 1 WU/wk per active campaign

// Remaining WU goes to active project dev / patch
projectWu = availableWu (capped at what the project needs)
```

Campaigns drain 1 WU/week from the pool until their `wuRequired` is met, regardless of their total WU cost (e.g. a 6 WU Content Marketing campaign drains 1 WU/wk for 6 weeks if the player has no spare capacity — or finishes faster if more WU is free).

---

## UI Changes

### `/projects/[id]` — Shipped Product (updated)

Add a **Marketing section** between Revenue and Bug Report:

**Passive Marketing**
- Segmented control: `None | Low | Medium | High`
- Shows current WU/wk and cash/wk cost for selected level
- Live warning if selecting this level would overcommit WU

**Active Campaign**
- If no campaign active: list of campaign cards, each showing WU cost, cash cost, growth/decay effect, duration. "Launch" button on each.
- If campaign active: progress bar (WU invested / WU required), effect preview ("Effect starts in ~X weeks"), cancel button (cash cost is non-refundable)
- If campaign complete and effect running: green banner "📣 [Campaign] active — X weeks remaining" with effect stats

### Dashboard — WU Breakdown

Expand the WU indicator in the stats row to show a mini breakdown on tap/press:

```
WU this week: 10 total
  Development:   4 WU
  Self-hosting:  2 WU
  Marketing:     3 WU
  Available:     1 WU
```

### Dashboard — Weekly Summary (updated)

Add marketing costs to the weekly expense summary:

```
Week 22 summary:
  Revenue:           +$6,400
  Self costs:          -$600
  Hosting:             -$550
  Marketing:           -$450
  Net:               +$4,800
```

---

## `weekTick.ts` Updates

Add to the weekly tick in this order:

```typescript
// 1. Drain passive marketing WU (already accounted for in availableWu calc)

// 2. Advance active campaign WU per product
for (const project of shippedProjects) {
  if (project.marketing.activeCampaign) {
    project.marketing.activeCampaign.wuInvested += campaignWuDrainThisWeek;
    if (campaign.wuInvested >= campaign.wuRequired) {
      // Campaign complete — activate effect, set weeksRemaining
      activateCampaignEffect(project);
    }
  }
}

// 3. Tick down active campaign effect durations
for (const project of shippedProjects) {
  if (campaign?.weeksRemaining !== null) {
    campaign.weeksRemaining--;
    if (campaign.weeksRemaining <= 0) {
      project.marketing.activeCampaign = null; // effect expired
    }
  }
}

// 4. Apply growth and decay with marketing modifiers
for (const project of shippedProjects) {
  const decayRate = calcEffectiveDecayRate(project);
  const growthRate = calcEffectiveGrowthRate(project);
  tickShippedProject(project, decayRate, growthRate);
}

// 5. Deduct passive marketing cash costs
state.meta.cash -= totalPassiveMarketingCost;
```

---

## Notes for Claude Code

- Campaign WU is drained at 1 WU/week from the pool — do not drain all campaign WU in a single tick
- `productHuntLaunch` must be flagged as `used` on the project permanently after first use — store a `campaignHistory: CampaignType[]` array on `MarketingState`
- The passive marketing segmented control should show a projected revenue impact when the player hovers/taps a tier before committing
- Campaigns can be cancelled but cash is non-refundable — show this clearly in the cancel confirmation
- Decay floor of 0.05%/wk must be enforced in `calcEffectiveDecayRate` — never return below this value
- Add `marketing` to the `defaultGameState` project factory with `passiveLevel: 'none'` and `activeCampaign: null`
