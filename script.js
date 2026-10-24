let allSections = [];
let badgeOptions = {};

const subcategoryOrder = [
  "Լվացքի մեքենաներ",
  "Սառնարաններ",
  "Սպասք լվալու մեքենաներ",
  "Պահեստամասեր"
];

const conditionLabels = {
  new: "Նոր",
  used: "Օգտագործված"
};

async function loadData() {
  try {
    const jsonUrl = new URL("data.json", window.location.href).href;
    const response = await fetch(jsonUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    badgeOptions = data.badge_options || {};
    allSections = data.product_sections || [];

    renderBanner(data.banner);
    renderProducts("all");
  } catch (error) {
    console.error("Error loading data.json:", error);
  }
}

// Մոբայլ մենյուի բացման / փակման ֆունկցիա
function toggleMobileMenu() {
  const dropdown = document.getElementById("mobile-dropdown");

  if (dropdown) {
    dropdown.classList.toggle("active");
  }
}

function renderBanner(banner) {
  const container = document.getElementById("hero-container");
  if (!container || !banner) return;

  const isMobile = window.innerWidth <= 768;
  const bgImage =
    isMobile && banner.mobile_image_url
      ? banner.mobile_image_url
      : banner.image_url;

  container.innerHTML = `
    <div class="hero-image" style="background-image: url('${bgImage}');"></div>
    <div class="hero-content">
      <h1>${banner.title}</h1>
      <p>${banner.description}</p>
      <a href="${banner.button_link}" class="btn-primary">${banner.button_text}</a>
    </div>
  `;
}

function getBadgeHtml(badgeKey) {
  if (!badgeKey || !badgeOptions[badgeKey]) return "";

  const badge = badgeOptions[badgeKey];

  return `
    <span class="product-badge" style="background-color: ${badge.bg_color};">
      ${badge.text}
    </span>
  `;
}

function renderProducts(categoryFilter) {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = "";

  allSections.forEach(section => {
    if (categoryFilter !== "all" && section.category_key !== categoryFilter) {
      return;
    }

    if (!section.items || section.items.length === 0) return;

    const groupDiv = document.createElement("div");
    groupDiv.className = "category-group";

    const subcatTitle = document.createElement("h3");
    subcatTitle.className = "sub-category-title";
    subcatTitle.innerText = section.subcategory;
    groupDiv.appendChild(subcatTitle);

    const grid = document.createElement("div");
    grid.className = "products-grid";

    section.items.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";

      const brandLogoHtml = p.brand_logo
        ? `
          <div class="product-brand-logo">
            <img
              src="${p.brand_logo}"
              alt="${p.brand || "Բրենդի լոգո"}"
              loading="lazy"
            >
          </div>
        `
        : "";

      const conditionText = conditionLabels[p.condition] || "";
      const conditionHtml = conditionText
        ? `<span class="product-condition">${conditionText}</span>`
        : "";

      card.innerHTML = `
        ${brandLogoHtml}

        <div class="product-img-wrapper">
          ${getBadgeHtml(p.badge)}
          <img src="${p.image_url}" alt="${p.title}" loading="lazy">
        </div>

        ${conditionHtml}

        <h4>${p.title}</h4>

        <div class="price-box">
          ${
            p.old_price
              ? `<span class="old-price">${p.old_price}</span>`
              : ""
          }
          <span class="price">${p.price}</span>
        </div>

        <a href="tel:098206064" class="call-to-buy-btn">
          Զանգել / Գնել
        </a>
      `;

      grid.appendChild(card);
    });

    groupDiv.appendChild(grid);
    container.appendChild(groupDiv);
  });
}

function filterCategory(category, event) {
  document.querySelectorAll(".tab-btn").forEach(button => {
    button.classList.remove("active");
  });

  if (event) {
    event.target.classList.add("active");
  }

  renderProducts(category);
}

loadData();