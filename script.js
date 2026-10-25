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

    const productFiles = data.product_data_files || [];
    const sectionGroups = await Promise.all(
      productFiles.map(async filePath => {
        const productResponse = await fetch(new URL(filePath, window.location.href));

        if (!productResponse.ok) {
          throw new Error(`Could not load ${filePath}: HTTP ${productResponse.status}`);
        }

        const productData = await productResponse.json();
        return Array.isArray(productData) ? productData : [productData];
      })
    );
    allSections = sectionGroups.flat();

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

  const slides = (Array.isArray(banner.slides) ? banner.slides : [])
    .filter(slide => slide && (slide.image_url || slide.mobile_image_url));

  // Keep the current banner working for older JSON that has only image_url fields.
  if (slides.length === 0 && banner.image_url) {
    slides.push({
      id: "banner-1",
      image_url: banner.image_url,
      mobile_image_url: banner.mobile_image_url || ""
    });
  }

  const imageLayer = document.createElement("div");
  imageLayer.className = "hero-image";
  imageLayer.setAttribute("aria-hidden", "true");

  const content = document.createElement("div");
  content.className = "hero-content";
  content.innerHTML = `
    <h1>${banner.title}</h1>
    <p>${banner.description}</p>
    <a href="${banner.button_link}" class="btn-primary">${banner.button_text}</a>
  `;

  container.replaceChildren(imageLayer, content);

  if (slides.length > 1) {
    const controls = document.createElement("div");
    controls.className = "hero-slider-controls";
    controls.setAttribute("aria-label", "Բանների կառավարում");
    controls.innerHTML = `
      <button class="hero-slider-arrow hero-slider-prev" type="button" aria-label="Նախորդ բաններ">&#10094;</button>
      <div class="hero-slider-dots" role="group" aria-label="Ընտրել բանները">
        ${slides.map((slide, index) => `
          <button class="hero-slider-dot${index === 0 ? " active" : ""}" type="button" data-slide-index="${index}" aria-label="${slide.id || `banner-${index + 1}`}" aria-current="${index === 0 ? "true" : "false"}"></button>
        `).join("")}
      </div>
      <button class="hero-slider-arrow hero-slider-next" type="button" aria-label="Հաջորդ բաններ">&#10095;</button>
    `;
    container.append(controls);

    let activeIndex = 0;
    let autoplayTimer;
    const slideButtons = [...controls.querySelectorAll(".hero-slider-dot")];

    function showSlide(index) {
      activeIndex = (index + slides.length) % slides.length;
      const slide = slides[activeIndex];
      const isMobile = window.innerWidth <= 768;
      const imageUrl = isMobile && slide.mobile_image_url
        ? slide.mobile_image_url
        : slide.image_url || slide.mobile_image_url;
      imageLayer.style.backgroundImage = `url("${imageUrl}")`;

      slideButtons.forEach((button, buttonIndex) => {
        const isActive = buttonIndex === activeIndex;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-current", isActive ? "true" : "false");
      });
    }

    controls.querySelector(".hero-slider-prev").addEventListener("click", () => showSlide(activeIndex - 1));
    controls.querySelector(".hero-slider-next").addEventListener("click", () => showSlide(activeIndex + 1));
    slideButtons.forEach(button => {
      button.addEventListener("click", () => showSlide(Number(button.dataset.slideIndex)));
    });

    let touchStartX = 0;
    imageLayer.addEventListener("touchstart", event => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    imageLayer.addEventListener("touchend", event => {
      const touchDelta = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(touchDelta) > 45) showSlide(activeIndex + (touchDelta < 0 ? 1 : -1));
    }, { passive: true });

    container.addEventListener("mouseenter", () => window.clearInterval(autoplayTimer));
    container.addEventListener("mouseleave", startAutoplay);
    container.addEventListener("focusin", () => window.clearInterval(autoplayTimer));
    container.addEventListener("focusout", startAutoplay);
    window.addEventListener("resize", () => showSlide(activeIndex));

    function startAutoplay() {
      window.clearInterval(autoplayTimer);
      autoplayTimer = window.setInterval(() => showSlide(activeIndex + 1), 5000);
    }

    showSlide(0);
    startAutoplay();
  } else if (slides.length === 1) {
    const slide = slides[0];
    const setImage = () => {
      const isMobile = window.innerWidth <= 768;
      const imageUrl = isMobile && slide.mobile_image_url
        ? slide.mobile_image_url
        : slide.image_url || slide.mobile_image_url;
      imageLayer.style.backgroundImage = `url("${imageUrl}")`;
    };
    setImage();
    window.addEventListener("resize", setImage);
  }
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
        <a class="product-card-detail-link" href="product.html?id=${encodeURIComponent(p.id)}">
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
        </a>

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

