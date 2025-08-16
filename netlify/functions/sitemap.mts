import type { Context } from "@netlify/functions";

type Route = {
  path: string;
  priority?: number;      // optional, default 0.5
  changefreq?: string;    // optional, default "weekly"
};

export default async function handler(request: Request, context: Context) {
  const baseUrl = "https://thisshopissogay.com";

  // --- Static routes with optional priority and changefreq ---
  const staticRoutes: Route[] = [
    { path: "", priority: 1.0, changefreq: "daily" }, // homepage with custom values
    { path: "privacy", changefreq: "monthly" },  // uses defaults: priority 0.5, changefreq "weekly"
    { path: "returns", changefreq: "monthly" },
    { path: "refunds", changefreq: "monthly" },
    { path: "cancellations", changefreq: "monthly" },
    { path: "shipping", changefreq: "monthly"},
  ];

  // --- Dynamic product routes ---
  // TODO: Fetch products from Supabase here with optional priority/changefreq
  const dynamicRoutes: Route[] = [];

  const allRoutes = [...staticRoutes, ...dynamicRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(({ path, priority = 0.5, changefreq = "weekly" }) => {
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
