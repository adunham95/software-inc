# Startup Inc — Spec Addendum: Economy & Expenses

This document extends all previous spec files. Apply on top of everything else.

---

## Overview

Money now has meaningful drains. Every week the player pays for their living costs, hardware, and hosting. Research costs an upfront fee. Hardware tier gates certain project types and affects WU output. Hosting is a strategic choice between spending WU or spending cash.

---

## Type Changes

### Updated `GameState`

```typescript
interface GameState {
  // ... existing fields ...
  expenses: ExpenseState;
}

interface ExpenseState {
  // Hardware
  laptopTier: LaptopTier;           // current hardware tier

  // Hosting
  hostingType: 'external' | 'self'; // chosen per product (see below)

  // Weekly flat costs (auto-deducted each tick)
  weeklySelfCost: number;           // derived from selfCostTier, not editable directly
  selfCostTier: SelfCostTier;
}

type LaptopTier = 1 | 2 | 3 | 4;
type SelfCostTier = 'bedroom' | 'apartment' | 'home_office' | 'coworking';
```

### Updated `Project` — add hosting choice

```typescript
interface Project {
  // ... existing fields ...
  hostingType: 'external' | 'self' | 'none'; // 'none' for basic_website & browser_ext
  hostingCostPerWeek: number;                 // $0 if self-hosted (WU cost instead)
  hostingWuDrainPerWeek: number;              // 0 if external-hosted
}
```

---

## Research Costs

Research now has an upfront cash cost paid when the player starts a research node. If the player cannot afford it, the node is unselectable (shown with a lock + price tag).

| Research ID | Upfront Cost |
|---|---|
| `web_basics` | $500 |
| `mobile_dev` | $1,000 |
| `cloud_hosting` | $2,500 |
| `agile_process` | $300 |
| `ui_ux` | $800 |
| `ai_features` | $8,000 |
| `devops` | $3,000 |
| `security` | $1,500 |
| `monetization` | $1,000 |

Research costs represent courses, books, conference tickets, and online subscriptions. Shown as a one-time deduction from cash the moment research begins. The `/research` page should display the cost on each node card alongside weeks to complete.

---

## Self / Living Costs

A flat weekly cost representing the player's personal expenses — rent, food, utilities. Deducted automatically every week tick before revenue is added (so the player always feels it).

The player starts on `bedroom` tier. Tier upgrades are purchased from a new **"Life"** tab or section (see UI below). Downgrades are also allowed.

| Tier | Label | Weekly Cost | Flavour |
|---|---|---|---|
| `bedroom` | Bedroom Startup | $200/wk | Living with parents, ramen diet |
| `apartment` | Solo Apartment | $600/wk | Your own place, basic setup |
| `home_office` | Home Office | $1,200/wk | Decent desk, fast internet, coffee machine |
| `coworking` | Coworking Space | $2,500/wk | Hot desk, networking events, free oat milk |

Tier affects nothing mechanically beyond cost — it is purely an expense sink that escalates naturally as the player earns more and wants to "level up" their lifestyle. Shown in the dashboard header as a small lifestyle badge.

---

## Hardware — Laptop Tiers

The player's laptop determines their base WU output per week and gates certain project types.

| Tier | Name | WU/week | Unlocks | Purchase Price |
|---|---|---|---|---|
| 1 | Old Laptop | 5 | Basic Website, Browser Extension | Starting equipment (free) |
| 2 | Mid-Range Laptop | 7 | Mobile App, SaaS Tool, Desktop App | $1,500 |
| 3 | Pro Laptop | 10 | All current types | $4,000 |
| 4 | Dev Workstation | 14 | AI Product | $12,000 |

Hardware is a one-time purchase. Buying a new tier replaces the old one — no resale value.

**Important**: The research `agile_process` (+1 WU/week) stacks on top of the laptop's base WU. So a Tier 3 laptop + agile process = 11 WU/week.

On the `/projects/new` form, project types the player cannot build due to hardware tier should be shown greyed out with a "Requires: Pro Laptop (Tier 3)" label — similar to how locked research features are shown.

Hardware is purchased from the new **"Gear"** section (see UI below).

---

## Hosting

Every shipped product that runs a server needs hosting. Basic Website and Browser Extension are exempt (`hostingType: 'none'`) — they don't need servers.

Products that require hosting: **Mobile App, SaaS Tool, Desktop App, AI Product**.

The player chooses a hosting type **when the project ships** (not at creation). A modal appears on ship:

> "Where will you host [Product Name]?"
> - External Hosting — $X/week, zero maintenance
> - Self-Hosted — Free, but costs Y WU/week in upkeep

### External Hosting

Costs scale with product type (bigger products need more server resources):

| Product Type | External Cost/Week |
|---|---|
| Mobile App | $150/wk |
| SaaS Tool | $400/wk |
| Desktop App | $100/wk |
| AI Product | $1,200/wk |

