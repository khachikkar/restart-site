// The publishable key is intended for browser use. Row Level Security limits
// this client to reading the public catalog; never put a service-role key here.
const SUPABASE_URL = "https://sjwlehclztnnglqaaeoy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xr26dEBPr9lOVg0dIFu3xQ_VbkDKVr7";

async function fetchSupabaseTable(table, query) {
  const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table} request failed: HTTP ${response.status}`);
  }

  return response.json();
}

async function loadCatalogData() {
  const [products, configRows] = await Promise.all([
    fetchSupabaseTable("products", {
      select: "*",
      order: "category_key.asc,subcategory.asc,display_order.asc,id.asc"
    }),
    fetchSupabaseTable("site_config", {
      select: "key,value",
      key: "in.(badge_options,banner)"
    })
  ]);

  const config = Object.fromEntries(configRows.map(row => [row.key, row.value]));
  const groups = new Map();

  products.forEach(product => {
    const groupKey = `${product.category_key}::${product.subcategory}`;
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        category_key: product.category_key,
        subcategory: product.subcategory,
        items: []
      });
    }
    groups.get(groupKey).items.push(product);
  });

  return {
    products,
    sections: [...groups.values()].sort((a, b) => {
      const order = ["Լվացքի մեքենաներ", "Սառնարաններ", "Սպասք լվալու մեքենաներ", "Պահեստամասեր"];
      return order.indexOf(a.subcategory) - order.indexOf(b.subcategory);
    }),
    badgeOptions: config.badge_options || {},
    banner: config.banner || null
  };
}
