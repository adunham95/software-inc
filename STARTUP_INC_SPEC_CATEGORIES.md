# Startup Inc — Spec Addendum: Categories & Advertising

This document extends `STARTUP_INC_SPEC.md`. Apply these changes on top of the existing spec.

---

## Changes to Types

### 1. Add `category` to `Project`

```typescript
interface Project {
  // ... all existing fields ...
  category: ProjectCategory;
}
```

### 2. Add `ProjectCategory` type

Each project type has its own set of valid categories:

```typescript
type ProjectCategory =
  // Basic Website
  | 'blog' | 'news' | 'portfolio' | 'landing_page' | 'community_forum'
  // Mobile App
  | 'dating' | 'chat' | 'entertainment' | 'fitness' | 'education'
  // SaaS Tool
  | 'productivity' | 'crm' | 'analytics' | 'devtools' | 'finance'
  // Desktop App
  | 'productivity' | 'video_game' | 'media_player' | 'developer_tool' | 'security'
  // Browser Extension
  | 'productivity' | 'privacy' | 'shopping' | 'developer' | 'social'
  // AI Product
  | 'writing_assistant' | 'code_assistant' | 'image_generation' | 'data_analysis' | 'customer_support';
```

### 3. Add `advertising` to `ProjectFeature` pool

The Advertising feature is available to **all project types**. It is listed as the last feature in every feature checklist.

```typescript
// Add to every project type's feature pool:
{
  id: 'advertising',
  name: 'Advertising',
  description: 'Run ads on your product. Generates passive ad revenue based on traffic/users.',
  wuCost: 4,
  revenueBoost: 0,            // revenue is calculated separately via adRevenue (see pricing)
  qualityBoost: -5,           // ads hurt user experience
  status: 'not_started',
  progressWu: 0,
  unlockRequires: [],
}
```

Ad revenue is tracked separately from `weeklyRevenue` so the player can see the breakdown:

```typescript
interface Project {
  // ... existing fields ...
  adRevenue: number;          // weekly ad revenue (0 if advertising feature not complete)
}
```

Ad revenue formula (calculated weekly when shipped):
- `adRevenue = weeklyTraffic * adRatePerUser`
- `weeklyTraffic` is derived from `quality` and `weeksOnMarket` (grows then plateaus)
- `adRatePerUser` varies by project type (websites get higher ad rates than apps)

| Project Type | Ad Rate/User/Week |
|---|---|
| Basic Website | $0.08 |
| Mobile App | $0.04 |
| SaaS Tool | $0.02 |
| Desktop App | $0.03 |
| Browser Extension | $0.05 |
| AI Product | $0.01 |

---

## New Project Type: Basic Website

Add `'basic_website'` to `ProjectType`:

```typescript
type ProjectType = 'basic_website' | 'browser_ext' | 'mobile_app' | 'saas' | 'desktop_app' | 'ai_product';
```

### Basic Website base stats

| Property | Value |
|---|---|
| Base WU | 8 |
| Base Revenue (one-time) | Very low — $0.50–$5 price range |
| Base Revenue (subscription) | Low — $1–$3/mo |
| Decay Rate | 1.5%/wk (highest of all types) |
| Unlocked by | Available from game start (no research needed) |

Basic Website is intentionally the lowest-revenue project type. Its main value is:
1. Available immediately with no research needed (alongside Browser Extension)
2. Advertising feature generates meaningful passive income when traffic grows
3. Good for learning the game loop early on

### Basic Website price guidance

| Model | Range |
|---|---|
| One-Time | $0.50 – $5 |
| Subscription | $1 – $3/mo |

### Basic Website base feature pool

| Feature | WU Cost | Revenue Boost | Quality | Requires |
|---------|---------|---------------|---------|----------|
| Contact Form | 3 | +$2/wk | +4 | — |
| Image Gallery | 3 | +$3/wk | +5 | — |
| SEO Optimisation | 5 | +$8/wk | +6 | `web_basics` |
| Email Newsletter | 6 | +$10/wk | +6 | — |
| Dark Mode | 3 | +$3/wk | +4 | `ui_ux` |
| Search | 5 | +$5/wk | +5 | `web_basics` |
| Social Share Buttons | 2 | +$2/wk | +3 | — |
| Advertising | 4 | (ad revenue) | -5 | — |

---

## Category System

### How it works

