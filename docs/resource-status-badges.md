# Resource Status Badges

Status badges appear on marketplace cards, the resource detail page, and the creator dashboard to give users an immediate read on a resource's availability and quality.

## Badge Reference

| Badge | Colour | Condition | Meaning |
|-------|--------|-----------|---------|
| **Free** | Green | `price` is `0` or absent | The resource costs nothing to access |
| **New** | Blue | `feedbackCount` is `0` **and** no rating recorded | No ratings yet — freshly published |
| **Top Rated** | Amber | `averageScore >= 4.5` (requires at least one review) | Community-verified high quality |
| **Verified** | Indigo | `material.verified === true` | Creator or admin has confirmed accuracy |
| **Popular** | Purple | `likes >= 1000` | Widely saved or liked by the community |
| **Draft** | Gray | `material.status === "draft"` (or `visibility === "private"` for legacy docs) | Not published — only visible to the creator |
| **Published** | Green | `material.status === "published"` (or `visibility === "public"` for legacy docs) | Fully public and discoverable |
| **Closed** | Slate | `material.status === "closed"` | No longer accepting new purchases; existing entitlements unaffected |
| **Canceled** | Red | `material.status === "canceled"` | Withdrawn before ever going live |
| **Unlisted** | Orange | `visibility === "unlisted"` and not closed/canceled | Accessible by direct link but not discoverable |

`material.status` is the authoritative lifecycle field — see [docs/material-lifecycle.md](./material-lifecycle.md) for the full state machine. `visibility` is a separate, independent flag for discoverability within the published state.

## Logic Rules

- **Free** and **New / Top Rated** are not mutually exclusive — a free resource can still be top rated.
- **New** is shown only when there are zero feedback entries *or* when the score is absent/zero.
- **Top Rated** replaces **New** once a qualifying score exists.
- **Draft**, **Published**, **Closed**, and **Canceled** are mutually exclusive — only one lifecycle badge shows at a time.
- **Unlisted** can appear alongside **Published** (it refines discoverability, not lifecycle state).
- Up to three badges are shown on cards (via `max={3}`); the detail page shows all.

## Component Usage

```jsx
import ResourceStatusBadge from "@/components/materials/ResourceStatusBadge";

// On a card — cap at 3 badges
<ResourceStatusBadge material={material} max={3} />

// On a detail page — show all badges
<ResourceStatusBadge material={material} />

// Render a single known badge
import { StatusBadge } from "@/components/materials/ResourceStatusBadge";
<StatusBadge label="Verified" />

// Derive badge labels programmatically
import { deriveBadges } from "@/components/materials/ResourceStatusBadge";
const badges = deriveBadges(material); // string[]
```

## Adding a New Badge

1. Add the badge label and Tailwind classes to `BADGE_STYLES` in [ResourceStatusBadge.jsx](../src/components/materials/ResourceStatusBadge.jsx).
2. Add the derivation rule to the `deriveBadges` function in the same file.
3. Update the table in this document.