No WU drain. No outage risk. Just a weekly cash cost deducted automatically.

### Self-Hosting

Free cash cost, but drains WU from the player's weekly budget. The player effectively has fewer WU to spend on development or patches that week.

| Product Type | WU Drain/Week |
|---|---|
| Mobile App | 1 WU/wk |
| SaaS Tool | 2 WU/wk |
| Desktop App | 1 WU/wk |
| AI Product | 4 WU/wk |

Self-hosted products also have an **outage risk**: each week there is a small chance (5% base) of a self-hosting outage event:
- Revenue = $0 for that week
- Notification: "⚡ [Product] went down — self-hosted server crashed. No revenue this week."
- Outage risk is reduced by completing `devops` research (5% → 2%)

The player can **switch hosting type** at any time from the `/projects/[id]` page. Switching takes effect the following week.

### Total WU Budget Calculation (per week)

```
availableWu = laptopTier.wuPerWeek
            + (agileProcess ? 1 : 0)
            - sum(selfHostedProducts.hostingWuDrainPerWeek)

// Remaining WU is split: active project dev first, then active patch/research
projectWu   = min(availableWu, project.wuNeeded)
remainingWu = availableWu - projectWu
// (currently research uses RP not WU, so remaining WU is just lost unless a patch is active)
```

If `availableWu` drops to 0 or below (player has too many self-hosted products), show a **red warning** on the dashboard: "⚠️ No WU available — self-hosting overhead is consuming all your time."

---

## Weekly Expense Summary

Every week tick deducts in this order:

1. Self / living cost (`selfCostTier.weeklyCost`)
2. External hosting costs for all live products
3. Revenue from shipped products added
4. Net cash change shown in notification log

Add a **weekly expense breakdown** to the notification log each week tick:

```
Week 18 summary:
  Revenue:         +$4,200
  Self costs:       -$600
  Hosting:          -$550
  Net:             +$3,050
```

---

## New UI: "Setup" Page

Add a **Setup** route at `/setup` and a fourth tab to the bottom nav (icon: 🖥️ or a computer/gear icon).

This page has two sections:

### Gear

Displays current laptop tier with stats (WU/week, unlocked project types).
Below it, shows the next available tier as an upgrade card with purchase price and a "Upgrade Hardware" button (disabled if insufficient cash).

```
Current: Pro Laptop (Tier 3) — 10 WU/week
Upgrade available: Dev Workstation (Tier 4) — 14 WU/week — $12,000
[Upgrade Hardware]
```

### Lifestyle

Displays current self cost tier with weekly cost.
Shows all four tiers as selectable cards. Current tier highlighted. Player can tap any tier to switch (up or down). Switching takes effect next week.

```
[ Bedroom $200/wk ]  [ Apartment $600/wk ✓ ]  [ Home Office $1,200/wk ]  [ Coworking $2,500/wk ]
```

---

## Dashboard Updates

### Stats Row (updated)
Add a fourth chip: **Expenses/wk** — shows total weekly outgoings (self cost + all hosting costs).

### Header
Add a small lifestyle tier badge next to company name (e.g. "🛏️ Bedroom" or "☕ Coworking").

### Weekly Summary Notification
Replace the plain notification with a structured weekly summary card (collapsible) showing the revenue/expense breakdown described above.

---

## Starting State

```typescript
expenses: {
  laptopTier: 1,
  hostingType: 'external',   // default preference, chosen per product on ship
  weeklySelfCost: 200,
  selfCostTier: 'bedroom',
}
```

Starting cash is $50,000 as before — enough to survive a while on bedroom costs and buy Tier 2 hardware fairly quickly, but not enough to rush to Tier 4 without building revenue first.

---

## Balance Notes

- A player on Tier 1 laptop with bedroom costs burns $200/wk. At 5 WU/week they need revenue fast.
- Tier 4 laptop ($12,000) + AI research ($8,000) = $20,000 investment before building an AI product. This should feel earned.
- Self-hosting an AI product (4 WU/wk drain) on a Tier 3 laptop (10 WU/wk) leaves only 6 WU for development — meaningful tradeoff vs paying $1,200/wk external.
- Multiple self-hosted products can stack WU drain, which is the main pressure valve that pushes successful players toward external hosting as they scale.

---

## Notes for Claude Code

- WU drain from self-hosting should be calculated and subtracted **before** allocating WU to the active project in `weekTick.ts`
- The hosting choice modal on ship should clearly show the WU impact: "Self-hosting will leave you X WU/week for development"
- Laptop tier upgrades should update `meta` immediately and the new WU/week takes effect the very next week tick
- Research node cards on `/research` should show both the weekly time cost and the upfront cash cost
- If the player cannot afford a research node, it should appear locked with a cash icon, not just greyed out like a prerequisite lock — use a different visual treatment so the player understands why
- `/setup` should be added as the 4th item in `BottomNav.svelte`
