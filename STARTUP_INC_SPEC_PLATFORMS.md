# Startup Inc — Spec Addendum: Platforms

This document extends all previous spec files. Apply on top of everything else.

---

## Overview

A Platform is a named umbrella that groups a backend API with up to four client products (Mobile App, SaaS Tool, Desktop App, Landing Page). Products inside a platform share a user base, benefit from platform brand strength, and are dependent on the API — if the API goes down, everything goes down. Each product still earns independently but receives a platform bonus on top.

Think: you build a social media backend API, attach a Mobile App and a Desktop App to it, put up a Landing Page to drive signups, and all three share the same pool of registered users.

---

## Research Gate

Platforms are locked behind a new research node:

| ID | Name | Weeks | Cash Cost | Unlocks | Requires |
|---|---|---|---|---|---|
| `platform_architecture` | Platform Architecture | 6 | $5,000 | Platform creation, API product type | `cloud_hosting`, `security` |

Add this node to the research tree in `research.ts`. Until `platform_architecture` is complete, the "Create Platform" option does not appear anywhere in the UI.

---

## Type Changes

### New top-level `Platform` interface

```typescript
interface Platform {
  id: string;
  name: string;                       // e.g. "SocialSphere"
  description: string;                // player-written tagline
  weekCreated: number;

  // Core API (required — the platform cannot exist without it)
  apiProjectId: string | null;        // null while API is still in development

  // Sub-products (each is a normal Project with platformId set)
  subProductIds: string[];            // max 3 client products + 1 landing page

  // Shared user base
  sharedUsers: number;                // total registered users across the platform
  weeklyNewUsers: number;             // derived each tick from all sub-products
  weeklyChurnedUsers: number;         // derived each tick

  // Platform brand
  brandStrength: number;              // 0–100, grows with users + reputation
  marketingBonus: number;             // % growth bonus applied to all sub-products

  // Status
  status: 'building' | 'live' | 'degraded' | 'offline';
  // building  = API not shipped yet
  // live      = API up, at least one sub-product shipped
  // degraded  = API has critical bugs but still running
  // offline   = API is down (outage or death) — all sub-products earn $0
}
```

### Updated `Project`

```typescript
interface Project {
  // ... existing fields ...
  platformId: string | null;          // null if standalone product
  isPlatformApi: boolean;             // true if this is the backbone API project
  isLandingPage: boolean;             // true if this is the platform's landing page
  platformBonus: number;              // % revenue bonus from being on the platform (derived)
}
```

### Updated `GameState`

```typescript
interface GameState {
  // ... existing fields ...
  platforms: Platform[];
}
```

---

## New Product Type: API

Add `'api'` to `ProjectType`:

```typescript
type ProjectType = 'api' | 'basic_website' | 'browser_ext' | 'mobile_app' | 'saas' | 'desktop_app' | 'ai_product';
```

The API is always the first product created when starting a platform. It cannot exist as a standalone product — it must belong to a platform.

### API base stats

| Property | Value |
|---|---|
| Base WU | 50 |
| Pricing | Not priced directly — revenue comes from API call volume |
| Hosting | Always requires hosting (external or self) |
| Decay | Does not decay in the traditional sense — see API Revenue below |
| Unlock | `platform_architecture` research |

### API Revenue

The API earns revenue from simulated API calls made by sub-product users:

```
apiWeeklyRevenue = sharedUsers * apiCallRate * pricePerCall
```

- `apiCallRate`: avg calls per user per week, varies by platform category (see below)
- `pricePerCall`: set by the player at API creation ($0.001 – $0.05), shown with a demand curve hint
- Revenue grows naturally as the shared user base grows
- API does **not** have a pricing model toggle — it is always usage-based

### API Feature Pool (base)

| Feature | WU | Revenue Effect | Quality | Requires |
|---|---|---|---|---|
| Authentication | 10 | Enables User Auth on all sub-products for free | +10 | `security` |
| Rate Limiting | 6 | -30% outage risk | +8 | — |
| Analytics Endpoint | 8 | +15% API revenue | +7 | `web_basics` |
| Webhooks | 8 | Unlocks Webhook feature on sub-products for free | +8 | `web_basics` |
| SDKs (JS, Python) | 10 | +20% API revenue, -1 WU cost on sub-product features | +9 | — |
| GraphQL Support | 10 | +25% API revenue | +9 | `web_basics` |
| Admin Console | 8 | +10% platform brand strength/wk | +8 | `ui_ux` |

### API Categories

