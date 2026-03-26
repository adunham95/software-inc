# Startup Inc — Game Spec for Claude Code

## Overview

A mobile-first, turn-based startup simulation game built with SvelteKit and Tailwind CSS. Inspired by Software Inc. All game state is stored locally in `localStorage`. No backend required.

---

## Tech Stack

- **Framework**: SvelteKit (use `export const ssr = false` on all game pages)
- **Styling**: Tailwind CSS (mobile-first, `sm:` breakpoints only where needed)
- **Storage**: `localStorage` via a centralized store
- **State**: Svelte stores (`writable`, `derived`)
- **Routing**: Multi-page SvelteKit file-based routing (see Route Map below)

---

## Core Gameplay Loops (v1)

### 1. Develop & Ship Software Products

- Player creates software projects (e.g. "Mobile App", "SaaS Tool", "Browser Extension")
- Each project has a **progress bar** measured in Work Units (WU)
- Each week, the player contributes WU to the active project
- When progress reaches 100%, the product ships and generates revenue
- Products have a **quality score** (0–100) based on how many features were completed and bugs fixed
- Revenue decays slowly over time (market saturation)

### 2. Research New Tech / Skills

- A **Research Tree** with unlockable technologies (e.g. "Cloud Hosting", "AI Features", "Mobile Dev")
- Each research item takes X weeks to complete
- Unlocking techs boosts revenue multipliers, unlocks new product types, reduces bug rates, and unlocks new features

---

## Time System — Turn-Based (Week Advance)

- Game time is measured in **Weeks**
- Player taps **"Advance Week"** button to progress
- Each week tick:
  1. Active project gains WU progress (features complete incrementally)
  2. Active research gains progress
  3. Revenue from shipped products is added to cash
  4. Random events may fire (1 in 8 chance per week)

- Week counter shown in header (e.g. "Week 12 · Year 1")

---

## Route Map

```
/                         ← Dashboard (overview)
/projects/new             ← New Project form
/projects/[id]            ← Individual project detail page
/research                 ← Research tree page
```

### Navigation

- Sticky bottom nav bar with icons: **Dashboard**, **Projects**, **Research**
- Each page has a back arrow where relevant
- The "Advance Week" button lives only on the Dashboard (bottom of page, above nav)

---

## Game State Shape

Store everything in one serializable object saved to `localStorage` under the key `startup_inc_save`.

```typescript
interface GameState {
  meta: {
    companyName: string;
    week: number;
    year: number;           // starts at 1
    cash: number;           // starting cash: $5,000
    reputation: number;     // 0–100
    totalEarned: number;    // lifetime revenue earned
  };

  projects: Project[];
  research: ResearchState;
  notifications: Notification[];
}

// ─── Project ────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  type: ProjectType;
  status: 'in_development' | 'shipped' | 'cancelled';

  // Pricing
  pricingModel: 'one_time' | 'subscription';
  price: number;             // $ set by player at creation
                             // one_time: paid once per "sale"
                             // subscription: per user per week

  // Development progress
  progress: number;          // 0–100 WU
  totalWuRequired: number;   // base WU + WU added by selected features
  quality: number;           // 0–100
  bugsFound: number;
  bugsFixed: number;

  // Features
  features: ProjectFeature[];

  // Market performance (populated on ship)
  weeklyRevenue: number;
  activeSubscribers: number; // only used if pricingModel === 'subscription'
  revenueDecayRate: number;  // % reduction per week
  weeksOnMarket: number;
  totalRevenue: number;      // lifetime revenue for this product
  revenueHistory: number[];  // weekly revenue last 8 weeks

  // Metadata
  weekStarted: number;
  weekShipped: number | null;
  techRequired: string[];
}

type ProjectType = 'browser_ext' | 'mobile_app' | 'saas' | 'desktop_app' | 'ai_product';

// ─── Features ───────────────────────────────────────────────

interface ProjectFeature {
  id: string;
  name: string;
  description: string;
  wuCost: number;            // extra WU this feature adds to the project
  revenueBoost: number;      // flat $/week added to revenue when shipped
  qualityBoost: number;      // +quality points when this feature completes
  status: 'not_started' | 'in_progress' | 'complete';
  progressWu: number;        // WU invested into this feature so far
  unlockRequires: string[];  // research IDs needed to select this feature
}

// ─── Research ───────────────────────────────────────────────

interface ResearchState {
  completed: string[];
  inProgress: string | null;
  progressWu: number;
  tree: ResearchNode[];
}

interface ResearchNode {
  id: string;
  name: string;
  description: string;
  weeksToComplete: number;
  unlocks: string;           // human-readable description
  requires: string[];
  category: 'frontend' | 'backend' | 'mobile' | 'ai' | 'infrastructure';
}

// ─── Notifications ──────────────────────────────────────────

interface Notification {
  id: string;
  week: number;
  message: string;
  type: 'success' | 'warning' | 'info' | 'danger';
}
```