1. When creating a project in `/projects/new`, after picking **Project Type** the player picks a **Category** for that type.
2. The category unlocks an additional set of features appended below the base features in the checklist.
3. Base features are always available regardless of category.
4. Category features follow the same rules: WU cost, revenue boost, quality boost, optional research requirement.

### `/projects/new` form update

Insert a new step between "Project Type" and "Pricing Model":

**Step: Category** — a grid of category chips for the selected project type. Tap one to select. Required field.

---

## Category Feature Pools

### Basic Website Categories

#### Blog
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Post Editor | 6 | +$5/wk | +7 | — |
| Comment System | 5 | +$4/wk | +6 | — |
| RSS Feed | 3 | +$2/wk | +4 | `web_basics` |
| Author Profiles | 4 | +$3/wk | +5 | — |
| Tag & Category System | 4 | +$3/wk | +5 | — |

#### News
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Breaking News Banner | 4 | +$6/wk | +5 | — |
| Article Paywall | 8 | +$20/wk | +7 | `monetization` |
| Push Alerts | 6 | +$10/wk | +6 | — |
| Live Blog | 7 | +$12/wk | +8 | `web_basics` |
| Comment Section | 5 | +$4/wk | +5 | — |

#### Portfolio
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Project Showcase | 4 | +$3/wk | +8 | — |
| Client Testimonials | 3 | +$2/wk | +6 | — |
| Case Studies | 5 | +$4/wk | +7 | — |
| Booking Form | 5 | +$8/wk | +6 | — |

#### Landing Page
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Hero Animation | 5 | +$4/wk | +8 | `ui_ux` |
| A/B Test Variants | 8 | +$12/wk | +7 | `web_basics` |
| Lead Capture Form | 4 | +$8/wk | +6 | — |
| Video Embed | 3 | +$4/wk | +5 | — |
| Live Chat Widget | 6 | +$6/wk | +6 | — |

#### Community Forum
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Thread & Reply System | 8 | +$8/wk | +8 | `web_basics` |
| User Reputation | 5 | +$4/wk | +7 | — |
| Moderation Tools | 6 | +$2/wk | +6 | `security` |
| Private Messaging | 7 | +$10/wk | +7 | `security` |
| Badges & Awards | 4 | +$3/wk | +5 | — |

---

### Mobile App Categories

#### Dating
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Swipe Matching | 10 | +$300/wk | +10 | `mobile_dev` |
| Profile Builder | 7 | +$150/wk | +8 | — |
| Location-Based Discovery | 9 | +$250/wk | +9 | `mobile_dev` |
| Super Likes | 5 | +$200/wk | +6 | `monetization` |
| Video Date | 10 | +$350/wk | +10 | `mobile_dev` |

#### Chat
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Group Chats | 8 | +$200/wk | +8 | — |
| Voice Messages | 7 | +$180/wk | +8 | `mobile_dev` |
| End-to-End Encryption | 10 | +$150/wk | +10 | `security` |
| Stickers & Reactions | 5 | +$120/wk | +6 | — |
| Status Updates | 4 | +$100/wk | +5 | — |

#### Entertainment
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Content Feed | 8 | +$250/wk | +8 | — |
| Video Player | 9 | +$300/wk | +9 | `mobile_dev` |
| Personalised Recommendations | 10 | +$400/wk | +10 | `ai_features` |
| Creator Profiles | 6 | +$180/wk | +7 | — |
| Live Streaming | 12 | +$500/wk | +11 | `cloud_hosting` |

#### Fitness
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Workout Tracker | 7 | +$200/wk | +8 | — |
| Progress Charts | 6 | +$180/wk | +7 | `web_basics` |
| Meal Planner | 8 | +$220/wk | +8 | — |
| Wearable Sync | 9 | +$300/wk | +9 | `mobile_dev` |
| Coach AI | 12 | +$450/wk | +11 | `ai_features` |

#### Education
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Course Player | 8 | +$220/wk | +8 | — |
| Quiz Engine | 6 | +$180/wk | +7 | — |
| Progress Certificates | 5 | +$150/wk | +6 | — |
| Live Classes | 10 | +$350/wk | +10 | `cloud_hosting` |
| AI Tutor | 12 | +$500/wk | +11 | `ai_features` |

---

### SaaS Tool Categories

