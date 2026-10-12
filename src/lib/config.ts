/**
 * Loads src/config.yaml at build time and exposes it as a typed object.
 *
 * Everything editable on the site lives in config.yaml — this module is only
 * the bridge. Add a field there, add it to the interfaces here, and it becomes
 * available to every page as `config.*`.
 */
// `?raw` inlines the YAML text at build time. Reading it from disk at runtime
// would break once this module is bundled into dist/.
import rawConfig from '../config.yaml?raw';
import { load } from 'js-yaml';

export interface Package {
  id: string;
  name: string;
  price: number;
  duration: string;
  tagline: string;
  target_audience: string;
  featured: boolean;
  features: string[];
}

/** true = included, false = not included, string = short label (e.g. "Optional") */
export type ComparisonValue = boolean | string;

export interface ComparisonRow {
  feature: string;
  silver: ComparisonValue;
  gold: ComparisonValue;
  platinum: ComparisonValue;
  diamond: ComparisonValue;
}

export interface Addon {
  name: string;
  description: string;
  price: number;
  per?: string;
  icon: string;
}

export interface Testimonial {
  name: string;
  role: string;
  event: string;
  quote: string;
  rating: number;
  date: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  /** Path inside src/assets/photos, e.g. "team/member-1". */
  photo: string;
}

export interface Step {
  step: number;
  title: string;
  description: string;
  icon: string;
}

export interface TitledBlock {
  title: string;
  description: string;
}

export interface SiteConfig {
  site: {
    name: string;
    tagline: string;
    domain: string;
    url: string;
    description: string;
    founded_year: number;
  };
  contact: {
    email: string;
    bookings_email: string;
    phone: string;
    whatsapp: string;
    whatsapp_preset: string;
    city: string;
    region: string;
    country: string;
    timezone: string;
    response_time: string;
  };
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube: string;
    linkedin: string;
  };
  launch: {
    pre_launch: boolean;
    launch_label: string;
    founding_offer: string;
    founding_offer_detail: string;
  };
  metrics: {
    events_completed: number;
    happy_guests: number;
    photos_printed: number;
    reviews_5star: number;
    avg_rating: number;
  };
  testimonials: Testimonial[];
  about: {
    show_team: boolean;
    team: TeamMember[];
  };
  booking: {
    google_form_id: string;
    form_height_px: number;
    promise: string;
    trust_signals: string[];
  };
  pricing: {
    currency: string;
    note: string;
    packages: Package[];
  };
  comparison: ComparisonRow[];
  addons: Addon[];
  how_it_works: Step[];
  why_us: TitledBlock[];
  values: TitledBlock[];
  seo: {
    title_template: string;
    default_description: string;
    keywords: string;
    author: string;
  };
  analytics: {
    google_analytics_id: string;
  };
  assets: {
    logo: string;
    logo_png: string;
    og_image: string;
  };
}

/**
 * A typo in config.yaml stops the build. js-yaml's own messages ("bad
 * indentation of a mapping entry") don't say what to fix, so name the line and
 * the usual culprits.
 */
function loadConfig(): SiteConfig {
  try {
    return load(rawConfig) as SiteConfig;
  } catch (error) {
    const mark = (error as { mark?: { line: number; column: number } }).mark;
    const reason = (error as { reason?: string }).reason ?? String(error);
    const where = mark ? `line ${mark.line + 1}, column ${mark.column + 1}` : 'an unknown line';
    const line = mark ? rawConfig.split(/\r?\n/)[mark.line]?.trim() : undefined;
    throw new Error(
      `src/config.yaml has a typo at ${where}: ${reason}.` +
        (line ? `\n  That line reads: ${line}` : '') +
        `\n  Usual causes: a " inside a "quoted value" (write it as \\"), a missing` +
        ` closing quote, or a line indented with a tab instead of spaces.`
    );
  }
}

export const config = loadConfig();

/**
 * "25000" -> "LKR 25,000".
 *
 * Package pricing is always presented as a floor ("from LKR X") rather than an
 * exact total — it leaves room to negotiate and keeps the cost structure out of
 * competitors' hands. The "from" label is rendered alongside this figure.
 */
export function lkr(amount: number): string {
  return `LKR ${amount.toLocaleString('en-US')}`;
}

/** Digits-only phone number, as wa.me requires. */
export function whatsappLink(message = config.contact.whatsapp_preset): string {
  const number = config.contact.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function telLink(): string {
  return `tel:${config.contact.phone.replace(/[^\d+]/g, '')}`;
}

/** True once a real phone number has replaced the +94XXXXXXXXX placeholder. */
export function hasRealPhone(): boolean {
  return !/X/i.test(config.contact.whatsapp);
}

export function instagramUrl(): string {
  return `https://instagram.com/${config.social.instagram}`;
}

export function facebookUrl(): string {
  return `https://facebook.com/${config.social.facebook}`;
}

export function tiktokUrl(): string {
  return `https://tiktok.com/@${config.social.tiktok}`;
}

export interface SocialLink {
  label: string;
  href: string;
  handle: string;
}

/**
 * Only the accounts that are filled in. Leaving a handle blank in config.yaml
 * hides that platform everywhere — no links to profiles that don't exist yet.
 */
export function socialLinks(): SocialLink[] {
  const s = config.social;
  const links: (SocialLink | false)[] = [
    !!s.instagram?.trim() && {
      label: 'Instagram',
      href: instagramUrl(),
      handle: `@${s.instagram}`,
    },
    !!s.facebook?.trim() && { label: 'Facebook', href: facebookUrl(), handle: s.facebook },
    !!s.tiktok?.trim() && { label: 'TikTok', href: tiktokUrl(), handle: `@${s.tiktok}` },
    !!s.youtube?.trim() && {
      label: 'YouTube',
      href: `https://youtube.com/@${s.youtube}`,
      handle: `@${s.youtube}`,
    },
    !!s.linkedin?.trim() && {
      label: 'LinkedIn',
      href: `https://linkedin.com/company/${s.linkedin}`,
      handle: s.linkedin,
    },
  ];
  return links.filter((link): link is SocialLink => link !== false);
}

/**
 * Social proof only renders when it is real: the site must not ship invented
 * event counts or reviews while PhotoPop is pre-launch.
 */
export function showMetrics(): boolean {
  return !config.launch.pre_launch && config.metrics.events_completed > 0;
}

export function showTestimonials(): boolean {
  return !config.launch.pre_launch && config.testimonials.length > 0;
}

export function googleFormUrl(): string | null {
  const id = config.booking.google_form_id?.trim();
  if (!id) return null;
  return `https://docs.google.com/forms/d/e/${id}/viewform`;
}

export function googleFormEmbedUrl(): string | null {
  const url = googleFormUrl();
  return url ? `${url}?embedded=true` : null;
}

export default config;