---

## Pricing Model

When creating a project, the player sets:

1. **Pricing Model**: One-time purchase OR Subscription
2. **Price**: A dollar amount they choose (within a suggested range)

### How pricing affects revenue on ship:

#### One-Time Purchase

- Revenue is based on simulated "sales per week"
- Sales/week = derived from product quality + reputation
- `weeklyRevenue = salesPerWeek * price`
- Sales/week decays over time (market saturation)
- Sweet spot: too cheap = low revenue, too expensive = fewer sales
- Suggested price range shown in the form

#### Subscription

- Revenue is based on simulated active subscribers
- Subscribers grow weekly based on quality + reputation, then churn slowly
- `weeklyRevenue = activeSubscribers * price`
- Churn rate: ~2–5%/week depending on quality
- New subscriber rate decays over time

#### Price Guidance (shown in /projects/new)

| Type              | One-Time Range | Subscription Range |
| ----------------- | -------------- | ------------------ |
| Browser Extension | $1 – $15       | $1 – $5/mo         |
| Mobile App        | $2 – $20       | $3 – $15/mo        |
| SaaS Tool         | $50 – $500     | $10 – $99/mo       |
| Desktop App       | $10 – $100     | $5 – $30/mo        |
| AI Product        | $20 – $200     | $15 – $150/mo      |

Prices far outside the range apply a demand penalty — this is visible in the revenue projection on the form.

---

## Project Features

Each project type has a pool of available features. The player selects which features to include when creating the project. Features are worked on sequentially in selection order. When a feature's WU cost is fully invested, it completes, boosts quality, and the engine moves to the next.

### Feature Pools by Project Type

#### Browser Extension (base WU: 10)

| Feature             | WU Cost | Revenue Boost | Quality | Requires        |
| ------------------- | ------- | ------------- | ------- | --------------- |
| Popup UI            | 5       | +$50/wk       | +5      | —               |
| Context Menu        | 4       | +$30/wk       | +4      | —               |
| Dark Mode           | 3       | +$40/wk       | +6      | `ui_ux`         |
| Sync Across Devices | 8       | +$100/wk      | +8      | `cloud_hosting` |
| Custom Shortcuts    | 4       | +$50/wk       | +5      | —               |
| Analytics Dashboard | 7       | +$120/wk      | +7      | `web_basics`    |

#### Mobile App (base WU: 30)

| Feature            | WU Cost | Revenue Boost | Quality | Requires       |
| ------------------ | ------- | ------------- | ------- | -------------- |
| Push Notifications | 6       | +$200/wk      | +6      | —              |
| User Auth          | 8       | +$150/wk      | +8      | `security`     |
| In-App Chat        | 12      | +$300/wk      | +10     | `mobile_dev`   |
| Offline Mode       | 10      | +$250/wk      | +9      | —              |
| Dark Mode          | 4       | +$100/wk      | +5      | `ui_ux`        |
| Social Sharing     | 5       | +$150/wk      | +6      | —              |
| Analytics          | 7       | +$180/wk      | +7      | `web_basics`   |
| In-App Purchases   | 10      | +$400/wk      | +8      | `monetization` |

#### SaaS Tool (base WU: 40)

| Feature             | WU Cost | Revenue Boost | Quality | Requires      |
| ------------------- | ------- | ------------- | ------- | ------------- |
| User Auth & Teams   | 10      | +$400/wk      | +8      | `security`    |
| REST API            | 12      | +$600/wk      | +10     | `web_basics`  |
| Webhooks            | 8       | +$350/wk      | +7      | `web_basics`  |
| Admin Dashboard     | 10      | +$500/wk      | +9      | `ui_ux`       |
| CSV Export          | 5       | +$200/wk      | +5      | —             |
| Email Notifications | 6       | +$250/wk      | +6      | —             |
| Custom Branding     | 7       | +$300/wk      | +7      | `ui_ux`       |
| AI Automation       | 15      | +$1,200/wk    | +12     | `ai_features` |

