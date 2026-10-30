const SUPABASE_URL = "https://sjwlehclztnnglqaaeoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xr26dEBPr9lOVg0dIFu3xQ_VbkDKVr7";

const socialCrawlerPattern = /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|pinterest|googlebot|bingbot/i;

function escapeHtml(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return String(value ?? "").replace(/[&<>"']/g, character => entities[character]);
}

function resolveImageUrl(imagePath, requestUrl) {
  try {
    const imageUrl = new URL(imagePath, new URL("/", requestUrl));
    if (imageUrl.protocol !== "https:" && imageUrl.protocol !== "http:") return "";

    // Use the smaller local JPEG copy when the catalog still stores its PNG path.
    if (imageUrl.origin === requestUrl.origin) {
      imageUrl.pathname = imageUrl.pathname.replace(/\.png$/i, ".jpg");
    }

    return imageUrl.href;
  } catch {
    return "";
  }
}

export default async function productMeta(request, context) {
  if (request.method !== "GET" && request.method !== "HEAD") return;

  const userAgent = request.headers.get("user-agent") || "";
  if (!socialCrawlerPattern.test(userAgent)) return;

  const requestUrl = new URL(request.url);
  const productId = requestUrl.searchParams.get("id") || "";
  if (!/^\d+$/.test(productId)) return;

  const apiUrl = new URL("/rest/v1/products", SUPABASE_URL);
  apiUrl.searchParams.set("select", "id,title,price,image_url");
  apiUrl.searchParams.set("id", `eq.${productId}`);
  apiUrl.searchParams.set("limit", "1");

  const [pageResponse, productResponse] = await Promise.all([
    context.next(),
    fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      }
    })
  ]);

  if (!pageResponse.ok || !productResponse.ok) return pageResponse;

  const [product] = await productResponse.json();
  if (!product) return pageResponse;

  const title = `${product.title} — ${product.price} | Restart`;
  const description = `${product.title}՝ ${product.price}։ Տեսեք ապրանքի նկարը և մանրամասները Restart-ում։`;
  const imageUrl = resolveImageUrl(product.image_url || "", requestUrl);
  if (!imageUrl) return pageResponse;

  let html = await pageResponse.text();
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(description)}">`
  );

  const socialMetadata = [
    ["property", "og:type", "product"],
    ["property", "og:site_name", "Restart"],
    ["property", "og:locale", "hy_AM"],
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["property", "og:url", requestUrl.href],
    ["property", "og:image", imageUrl],
    ["property", "og:image:alt", product.title],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
    ["name", "twitter:image", imageUrl]
  ].map(([attribute, name, value]) => `<meta ${attribute}="${name}" content="${escapeHtml(value)}">`).join("\n  ");

  html = html.replace(/<\/head>/i, `  ${socialMetadata}\n</head>`);
  const headers = new Headers(pageResponse.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("vary", "user-agent");

  return new Response(request.method === "HEAD" ? null : html, {
    status: pageResponse.status,
    statusText: pageResponse.statusText,
    headers
  });
}

export const config = { path: "/product.html" };
