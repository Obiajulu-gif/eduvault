/**
 * ResourceStatusBadge — derives and renders status badges for a material.
 *
 * Badge meanings:
 *   Free        — price is 0 or absent
 *   New         — no feedback/ratings recorded yet
 *   Verified    — creator-verified content (material.verified === true)
 *   Top Rated   — averageScore >= 4.5
 *   Popular     — likes >= 1000
 *   Draft       — lifecycle status is "draft" (or visibility is "private" for legacy docs)
 *   Unlisted    — visibility is "unlisted"
 *   Published   — lifecycle status is "published" (or visibility is "public" for legacy docs)
 *   Closed      — lifecycle status is "closed"
 *   Canceled    — lifecycle status is "canceled"
 *
 * See docs/resource-status-badges.md and docs/material-lifecycle.md for full reference.
 */

const BADGE_STYLES = {
  Free: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  New: "bg-blue-50 text-blue-700 border border-blue-200",
  Verified: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  "Top Rated": "bg-amber-50 text-amber-700 border border-amber-200",
  Popular: "bg-purple-50 text-purple-700 border border-purple-200",
  Draft: "bg-gray-100 text-gray-600 border border-gray-200",
  Unlisted: "bg-orange-50 text-orange-700 border border-orange-200",
  Published: "bg-green-50 text-green-700 border border-green-200",
  Closed: "bg-slate-100 text-slate-600 border border-slate-300",
  Canceled: "bg-red-50 text-red-700 border border-red-200",
};

const BADGE_TOOLTIPS = {
  Free: "No cost — freely available to all learners",
  New: "Recently listed with no ratings yet",
  Verified: "Content reviewed and verified by the creator",
  "Top Rated": "Average score of 4.5 or higher",
  Popular: "Over 1,000 learner likes",
  Draft: "Private draft — not publicly listed",
  Unlisted: "Accessible by link only",
  Published: "Publicly listed in the marketplace",
  Closed: "No longer accepting new purchases",
  Canceled: "Withdrawn before publication",
};

export function deriveBadges(material) {
  if (!material) return [];

  const badges = [];
  const price = Number(material.price ?? 0);
  const score = Number(material.averageScore ?? material.rating ?? 0);
  const feedbackCount = Number(material.feedbackCount ?? material.reviewsCount ?? 0);
  const likes = Number(material.likes ?? 0);
  const visibility = material.visibility;

  if (!Number.isFinite(price) || price === 0) {
    badges.push("Free");
  }

  if (feedbackCount === 0 || !Number.isFinite(score) || score === 0) {
    badges.push("New");
  } else if (score >= 4.5) {
    badges.push("Top Rated");
  }

  if (material.verified) {
    badges.push("Verified");
  }

  if (likes >= 1000) {
    badges.push("Popular");
  }

  if (material.status === "closed") {
    badges.push("Closed");
  } else if (material.status === "canceled") {
    badges.push("Canceled");
  } else if (material.status === "published") {
    badges.push("Published");
  } else if (material.status === "draft") {
    badges.push("Draft");
  } else if (visibility === "private") {
    // Legacy materials without an explicit lifecycle status yet.
    badges.push("Draft");
  } else if (visibility === "public") {
    badges.push("Published");
  }

  if (visibility === "unlisted" && material.status !== "closed" && material.status !== "canceled") {
    badges.push("Unlisted");
  }

  return badges;
}

/**
 * Renders a single badge pill with an optional tooltip.
 */
export function StatusBadge({ label, className = "" }) {
  const base = BADGE_STYLES[label] ?? "bg-gray-100 text-gray-600 border border-gray-200";
  const tooltip = BADGE_TOOLTIPS[label];
  return (
    <span
      className={`relative inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-tight cursor-default ${base} ${className}`}
      aria-label={`Status: ${label}`}
      title={tooltip}
    >
      {label}
    </span>
  );
}

/**
 * Creator info badge — shows the creator label with a tooltip.
 */
export function CreatorBadge({ creator, className = "" }) {
  if (!creator) return null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-tight bg-slate-50 text-slate-600 border border-slate-200 cursor-default ${className}`}
      title={`Created by ${creator}`}
      aria-label={`Creator: ${creator}`}
    >
      by {creator}
    </span>
  );
}

/**
 * Update date badge — shows when the resource was last updated.
 */
export function UpdatedAtBadge({ date, className = "" }) {
  if (!date) return null;
  const formatted = new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold leading-tight bg-gray-50 text-gray-500 border border-gray-200 cursor-default ${className}`}
      title={`Last updated: ${formatted}`}
      aria-label={`Last updated: ${formatted}`}
    >
      Updated {formatted}
    </span>
  );
}

/**
 * Renders a row of status badges derived from a material object.
 * Also shows creator label and last-updated date when present.
 *
 * @param {object}  material  - material data object
 * @param {number}  [max]     - max status badges to show (default: all)
 * @param {boolean} [showCreator]   - show creator badge (default: false)
 * @param {boolean} [showUpdatedAt] - show updated date badge (default: false)
 * @param {string}  [className]
 */
export default function ResourceStatusBadge({
  material,
  max,
  showCreator = false,
  showUpdatedAt = false,
  className = "",
}) {
  const badges = deriveBadges(material);
  const visible = max ? badges.slice(0, max) : badges;
  const creator = material?.author || material?.creatorName || null;
  const updatedAt = material?.updatedAt || material?.createdAt || null;

  const hasContent = visible.length > 0 || (showCreator && creator) || (showUpdatedAt && updatedAt);
  if (!hasContent) return null;

  return (
    <div
      className={`flex flex-wrap gap-1 ${className}`}
      role="list"
      aria-label="Resource info badges"
    >
      {visible.map((label) => (
        <span key={label} role="listitem">
          <StatusBadge label={label} />
        </span>
      ))}
      {showCreator && creator && (
        <span role="listitem">
          <CreatorBadge creator={creator} />
        </span>
      )}
      {showUpdatedAt && updatedAt && (
        <span role="listitem">
          <UpdatedAtBadge date={updatedAt} />
        </span>
      )}
    </div>
  );
}