#### Desktop App (base WU: 35)

| Feature            | WU Cost | Revenue Boost | Quality | Requires        |
| ------------------ | ------- | ------------- | ------- | --------------- |
| Auto-Updater       | 6       | +$200/wk      | +7      | `devops`        |
| Offline Mode       | 8       | +$300/wk      | +8      | —               |
| Plugin System      | 14      | +$500/wk      | +10     | `web_basics`    |
| Cloud Sync         | 10      | +$400/wk      | +9      | `cloud_hosting` |
| Dark Mode          | 4       | +$150/wk      | +5      | `ui_ux`         |
| Keyboard Shortcuts | 5       | +$180/wk      | +6      | —               |
| Multi-Language     | 8       | +$350/wk      | +7      | —               |

#### AI Product (base WU: 60)

| Feature             | WU Cost | Revenue Boost | Quality | Requires      |
| ------------------- | ------- | ------------- | ------- | ------------- |
| Chat Interface      | 10      | +$800/wk      | +10     | `ai_features` |
| API Access          | 12      | +$1,000/wk    | +10     | `ai_features` |
| Custom Model Tuning | 20      | +$2,000/wk    | +15     | `ai_features` |
| Data Export         | 6       | +$400/wk      | +6      | —             |
| Team Collaboration  | 10      | +$600/wk      | +8      | `security`    |
| Usage Analytics     | 8       | +$500/wk      | +7      | `web_basics`  |
| Webhook Integration | 8       | +$700/wk      | +8      | `web_basics`  |

---

## Page Specs

### `/` — Dashboard

**Header (sticky top)**

- Company name
- Week + Year (e.g. "Week 14 · Year 1")
- Cash balance (large monospace green)

**Section: Stats Row**

- 3 stat chips: Revenue/wk · Active Projects · Reputation

**Section: Active Projects**

- Compact cards per in-dev project
- Shows: name, type badge, overall progress bar, current feature in progress
- Tap → `/projects/[id]`
- "+ New Project" tappable card at the end

**Section: Shipped Products**

- Cards showing: name, ONE-TIME / SUB badge, weekly revenue, weeks on market
- Tap → `/projects/[id]`

**Section: Research**

- Current research name + progress bar + weeks remaining
- "View Research Tree →" link

**Section: Notifications**

- Last 8 events, reverse chron, color-coded

**Bottom (sticky)**

- **"⏭ Advance Week"** full-width primary button, above the nav bar

---

### `/projects/new` — New Project Form

Full-page form. Fields in order:

1. **Project Name** — text input
2. **Project Type** — select (only show types unlocked via research; Browser Extension always available)
3. **Pricing Model** — segmented toggle: "One-Time" | "Subscription"
4. **Price** — number input; helper text shows suggested range for selected type + model
5. **Features** — checklist of features for the selected type
   - Each row: checkbox, name, WU cost, revenue boost, quality boost
   - Locked features greyed out with "Requires: [research name]" label
   - At least 1 feature must be selected