#### Productivity
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Word Editor | 10 | +$400/wk | +9 | `web_basics` |
| Spreadsheet Editor | 12 | +$500/wk | +10 | `web_basics` |
| Task Board (Kanban) | 8 | +$300/wk | +8 | — |
| Calendar Integration | 7 | +$250/wk | +7 | `web_basics` |
| Templates Library | 6 | +$200/wk | +7 | — |

#### CRM
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Contact Database | 8 | +$350/wk | +8 | — |
| Deal Pipeline | 9 | +$400/wk | +9 | — |
| Email Sequences | 10 | +$450/wk | +9 | `web_basics` |
| Activity Timeline | 6 | +$250/wk | +7 | — |
| Sales Forecasting | 10 | +$500/wk | +10 | `ai_features` |

#### Analytics
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Custom Dashboards | 9 | +$400/wk | +9 | `ui_ux` |
| Funnel Reports | 8 | +$350/wk | +8 | `web_basics` |
| Data Export | 5 | +$200/wk | +6 | — |
| Anomaly Detection | 10 | +$500/wk | +10 | `ai_features` |
| A/B Test Reports | 8 | +$350/wk | +8 | `web_basics` |

#### DevTools
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Code Editor | 10 | +$400/wk | +9 | `web_basics` |
| CI/CD Integration | 10 | +$450/wk | +9 | `devops` |
| Error Monitoring | 8 | +$350/wk | +8 | `web_basics` |
| Log Viewer | 6 | +$250/wk | +7 | — |
| AI Code Review | 12 | +$600/wk | +11 | `ai_features` |

#### Finance
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Invoice Generator | 7 | +$300/wk | +8 | — |
| Expense Tracker | 7 | +$280/wk | +7 | — |
| Bank Sync | 10 | +$500/wk | +10 | `security` |
| Tax Reports | 9 | +$450/wk | +9 | `web_basics` |
| Multi-Currency | 8 | +$350/wk | +8 | — |

---

### Desktop App Categories

#### Productivity
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Document Editor | 10 | +$350/wk | +9 | — |
| Spreadsheet Editor | 12 | +$400/wk | +10 | — |
| PDF Viewer | 6 | +$200/wk | +7 | — |
| Focus Timer | 5 | +$150/wk | +6 | — |
| Calendar Sidebar | 7 | +$250/wk | +7 | — |

#### Video Game
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Save System | 6 | +$200/wk | +8 | — |
| Leaderboard | 7 | +$250/wk | +7 | `cloud_hosting` |
| Controller Support | 5 | +$180/wk | +6 | — |
| Mod Support | 10 | +$400/wk | +10 | — |
| Steam Integration | 9 | +$500/wk | +9 | `devops` |

#### Media Player
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Playlist Manager | 6 | +$200/wk | +7 | — |
| Equaliser | 5 | +$150/wk | +6 | — |
| Format Support (FLAC etc) | 6 | +$180/wk | +7 | — |
| Chromecast / AirPlay | 8 | +$300/wk | +8 | `cloud_hosting` |
| Visualiser | 4 | +$100/wk | +5 | `ui_ux` |

#### Developer Tool
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Syntax Highlighting | 6 | +$200/wk | +7 | — |
| Git Integration | 8 | +$300/wk | +8 | `devops` |
| Terminal Emulator | 7 | +$250/wk | +7 | — |
| Extension Marketplace | 10 | +$400/wk | +10 | — |
| AI Autocomplete | 12 | +$600/wk | +11 | `ai_features` |

#### Security
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Password Vault | 8 | +$300/wk | +9 | `security` |
| 2FA Manager | 7 | +$250/wk | +8 | `security` |
| VPN Integration | 10 | +$400/wk | +9 | `security` |
| Breach Alerts | 6 | +$200/wk | +7 | `security` |
| Secure Notes | 5 | +$150/wk | +6 | — |

---

### Browser Extension Categories

#### Productivity
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Tab Manager | 6 | +$60/wk | +7 | — |
| Focus Mode (site blocker) | 5 | +$50/wk | +6 | — |
| Reading List | 4 | +$40/wk | +5 | — |
| Clipboard History | 5 | +$55/wk | +6 | — |

#### Privacy
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Ad Blocker | 7 | +$80/wk | +8 | `security` |
| Tracker Blocker | 7 | +$70/wk | +8 | `security` |
| Cookie Manager | 5 | +$50/wk | +6 | `security` |
| HTTPS Enforcer | 4 | +$40/wk | +6 | `security` |

