/**
 * Sitemap generation for SEO, hosted at /sitemap.xml in production only,
 * otherwise, navigate directly to this function for testing.
 */

import type { Context } from "@netlify/functions";

export type Route = {
  /** The path to the page, e.g. products/256 */
  path: string;
  /** Optional priority for the route in search results, default 0.5 */
  priority?: number; // optional, default 0.5
  /** Optional frequency of page update, defaults to "weekly" */
  changefreq?: string; // optional, default "weekly"
};

export const baseUrl = "https://thisshopissogay.com";

export default async function handler(_request: Request, _context: Context) {
  const xml = `
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" generatedBy="WIX">
    <sitemap>
      <loc>${baseUrl}/sitemapStatic.xml</loc>
    </sitemap>
    <sitemap>
      <loc>${baseUrl}/sitemapProducts.mts</loc>
    </sitemap>
  </sitemapindex>
  `

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml"
    }
  });
}