6. **Live Summary panel** (updates as player picks):
   - Total WU required
   - Estimated weeks (WU total ÷ player's WU/week)
   - Projected weekly revenue (rough estimate based on current quality/rep/price)

**"Start Project"** button — creates project, navigates to `/projects/[id]`.

If a project is already in development: show a warning banner at top, disable the Start button.

---

### `/projects/[id]` — Project Detail

#### In Development

**Header**

- Project name + type badge
- "IN DEVELOPMENT" status chip

**Progress**

- Overall progress bar (WU done / WU total, %)
- Estimated weeks remaining
- Current feature: name + its own mini progress bar
- Feature list: all selected features with status icons (✅ complete · 🔄 in progress · ⏳ pending)

**Info**

- Quality score (live)
- Pricing model + price
- Projected weekly revenue

**Actions**

- "Cancel Project" — destructive, confirmation required

---

#### Shipped

**Header**

- Project name + type badge
- "LIVE 🟢" chip + weeks on market

**Revenue**

- Weekly Revenue (large)
- Total Revenue Earned (lifetime)
- Pricing model badge + price point
- Revenue decay indicator (e.g. "↘ -0.5%/wk")
- If subscription: Active Subscribers + churn rate

**Performance History**

- Last 8 weeks of revenue as a simple text bar chart using block characters (no external chart lib)
- Peak revenue week stat

**Features**

- Final quality score
- All completed features listed with ✅

---

### `/research` — Research Tree

**Top Banner** — "Currently Researching: [name] — X weeks remaining" (if active)

**Tabs or collapsible sections** by category: Frontend · Backend · Mobile · AI · Infrastructure

Each node card shows:

- Name, weeks to complete
- Unlock description
- Prerequisite badges (greyed if not met)
- State styling:
  - **Locked** — grey, muted
  - **Available** — white border, tappable
  - **In Progress** — pulsing green border + progress bar
  - **Complete** — filled green + ✅

Tap an Available node → starts research (if research already active, show confirmation: "Replace current research?")

---

## Research Tree (v1 nodes)

| ID              | Name                | Weeks | Unlocks                                              | Requires        |
| --------------- | ------------------- | ----- | ---------------------------------------------------- | --------------- |
| `web_basics`    | Web Basics          | 2     | Unlocks SaaS & Desktop App projects                  | —               |
| `mobile_dev`    | Mobile Dev          | 3     | Unlocks Mobile App projects                          | —               |
| `cloud_hosting` | Cloud Hosting       | 4     | +20% revenue on SaaS, unlocks cloud features         | `web_basics`    |
| `agile_process` | Agile Process       | 2     | +1 WU/week productivity                              | —               |
| `ui_ux`         | UI/UX Design        | 3     | Unlocks design features, +10 quality on all projects | `web_basics`    |
| `ai_features`   | AI Features         | 5     | Unlocks AI Product type + AI features                | `cloud_hosting` |
| `devops`        | DevOps              | 4     | -50% revenue decay rate                              | `cloud_hosting` |
| `security`      | Security Hardening  | 3     | Unlocks auth features, -30% bug rate                 | `web_basics`    |
| `monetization`  | Monetization Engine | 3     | Unlocks In-App Purchases, +25% revenue               | `agile_process` |

---

## Random Events (1 in 8 chance per week)

- 🚀 **Viral Moment** — A shipped product gains +$500/wk for 4 weeks
- 🐛 **Critical Bug** — A shipped product loses 10 quality and -20% revenue
- 💸 **Angel Investor** — +$10,000 cash
- 📉 **Market Dip** — All revenues -10% for 3 weeks
- 🏆 **Industry Award** — Reputation +10
- 👾 **Competitor Launch** — Top product revenue decays 2x faster for 4 weeks
- 🔧 **Tech Debt** — Active project loses 5 WU progress
- 🌟 **Press Coverage** — Reputation +5, next shipped product starts with +$500 revenue

---

## Player Productivity (No Employees in v1)

- Base: **5 WU/week** on active project, **2 RP/week** on active research
- `agile_process` research boosts to **6 WU/week**
- WU is applied to the current in-progress feature; on completion moves to the next
- Player works on 1 project and 1 research simultaneously

---

## File Structure

```
src/
  lib/
    types.ts
    stores/
      gameStore.ts            ← writable + localStorage persistence
      derived.ts              ← totalWeeklyRevenue, activeProject, etc.
    engine/
      weekTick.ts             ← pure fn: (GameState) => GameState
      events.ts               ← random events
      research.ts             ← RESEARCH_TREE constant
      projects.ts             ← PROJECT_TYPES + FEATURE_POOLS constants
      pricing.ts              ← revenue calculation (demand curve, churn, decay)
      defaults.ts             ← defaultGameState()
    components/
      BottomNav.svelte
      AdvanceWeekButton.svelte
      ProjectCard.svelte
      ShippedProductCard.svelte
      FeatureCheckList.svelte
      FeatureProgress.svelte
      ResearchNode.svelte
      NotificationLog.svelte
      StatChip.svelte
      RevenueChart.svelte     ← text block-char sparkline
  routes/
    +layout.svelte            ← shell: BottomNav persistent
    +layout.ts                ← export const ssr = false
    +page.svelte              ← Dashboard
    projects/
      new/
        +page.svelte
      [id]/
        +page.svelte
    research/
      +page.svelte
```

---

## localStorage Persistence

```typescript
// gameStore.ts
import { writable } from 'svelte/store';
import type { GameState } from '$lib/types';
import { defaultGameState } from '$lib/engine/defaults';

const SAVE_KEY = 'startup_inc_save';

function loadSave(): GameState {
  if (typeof localStorage === 'undefined') return defaultGameState();
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? JSON.parse(raw) : defaultGameState();
}

export const game = writable<GameState>(loadSave());

game.subscribe((state) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }
});

export function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  game.set(defaultGameState());
}
```

---

## Pricing Engine Logic (`pricing.ts`)

```typescript
// On ship, calculate initial weeklyRevenue:
function calcInitialRevenue(project: Project, reputation: number): number {
  const qualityFactor = project.quality / 100;
  const repFactor = reputation / 100;
  const featureRevenue = project.features
    .filter(f => f.status === 'complete')
    .reduce((sum, f) => sum + f.revenueBoost, 0);

  if (project.pricingModel === 'one_time') {
    const demandScore = qualityFactor * 0.6 + repFactor * 0.4;
    const baseSales = demandScore * 20; // up to ~20 sales/wk at perfect scores
    const pricePenalty = Math.max(0.2, 1 - (project.price / getMaxPrice(project.type)) * 0.8);
    return Math.round(baseSales * pricePenalty) * project.price + featureRevenue;
  } else {
    // Subscription: derive initial subscriber count
    const initialSubs = Math.round((qualityFactor * 0.6 + repFactor * 0.4) * 500);
    return initialSubs * project.price + featureRevenue;
  }
}

// Each week tick for shipped products:
function tickShippedProject(project: Project): Project {
  if (project.pricingModel === 'subscription') {
    const churnRate = 0.03 - (project.quality / 100) * 0.015; // 1.5–3%/wk
    const newSubsRate = Math.max(0, 0.05 - project.weeksOnMarket * 0.001);
    const churn = Math.floor(project.activeSubscribers * churnRate);
    const newSubs = Math.floor(project.activeSubscribers * newSubsRate);
    project.activeSubscribers = Math.max(0, project.activeSubscribers - churn + newSubs);
    project.weeklyRevenue = project.activeSubscribers * project.price;
  } else {
    project.weeklyRevenue *= (1 - project.revenueDecayRate / 100);
  }
  project.revenueHistory = [...(project.revenueHistory.slice(-7)), project.weeklyRevenue];
  project.totalRevenue += project.weeklyRevenue;
  project.weeksOnMarket++;
  return project;
}
```

---

## Design Direction

- **Theme**: Dark mode — deep navy/charcoal backgrounds, neon green accents (`#00FF87`)
- **Font**: `JetBrains Mono` or `IBM Plex Mono` for numbers/money; clean sans for body text
- **Feel**: Terminal/hacker meets startup dashboard
- Cards with subtle glowing borders, monospace money figures, minimal icons
- Tailwind only — no custom CSS files
- Mobile-first: 390px base width

---

## v1 Scope Boundaries (Do NOT build yet)

- No employees / hiring
- No office management
- No multiplayer or cloud save
- No sound effects or complex animations
- No achievements

---

## Starting Game State

```typescript
export function defaultGameState(): GameState {
  return {
    meta: {
      companyName: 'My Startup',
      week: 1,
      year: 1,
      cash: 5000,
      reputation: 10,
      totalEarned: 0,
    },
    projects: [],
    research: {
      completed: [],
      inProgress: null,
      progressWu: 0,
      tree: RESEARCH_TREE,
    },
    notifications: [
      {
        id: crypto.randomUUID(),
        week: 1,
        message: 'Welcome! Your startup journey begins. Build your first product.',
        type: 'info',
      },
    ],
  };
}
```

---

## First Prompt for Claude Code

> "Build Startup Inc using this spec. Work in this order:
>
> 1. `src/lib/types.ts` — all interfaces
> 2. `src/lib/engine/research.ts` — RESEARCH_TREE constant
> 3. `src/lib/engine/projects.ts` — PROJECT_TYPES and FEATURE_POOLS
> 4. `src/lib/engine/pricing.ts` — revenue calculation functions
> 5. `src/lib/engine/weekTick.ts` — pure week advance function
> 6. `src/lib/engine/defaults.ts` — defaultGameState()
> 7. `src/lib/stores/gameStore.ts` — writable store with localStorage
> 8. `src/routes/+layout.svelte` + `+layout.ts` — shell with BottomNav, ssr = false
> 9. `src/routes/+page.svelte` — Dashboard
> 10. `src/routes/projects/new/+page.svelte` — New Project form
> 11. `src/routes/projects/[id]/+page.svelte` — Project detail
> 12. `src/routes/research/+page.svelte` — Research tree
>     Use dark mode Tailwind throughout. Mobile-first at 390px."
