import { useEffect } from "react";
import { config } from "./config";
import type { Position } from "@/components/careers/position";

const BASE_TITLE = "Careers at Aidapt";

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
};

/**
 * Per-view title, description and canonical URL.
 *
 * This is a client-rendered SPA, so a crawler that does not execute JavaScript
 * still sees only index.html. What this buys is correct metadata for anything
 * that does run it — Google, and every link preview that follows a redirect —
 * plus a title a candidate can recognise in their tab and bookmarks.
 */
export const useDocumentMeta = ({
  title,
  description,
  path,
  noindex,
}: {
  title?: string;
  description?: string;
  path: string;
  /** Internal pages are linked to, not found — keep them out of the index. */
  noindex?: boolean;
}) => {
  useEffect(() => {
    const full = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE;
    document.title = full;
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: full });

    if (description) {
      upsertMeta('meta[name="description"]', { name: "description", content: description });
      upsertMeta('meta[property="og:description"]', {
        property: "og:description",
        content: description,
      });
    }

    if (noindex) {
      upsertMeta('meta[name="robots"]', { name: "robots", content: "noindex, nofollow" });
    } else {
      document.head.querySelector('meta[name="robots"]')?.remove();
    }

    const canonical = new URL(path, config.siteUrl).toString();
    upsertLink("canonical", canonical);
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
  }, [title, description, path, noindex]);
};

/** The path a role lives at. One place, so links and canonicals cannot drift. */
export const rolePath = (id: string) => `/roles/${encodeURIComponent(id)}`;

/** A one-line summary for meta description and link previews. */
export const positionSummary = (position: Position): string => {
  const facts = [position.company, position.department, position.positionType].filter(Boolean);
  const lead = facts.length ? `${facts.join(" · ")}. ` : "";
  const body = (position.description || "").replace(/\s+/g, " ").trim();
  return `${lead}${body}`.slice(0, 300).trim() || `Apply for ${position.name} at Aidapt.`;
};

const EMPLOYMENT_TYPES: Record<string, string> = {
  "full time": "FULL_TIME",
  "full-time": "FULL_TIME",
  permanent: "FULL_TIME",
  "part time": "PART_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  contractor: "CONTRACTOR",
  temporary: "TEMPORARY",
  intern: "INTERN",
  internship: "INTERN",
};

/**
 * schema.org JobPosting for the role.
 *
 * Only fields we actually hold are emitted — an invented location or closing
 * date would be a fabricated fact in a machine-readable feed, which is worse
 * than an incomplete one.
 */
export const jobPostingJsonLd = (position: Position, url: string): Record<string, unknown> => {
  const employmentType = position.positionType
    ? EMPLOYMENT_TYPES[position.positionType.toLowerCase().trim()]
    : undefined;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: position.name,
    description: position.description || positionSummary(position),
    hiringOrganization: {
      "@type": "Organization",
      name: position.company || "Aidapt",
      sameAs: config.siteUrl,
    },
    directApply: true,
    url,
  };

  if (position.datePosted) data.datePosted = position.datePosted;
  if (employmentType) data.employmentType = employmentType;
  if (position.department) data.occupationalCategory = position.department;
  if (position.educationalQualification) {
    data.educationRequirements = position.educationalQualification;
  }
  if (position.openings) {
    const n = Number.parseInt(position.openings, 10);
    if (Number.isFinite(n) && n > 0) data.totalJobOpenings = n;
  }
  if (position.location) {
    data.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: position.location },
    };
  }

  return data;
};
