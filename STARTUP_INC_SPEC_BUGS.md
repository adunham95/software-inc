# Startup Inc — Spec Addendum: Bugs, Patches & Major Releases

This document extends `STARTUP_INC_SPEC.md` and the Categories addendum. Apply on top of both.

---

## Overview

Once a product ships, it begins accumulating bugs over time. Left unaddressed, bugs escalate through three severity tiers, progressively hurting revenue, reputation, and eventually killing the product. The player can respond with a **Patch** (cheap, fast, fixes bugs only) or a **Major Release** (expensive, slow, adds features + fixes bugs, spawns a new project entry).

---

## Type Changes

### Updated `Project` interface

```typescript
interface Project {
  // ... all existing fields ...

  // Bug tracking (shipped products only)
  bugs: Bug[];
  totalBugsFixed: number;       // lifetime stat
  lastPatchedWeek: number | null;

  // Version history
  version: string;              // e.g. "1.0", "2.0", "3.1"
  parentProjectId: string | null; // ID of the v1 project this was released from
  isMajorRelease: boolean;      // true if this project was created as a major release

  // Archived state
  archivedWeek: number | null;  // set when superseded by a major release
}
```

### New `Bug` interface

```typescript
interface Bug {
  id: string;
  weekDiscovered: number;
  severity: 'minor' | 'major' | 'critical';
  description: string;          // short flavour text e.g. "Memory leak in auth module"
  revenueImpact: number;        // $/wk this bug is costing (cumulative on top of others)
  fixed: boolean;
}
```

### New `PatchJob` interface

```typescript
// Stored on GameState, not on the project itself — only one patch can be active at a time
interface PatchJob {
  projectId: string;
  wuRequired: number;           // WU needed to complete the patch
  wuInvested: number;
  bugIdsToFix: string[];        // which bugs this patch addresses
  weekStarted: number;
}
```

### Updated `GameState`

```typescript
interface GameState {
  // ... existing fields ...
  activePatchJob: PatchJob | null;
}
```

---

## Bug Accumulation

### Steady Accumulation
Every shipped product gains bugs passively each week. The rate depends on product quality and how long it has been live:

```
bugsPerWeek = baseRate * (1 - quality/100) * ageFactor
```

- `baseRate`: 0.4 bugs/wk (so a perfect quality product almost never gets bugs naturally)
- `ageFactor`: starts at 1.0, increases by 0.05 each week on market (old code gets crustier)
- Fractional bugs accumulate — only spawn a new `Bug` when the counter crosses a whole number

### Random Spikes
Separately, the existing random events system can fire a **Bug Spike** event (in addition to the existing "Critical Bug" event):

| Event | Effect |
|---|---|
| 🐛 **Bug Spike** | 2–4 minor bugs appear at once on a random shipped product |
| 💥 **Outage Event** | 1 critical bug appears, product goes offline for 1 week (revenue = $0 that week) |

These are added to the random event pool from `events.ts`.

---

## Bug Severity

Bugs are assigned a severity when created:

| Severity | Spawn Chance | Revenue Impact | Description Examples |
|---|---|---|---|
| **Minor** | 60% | -$5–$20/wk each | "UI glitch on settings page", "Slow image loading" |
| **Major** | 30% | -$50–$150/wk each | "Crash on login for some users", "Data export broken" |
| **Critical** | 10% | -$300–$800/wk each | "Security vulnerability exposed", "Total data loss risk" |

Random spikes always spawn minor bugs. Outage events always spawn critical bugs.

---

## Escalation — What Happens If You Ignore Bugs

Bugs escalate through three stages if left unfixed. Each stage triggers at a bug count threshold:

### Stage 1 — Grumbling (3+ unfixed bugs)
- Revenue drops gradually: -2% per unfixed bug per week
- Notification: "Users are complaining about bugs in [Product]"

### Stage 2 — Reputation Damage (6+ unfixed bugs OR any critical bug unfixed for 3+ weeks)
- Reputation -1 per week (global, affects all products)
- Revenue drops faster: -4% per unfixed bug per week
- Notification: "Bad reviews spreading. Your reputation is taking a hit."

### Stage 3 — Product Death (10+ unfixed bugs OR any critical bug unfixed for 6+ weeks)
- Product is automatically set to `status: 'dead'` — revenue drops to $0
- Reputation -10 (one-time hit)
- Notification: "💀 [Product] has become unusable. Users have abandoned it."
- Dead products still appear on the project list with a 💀 badge (graveyard)
- Player can still launch a major release from a dead product

### Add `'dead'` to project status:
```typescript
status: 'in_development' | 'shipped' | 'dead' | 'archived' | 'cancelled';
```

---

## Patch System

A patch is a quick fix that costs WU and addresses a set of bugs. It does **not** add new features or boost revenue beyond restoring what bugs were costing.

### Initiating a Patch

On the `/projects/[id]` page for a shipped/dead product, show a **"Release Patch"** button if there are unfixed bugs.

Tapping it opens a **Patch Modal** with:
- List of unfixed bugs (each with severity badge, revenue impact, checkbox)
- Player selects which bugs to include in the patch
- WU cost shown live: `wuCost = sum of per-bug WU costs (see table below)`
- Estimated weeks: `wuCost / playerWuPerWeek`
- "Start Patch" button

| Bug Severity | WU to Fix |
|---|---|
| Minor | 2 WU |
| Major | 5 WU |
| Critical | 10 WU |