The API's category defines the platform's theme and affects call rates and which sub-product categories make sense:

| Category | Call Rate/User/Wk | Suggested Sub-Categories |
|---|---|---|
| `social_network` | 120 | Mobile: chat, entertainment / SaaS: analytics / Desktop: media player |
| `developer_platform` | 80 | SaaS: devtools / Desktop: developer tool / Mobile: education |
| `ecommerce` | 50 | SaaS: finance, crm / Mobile: entertainment / Desktop: productivity |
| `media_streaming` | 200 | Mobile: entertainment / Desktop: media player / SaaS: analytics |
| `productivity_suite` | 40 | SaaS: productivity / Desktop: productivity / Mobile: education |
| `fintech` | 60 | SaaS: finance / Mobile: fitness / Desktop: security |

---

## Platform Landing Page

The Landing Page is a special Basic Website attached to the platform. It does not earn direct revenue — its sole purpose is boosting the platform's `marketingBonus` and `brandStrength`.

```
landingPageBrandBoost = (quality / 100) * 20   // up to +20 brand strength
landingPageMarketingBonus = (quality / 100) * 0.25  // up to +25% growth bonus on all sub-products
```

- Built like a normal Basic Website but locked to the platform (cannot be standalone)
- Uses the Basic Website feature pool + Landing Page category features
- No pricing — it earns $0 directly
- Shown separately from revenue-earning products on the platform page

---

## Shared User Base

The platform maintains one `sharedUsers` count. Every week:

```typescript
// New users = sum of new user acquisition across all live sub-products
// (each sub-product's subscriber/sales growth contributes to the shared pool)
weeklyNewUsers = sum(subProducts.map(p => calcNewUsersThisWeek(p)));

// Churn = users lost across all sub-products
weeklyChurnedUsers = sum(subProducts.map(p => calcChurnThisWeek(p)));

platform.sharedUsers += weeklyNewUsers - weeklyChurnedUsers;
platform.sharedUsers = Math.max(0, platform.sharedUsers);
```

Sub-products no longer track their own subscriber count independently — they reference `platform.sharedUsers` instead. Each sub-product's revenue is:

```
subProductRevenue = (sharedUsers * conversionRate * price) + featureRevenue + platformBonus
```

Where `conversionRate` is the fraction of shared users who actually pay for that specific product (e.g. not all social media users pay for the desktop app).

| Sub-Product Type | Conversion Rate |
|---|---|
| Mobile App | 35% |
| SaaS Tool | 15% |
| Desktop App | 20% |
| Landing Page | 0% (no revenue) |

---

## Platform Brand & Marketing Bonus

`brandStrength` grows each week based on:
- Total shared users (more users = stronger brand)
- Landing page quality (if built)
- Admin Console API feature (if built)
- Reputation (global)

```
brandGrowth = (sharedUsers / 10000) + (landingPage?.quality / 200) + (adminConsole ? 0.5 : 0)
platform.brandStrength = Math.min(100, platform.brandStrength + brandGrowth)
```