#### Shopping
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Price Comparison | 8 | +$100/wk | +8 | `web_basics` |
| Coupon Finder | 6 | +$80/wk | +7 | — |
| Price History Chart | 7 | +$90/wk | +7 | `web_basics` |
| Wishlist Sync | 5 | +$60/wk | +6 | `cloud_hosting` |

#### Developer
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| JSON Formatter | 4 | +$40/wk | +6 | — |
| API Tester | 7 | +$90/wk | +8 | `web_basics` |
| CSS Inspector | 5 | +$60/wk | +7 | `ui_ux` |
| Colour Picker | 3 | +$30/wk | +5 | — |

#### Social
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Cross-Post Tool | 7 | +$80/wk | +7 | — |
| Feed Filter | 5 | +$60/wk | +6 | — |
| Screenshot Annotator | 6 | +$70/wk | +7 | — |
| Link Preview | 4 | +$40/wk | +5 | — |

---

### AI Product Categories

#### Writing Assistant
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Grammar & Style Check | 8 | +$500/wk | +8 | `ai_features` |
| Tone Rewriter | 8 | +$500/wk | +8 | `ai_features` |
| Long-Form Drafting | 12 | +$800/wk | +10 | `ai_features` |
| Brand Voice Training | 10 | +$700/wk | +9 | `ai_features` |

#### Code Assistant
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Autocomplete Engine | 10 | +$700/wk | +10 | `ai_features` |
| Bug Explainer | 8 | +$500/wk | +8 | `ai_features` |
| Test Generator | 9 | +$600/wk | +9 | `ai_features` |
| Code Review Bot | 10 | +$700/wk | +9 | `ai_features` |

#### Image Generation
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| Style Presets | 7 | +$500/wk | +8 | `ai_features` |
| Inpainting | 10 | +$700/wk | +9 | `ai_features` |
| Batch Generation | 8 | +$600/wk | +8 | `ai_features` |
| Commercial Licence Export | 6 | +$800/wk | +7 | `monetization` |

#### Data Analysis
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| CSV Analyser | 8 | +$600/wk | +8 | `ai_features` |
| Chart Generator | 8 | +$550/wk | +8 | `ai_features` |
| Anomaly Detection | 10 | +$700/wk | +9 | `ai_features` |
| Natural Language Queries | 10 | +$750/wk | +10 | `ai_features` |

#### Customer Support
| Feature | WU | Revenue | Quality | Requires |
|---|---|---|---|---|
| FAQ Bot | 7 | +$500/wk | +8 | `ai_features` |
| Ticket Triage | 8 | +$550/wk | +8 | `ai_features` |
| Sentiment Analysis | 8 | +$500/wk | +8 | `ai_features` |
| Human Handoff | 6 | +$350/wk | +7 | — |

---

## Updated `/projects/new` Form Flow

```
1. Project Name       (text input)
2. Project Type       (select — unlocked types only)
3. Category           (grid of chips — filtered to selected type)  ← NEW
4. Pricing Model      (One-Time | Subscription toggle)
5. Price              (number input + range hint)
6. Features           (base features + category features, advertising at bottom)
7. Live Summary       (WU total, est. weeks, projected revenue)
```

---

## Updated `projects.ts` Structure

```typescript
// Add to project factory:
const CATEGORY_FEATURE_POOLS: Record<ProjectType, Record<string, ProjectFeature[]>> = {
  basic_website: {
    blog: [...],
    news: [...],
    portfolio: [...],
    landing_page: [...],
    community_forum: [...],
  },
  mobile_app: {
    dating: [...],
    chat: [...],
    entertainment: [...],
    fitness: [...],
    education: [...],
  },
  // ... etc
};

// When creating a project, merge:
const allFeatures = [
  ...BASE_FEATURE_POOLS[type],
  ...CATEGORY_FEATURE_POOLS[type][category],
  ADVERTISING_FEATURE,  // always appended last
];
```

---

## Notes for Claude Code

- `basic_website` is unlocked from game start alongside `browser_ext` — no research required
- The Advertising feature's quality penalty (-5) applies immediately on completion; make this visible in the feature list
- `adRevenue` should be shown as a separate line from `weeklyRevenue` on the project detail page (e.g. "Revenue: $120/wk + $18/wk ads")
- Category selection is required — the form should not allow proceeding without one
- Category chips should be displayed as a scrollable horizontal row or a 2-column grid
