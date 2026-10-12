/**
 * robots.txt, generated so the sitemap line follows the site's real address
 * (see `site` in astro.config.mjs) instead of hard-coding a domain.
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site).href;
  return new Response(
    ['User-agent: *', 'Allow: /', 'Disallow: /thank-you', '', `Sitemap: ${sitemap}`, ''].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
};