### Patch Rules
- Only **one patch job** can be active at a time (same slot as active project development)
- If a project is currently in development, the player must choose: pause it or delay the patch
- The player **cannot start a new project** while a patch is in progress
- Patch WU comes from the player's weekly WU budget (same pool)
- Version number bumps on completion: `1.0 → 1.1 → 1.2` etc.

### Patch Completion
When `wuInvested >= wuRequired`:
- All selected bugs marked `fixed: true`
- Revenue impact from those bugs removed
- Version number incremented (minor: `1.0 → 1.1`)
- Notification: "🩹 Patch [version] released for [Product]. Bugs squashed."
- If product was `dead` and all critical/major bugs are now fixed, status returns to `shipped`

---

## Major Release System

A major release is a full new version of an existing product. It creates a **new project entry** that goes through development like any other project, while the old version stays live (and keeps earning) until the new one ships.

### Initiating a Major Release

On `/projects/[id]` for any shipped, dead, or archived product, show a **"Plan Major Release"** button.

This navigates to `/projects/new` but pre-filled and labelled as a major release:
- Project name pre-filled as "[Original Name] 2.0" (editable)
- Project type locked to same type as the original
- Category can be changed (player can pivot)
- Pricing model and price can be changed
- Feature selection starts fresh — player picks from the full feature pool again
  - Previously shipped features are shown with a ✅ "Carried over" tag and cost **half WU** (you're not rebuilding from scratch)
  - New features cost full WU
  - All bugs from the parent are automatically included as "Bug Fixes" line items (each costs WU per the patch table above)
  - Player can deselect individual bug fixes (risky — they carry over to the new version)

### During Development of a Major Release
- The **old version stays live** and keeps generating revenue (and accumulating bugs)
- The new version shows as `in_development` with a "v2.0" badge
- On the dashboard, both appear — old under "Shipped", new under "In Development"

### On Ship
- New version ships as a new `Project` entry with `parentProjectId` set to the old project's ID
- Old project status → `archived`, `archivedWeek` set
- Archived project moves to a collapsed **"Archive"** section at the bottom of `/projects/[id]` and the dashboard
- Version number: major bump (`1.2 → 2.0`)
- Reputation +5 (shipping a new major version is good for the brand)
- Revenue boost on launch: starts higher than a brand new product because of existing brand recognition
  - `launchBoost = previousProduct.reputation * 0.3` added to initial subscriber/sales count

### Major Release Rules
- Only one major release in development at a time (shares the single active project slot)
- Cannot be started if a patch is currently in progress (finish the patch first)
- Dead products can still get a major release — this is the main recovery path

---

## UI Changes

### `/projects/[id]` — Shipped Product (updated)

Add a **Bug Report section**:
- Bug count summary: e.g. "3 bugs — 1 critical, 1 major, 1 minor"
- Escalation stage indicator (none / ⚠️ Grumbling / 🔴 Rep Damage / 💀 Dead)
- List of unfixed bugs with severity badges and weekly revenue cost each
- **"Release Patch →"** button
- **"Plan Major Release →"** button
- Version number displayed in header (e.g. "v1.2")

### `/projects/[id]` — Active Patch Job (shown on the product's page)

- "PATCH IN PROGRESS" banner
- Progress bar (WU invested / WU required)
- List of bugs being fixed
- Estimated weeks remaining
- "Cancel Patch" option (bugs remain unfixed, WU spent is lost)

### Dashboard — Active Patch

Show the active patch job in the "Active Projects" section as a card:
- Label: "🩹 Patching [Product Name]"
- Progress bar
- Bugs being fixed count

### Dashboard — Archived Products

Archived products do not appear in "Shipped Products". Add a collapsed **"Archived"** section at the bottom of the dashboard showing archived product names, final version, and total lifetime revenue.

---

## `weekTick.ts` Updates

Add to the weekly tick function:

```typescript
// 1. Accumulate bugs on all shipped products
for (const project of shippedProjects) {
  project.bugAccumulator += calcBugsThisWeek(project);
  while (project.bugAccumulator >= 1) {
    project.bugs.push(generateBug(project));
    project.bugAccumulator -= 1;
  }
}

// 2. Apply bug revenue impact
for (const project of shippedProjects) {
  const unfixedBugs = project.bugs.filter(b => !b.fixed);
  const bugRevenueLoss = unfixedBugs.reduce((sum, b) => sum + b.revenueImpact, 0);
  project.weeklyRevenue = Math.max(0, project.weeklyRevenue - bugRevenueLoss);
}

// 3. Check escalation thresholds and apply reputation damage / product death
checkEscalation(state);

// 4. Advance active patch job
if (state.activePatchJob) {
  state.activePatchJob.wuInvested += playerWuPerWeek;
  if (state.activePatchJob.wuInvested >= state.activePatchJob.wuRequired) {
    completePatch(state);
  }
}
```

---

## Version Numbering Convention

| Event | Version Change | Example |
|---|---|---|
| Initial ship | 1.0 | v1.0 |
| Patch released | +0.1 | v1.1, v1.2 |
| Major release ships | Next whole number | v2.0 |
| Patch on major release | +0.1 | v2.1 |

---

## Notes for Claude Code

- `activePatchJob` sits on `GameState` at the top level, not inside the project — this enforces the one-at-a-time rule simply
- Bug flavour text strings should live in `engine/bugs.ts` as arrays, picked randomly by severity
- The "carried over features at half WU" logic lives in the major release factory function in `projects.ts`
- Dead products should be visually distinct on the dashboard — grey card with 💀 and "DEAD" chip, but still tappable
- Archived products should not appear in the main project lists — only in the collapsed archive section
- Add `bugAccumulator: number` (float) to `Project` to handle fractional bug accumulation between weeks
