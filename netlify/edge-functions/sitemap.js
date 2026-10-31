const SUPABASE_URL = "https://sjwlehclztnnglqaaeoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xr26dEBPr9lOVg0dIFu3xQ_VbkDKVr7";

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, character => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;"
  })[character]);
}

function createSitemap(urls) {
  const entries = urls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

export default async function sitemap(request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }

  const requestUrl = new URL(request.url);
  const apiUrl = new URL("/rest/v1/products", SUPABASE_URL);
  apiUrl.searchParams.set("select", "id");
  apiUrl.searchParams.set("order", "id.asc");

  let products;
  try {
    const response = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      }
    });
    if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}`);
    products = await response.json();
  } catch (error) {
    console.error("Could not load products for sitemap:", error);
    return new Response("Could not generate sitemap", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "300" }
    });
  }

  const urls = [new URL("/", requestUrl.origin).href];
  products.forEach(product => {
    const id = String(product.id ?? "");
    if (!/^\d+$/.test(id)) return;
    const productUrl = new URL("/product.html", requestUrl.origin);
    productUrl.searchParams.set("id", id);
    urls.push(productUrl.href);
  });

  return new Response(request.method === "HEAD" ? null : createSitemap(urls), {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300"
    }
  });
}

export const config = { path: "/sitemap.xml" };
