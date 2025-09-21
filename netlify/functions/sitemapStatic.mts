/**
 * Static pages to include in the sitemap, referenced by sitemap function.
 */

import type { Context } from "@netlify/functions";
import { baseUrl, Route } from "./sitemap.mts";

// Static routes with optional priority and changefreq
const staticRoutes: Route[] = [
    { path: "", priority: 1.0, changefreq: "daily" }, 
    { path: "privacy", changefreq: "monthly" },
    { path: "returns", changefreq: "monthly" },
    { path: "refunds", changefreq: "monthly" },
    { path: "cancellations", changefreq: "monthly" },
    { path: "shipping", changefreq: "monthly"},
];

export default async function handler(_request: Request, _context: Context) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticRoutes.map(({ path, priority = 0.5, changefreq = "weekly" }) => {
  const url = `${baseUrl}/${path}`.replace(/\/+$/, "") + "/";
  return `  <url>
    <loc>${url}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}).join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
