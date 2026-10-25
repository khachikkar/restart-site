const pageSections = [
  ["header-slot", "sections/header.html"],
  ["hero-slot", "sections/hero.html"],
  ["brands-slot", "sections/brands.html"],
  ["benefits-slot", "sections/benefits.html"],
  ["service-availability-slot", "sections/service-availability.html"],
  ["products-slot", "sections/products.html"],
  ["about-slot", "sections/about.html"],
  ["footer-slot", "sections/footer.html"]
];

async function loadPage() {
  await Promise.all(
    pageSections.map(async ([slotId, filePath]) => {
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`Could not load ${filePath}: HTTP ${response.status}`);
      }

      document.getElementById(slotId).innerHTML = await response.text();
    })
  );

  await loadData();
}

loadPage().catch(error => {
  console.error("Error loading page sections:", error);
});