`marketingBonus` (applied to all sub-products' growth rates):

```
marketingBonus = (brandStrength / 100) * 0.5   // up to +50% growth rate at full brand strength
               + (landingPage ? landingPageMarketingBonus : 0)
```

This means a fully built platform with a high-quality landing page can give its sub-products up to +75% organic growth rate on top of any direct marketing spend.

---

## Interconnections

### 1. API Downtime — Everything Goes Offline

If the API project reaches `status: 'dead'` (10+ bugs or critical bug ignored 6+ weeks):
- `platform.status → 'offline'`
- All sub-products earn $0 that week
- Notification: "🔴 [Platform] API is down. All products offline."
- The only fix is patching the API back to health — same patch system as normal products
- While offline, bugs continue to accumulate on sub-products

If the API has critical bugs but hasn't died yet:
- `platform.status → 'degraded'`
- All sub-products take a -30% revenue penalty
- Notification: "⚠️ [Platform] API is degraded. Products running at reduced capacity."

### 2. Bug Spread

Each week there is a chance a bug on one sub-product spreads to another:

```
spreadChance = 0.08 per unfixed major/critical bug   // 8% per bug per week
```

If spread fires:
- A minor bug is created on a random other live sub-product
- Notification: "🐛 A bug in [Product A] has caused an issue in [Product B]."

Bug spread is reduced by:
- `security` research: spread chance → 4%
- API `Rate Limiting` feature: spread chance → 3%

### 3. Shared Users — Churn Contagion

If one sub-product has Stage 2 or Stage 3 bug escalation, it accelerates churn for the entire platform:

```
// Per escalated sub-product:
platform.weeklyChurnedUsers += sharedUsers * 0.02   // +2% extra churn per escalated product
```

This means neglecting bugs on one product actively hurts all other products on the platform.

---

## Creating a Platform

### Flow

1. Player goes to a new **`/platforms/new`** page
2. Fills in:
   - **Platform Name** (e.g. "SocialSphere")
   - **Tagline / Description** (short text)
   - **API Category** (select — determines call rates and theming)
   - **Price per API call** (number input, $0.001 – $0.05, demand curve hint shown)
3. This creates the `Platform` entry with `status: 'building'` and navigates to **`/platforms/[id]`**
4. From the platform page, player taps **"Build API"** — this creates the API `Project` entry and navigates to `/projects/[id]` for the API
5. Once the API ships, `platform.status → 'live'` and the **"Add Product"** and **"Add Landing Page"** buttons appear on the platform page

### Adding Sub-Products

From `/platforms/[id]`, the player taps "Add Product" → navigates to `/projects/new` but:
- Project type is restricted to: Mobile App, SaaS Tool, Desktop App
- The new project is automatically assigned `platformId`
- Category selection is pre-suggested based on platform category (player can override)
- Only one project in development at a time still applies globally
- **Feature selection is gated by what the API has built** (see API Feature Unlocks below)

Maximum sub-products per platform: **3 client products + 1 landing page** (4 total, not counting the API).

---

## API Feature Unlocks

When a sub-product is built under a platform, its available feature pool is **not** the standard full pool. Instead, features are only available if the platform API has the corresponding capability built and shipped.

Each API feature unlocks a set of features across sub-product types. If the API feature is not complete, those sub-product features are hidden entirely from the checklist — not just greyed out, completely absent.

### Unlock Map

| API Feature | Unlocks on Mobile App | Unlocks on SaaS Tool | Unlocks on Desktop App |
|---|---|---|---|
| **Authentication** | User Auth, In-App Purchases | User Auth & Teams, Admin Dashboard | Cloud Sync, Auto-Updater |
| **Webhooks** | Social Sharing, Analytics | Webhooks, Email Notifications | Plugin System |
| **Analytics Endpoint** | Analytics | Custom Dashboards, Funnel Reports | — |
| **SDKs (JS, Python)** | Offline Mode, Push Notifications | REST API, CSV Export, Data Export | Keyboard Shortcuts, Multi-Language |
| **GraphQL Support** | In-App Chat | AI Automation | — |
| **Admin Console** | Dark Mode, Social Sharing | Custom Branding | Dark Mode |
| **Rate Limiting** | — | — | Offline Mode, Auto-Updater |

Additionally, **category features** on sub-products are gated by the API the same way. Each category feature maps to a required API feature:

| Category Feature Type | Required API Feature |
|---|---|
| Real-time features (live chat, live blog, live streaming) | GraphQL Support |
| Auth-dependent features (profiles, private messaging, paywalls) | Authentication |
| Data/analytics features (charts, reports, dashboards) | Analytics Endpoint |
| Cross-device / sync features | SDKs |
| Notification features | Webhooks |
| Any unlocked feature with no natural API dependency | Available freely |

### Practical Example — Social Network Platform

Player builds a social network API with: Authentication + Webhooks + Analytics Endpoint.

When they then create a Mobile App sub-product:
- ✅ Available: User Auth, In-App Purchases, Social Sharing, Analytics (all unlocked by built API features)
- ❌ Not shown: Push Notifications, Offline Mode, In-App Chat, Dark Mode (require SDKs or GraphQL which aren't built yet)

If the player later adds SDKs to the API (via a patch or major release), those features become available when building the next sub-product. Existing sub-products do **not** retroactively gain access — features are locked in at the time of sub-product creation.

### UI Changes — `/projects/new` for Platform Sub-Products

When creating a sub-product under a platform:
- Show a **"Powered by [Platform Name] API"** banner at the top of the feature list
- Features unlocked by the API are shown normally with a small API badge (e.g. 🔌) next to them
- Features not unlocked are completely hidden
- If zero features are available (API has nothing built yet), show an empty state: "Build more API features first to unlock options for this product"
- The form should show a summary of which API features are active so the player knows what's driving the available list

### API Major Release — Unlocking New Sub-Product Features

If the player builds a major release of the API that adds new features (e.g. adds GraphQL Support), any **new sub-products** created after that release will have access to the newly unlocked features. Existing sub-products still cannot add new features retroactively — they would need their own major release to pick up new capabilities.

---

## New Route: `/platforms`

Add to the route map:

```
/platforms                ← List of all platforms
/platforms/new            ← Create platform form
/platforms/[id]           ← Platform dashboard
```

Add **"Platforms"** to the bottom nav (replaces or sits alongside existing tabs — consider a 5th tab or nesting under Projects).

### `/platforms/[id]` — Platform Dashboard

**Header**
- Platform name + category badge
- Status chip: BUILDING / LIVE 🟢 / DEGRADED ⚠️ / OFFLINE 🔴

**Shared Stats Row**
- Total Users · Brand Strength · Marketing Bonus · API Revenue/wk

**API Card**
- Status, version, bugs, weekly revenue
- Tap → `/projects/[id]`

**Sub-Products**
- Card per sub-product: name, type, weekly revenue, platform bonus shown separately, bug count
- "+ Add Product" card (if < 3 client products)

**Landing Page**
- If built: quality score, brand boost, marketing bonus contribution
- If not built: "+ Add Landing Page" button

**Platform Health**
- Bug spread risk indicator
- Churn contagion warning (if any sub-product is escalated)
- Outage risk (if API is self-hosted and has unfixed bugs)

---

## Dashboard Updates

### Standalone vs Platform Products

On the main `/` dashboard, products that belong to a platform should be grouped differently from standalone products:

**Standalone Products** — shown as before in "Active Projects" and "Shipped Products"

**Platform Products** — shown as a single collapsed **Platform Card** in a new "Platforms" section:
- Platform name + status chip
- Combined revenue (API + all sub-products)
- User count
- Tap → `/platforms/[id]`

This keeps the dashboard from getting cluttered as the player builds out a full platform with 5 products.

---

## `weekTick.ts` Updates

Add a platform tick block after individual product ticks:

```typescript
for (const platform of state.platforms) {
  if (platform.status === 'offline') {
    // Zero out all sub-product revenue this week
    zeroSubProductRevenue(platform, state.projects);
    continue;
  }

  // 1. Calc shared user movement
  tickSharedUsers(platform, state.projects);

  // 2. Apply degraded penalty if API has critical bugs
  if (apiHasCriticalBugs(platform, state.projects)) {
    platform.status = 'degraded';
    applyDegradedPenalty(platform, state.projects);  // -30% revenue
  }

  // 3. Roll bug spread
  rollBugSpread(platform, state.projects, state.research);

  // 4. Apply churn contagion from escalated products
  applyChurnContagion(platform, state.projects);

  // 5. Update brand strength
  tickBrandStrength(platform, state.projects);

  // 6. Calc API revenue
  tickApiRevenue(platform, state.projects);
}
```

---

## Research Tree Update

Add to `research.ts`:

```typescript
{
  id: 'platform_architecture',
  name: 'Platform Architecture',
  description: 'Learn to design and build multi-product platforms around a shared API.',
  weeksToComplete: 6,
  cashCost: 5000,
  unlocks: 'Platform creation, API product type',
  requires: ['cloud_hosting', 'security'],
  category: 'infrastructure',
}
```

---

## Notes for Claude Code

- Platforms are a completely parallel system to standalone projects — do not try to merge the two. A project either has `platformId: null` (standalone) or belongs to a platform.
- The global "one active project at a time" rule still applies across everything — you cannot build an API and a sub-product simultaneously
- `platform.status` is derived each tick — do not let the player set it manually
- The bottom nav will now have 5 items: Dashboard · Projects · Platforms · Research · Setup — adjust `BottomNav.svelte` accordingly; use small icons + tiny labels to fit on 390px
- API projects should not appear in the standalone "Shipped Products" section on the dashboard — only within their platform card
- Landing pages should show $0 revenue clearly with a note explaining they are marketing-only assets
- The `/platforms/new` form should explain the platform concept briefly to the player — it is a significant investment (6 weeks research + 50 WU API build) and they should understand what they are getting into before committing
- API feature unlocks should be computed via a pure helper function `getUnlockedSubProductFeatures(apiProject, subProductType)` in `projects.ts` — call this when rendering the feature checklist on `/projects/new` for platform sub-products
- The unlock map should live as a constant `API_FEATURE_UNLOCK_MAP` in `projects.ts`, not hardcoded in the component
- Feature lock state for sub-products is determined at **creation time** and stored on the project — do not re-derive it on every render from the current API state, as the API may change after the sub-product is built
