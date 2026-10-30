const productConditionLabels = {
  new: "Նոր",
  used: "Օգտագործված"
};

function toggleMobileMenu() {
  const dropdown = document.getElementById("mobile-dropdown");
  if (dropdown) dropdown.classList.toggle("active");
}

async function loadFragment(slotId, filePath) {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Could not load ${filePath}: HTTP ${response.status}`);
  }
  document.getElementById(slotId).innerHTML = await response.text();
}

async function loadProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const container = document.getElementById("product-detail-container");

  await Promise.all([
    loadFragment("header-slot", "sections/header.html")
  ]);

  if (!productId) {
    renderProductMessage(container, "Ապրանքի հղման մեջ ID նշված չէ։");
    return;
  }

  const catalog = await loadCatalogData();
  const product = catalog.products.find(item => String(item.id) === productId);

  if (!product) {
    renderProductMessage(container, "Այս ID-ով ապրանք չի գտնվել։");
    return;
  }

  const similarProducts = catalog.products
    .filter(item => item.subcategory === product.subcategory && String(item.id) !== productId)
    .slice(0, 5);

  renderProduct(
    container,
    product,
    catalog.badgeOptions,
    similarProducts
  );
  document.title = `${product.title} | Restart`;
}

function renderProductMessage(container, message) {
  container.innerHTML = "";
  const heading = document.createElement("h1");
  heading.className = "product-detail-message";
  heading.textContent = message;
  container.appendChild(heading);
}

function renderProduct(container, product, badgeOptions, similarProducts = []) {
  container.innerHTML = "";

  const layout = document.createElement("article");
  layout.className = "product-detail-layout";

  const visual = document.createElement("div");
  visual.className = "product-detail-visual";

  const imageFrame = document.createElement("div");
  imageFrame.className = "product-detail-image-frame";

  const badge = badgeOptions[product.badge];
  if (badge) {
    const badgeElement = document.createElement("span");
    badgeElement.className = "product-badge";
    badgeElement.style.backgroundColor = badge.bg_color || "#fd7e14";
    badgeElement.textContent = badge.text || "";
    imageFrame.appendChild(badgeElement);
  }

  const image = document.createElement("img");
  image.className = "product-detail-image";
  image.src = optimizedImageUrl(product.image_url);
  image.alt = product.title;
  image.width = 1080;
  image.height = 1400;
  image.fetchPriority = "high";
  imageFrame.appendChild(image);
  visual.appendChild(imageFrame);

  const info = document.createElement("div");
  info.className = "product-detail-info";

  if (product.brand_logo) {
    const brandLogo = document.createElement("img");
    brandLogo.className = "product-detail-brand-logo";
    brandLogo.src = product.brand_logo;
    brandLogo.alt = product.brand || "Բրենդի լոգո";
    info.appendChild(brandLogo);
  }

  const condition = productConditionLabels[product.condition];
  if (condition) {
    const conditionElement = document.createElement("span");
    conditionElement.className = "product-condition";
    conditionElement.textContent = condition;
    info.appendChild(conditionElement);
  }

  const title = document.createElement("h1");
  title.className = "product-detail-title";
  title.textContent = product.title;
  info.appendChild(title);

  const details = document.createElement("dl");
  details.className = "product-detail-facts";
  if (product.brand) {
    const brandTerm = document.createElement("dt");
    brandTerm.textContent = "Բրենդ";
    const brandValue = document.createElement("dd");
    brandValue.textContent = product.brand;
    details.append(brandTerm, brandValue);
  }
  if (condition) {
    const conditionTerm = document.createElement("dt");
    conditionTerm.textContent = "Վիճակ";
    const conditionValue = document.createElement("dd");
    conditionValue.textContent = condition;
    details.append(conditionTerm, conditionValue);
  }
  if (details.childElementCount) info.appendChild(details);

  const priceBox = document.createElement("div");
  priceBox.className = "product-detail-price-box";
  if (product.old_price) {
    const oldPrice = document.createElement("span");
    oldPrice.className = "old-price";
    oldPrice.textContent = product.old_price;
    priceBox.appendChild(oldPrice);
  }
  const price = document.createElement("span");
  price.className = "price";
  price.textContent = product.price;
  priceBox.appendChild(price);
  info.appendChild(priceBox);

  const cta = document.createElement("a");
  cta.className = "product-detail-cta";
  cta.href = "tel:098206064";
  cta.textContent = "Զանգել / Գնել";

  info.appendChild(cta);

  const shareButton = document.createElement("button");
  shareButton.className = "product-detail-share";
  shareButton.type = "button";
  shareButton.textContent = "Կիսվել ապրանքով";
  shareButton.addEventListener("click", async () => {
    const originalLabel = "Կիսվել ապրանքով";
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (error) {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = window.location.href;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand("copy");
      temporaryInput.remove();

      if (!copied) {
        shareButton.textContent = "Պատճենեք հղումը հասցեի տողից";
        window.setTimeout(() => {
          shareButton.textContent = originalLabel;
        }, 2500);
        return;
      }
    }

    shareButton.textContent = "Հղումը պատճենվեց";
    window.setTimeout(() => {
      shareButton.textContent = originalLabel;
    }, 2000);
  });
  info.appendChild(shareButton);

  layout.append(visual, info);
  container.appendChild(layout);

  renderSimilarProducts(container, product, similarProducts, badgeOptions);
}

function renderSimilarProducts(container, currentProduct, products, badgeOptions) {
  if (!products.length) return;

  const section = document.createElement("section");
  section.className = "similar-products";
  section.setAttribute("aria-labelledby", "similar-products-title");

  const heading = document.createElement("h2");
  heading.id = "similar-products-title";
  heading.textContent = "Նմանատիպ ապրանքներ";

  const track = document.createElement("div");
  track.className = "similar-products-track";

  products.forEach(product => {
    const card = document.createElement("a");
    card.className = "similar-product-card";
    card.href = `product.html?id=${encodeURIComponent(product.id)}`;
    card.setAttribute("aria-label", `${product.title}՝ ${product.price}`);

    const imageFrame = document.createElement("div");
    imageFrame.className = "similar-product-image-frame";

    const badge = badgeOptions[product.badge];
    if (badge) {
      const badgeElement = document.createElement("span");
      badgeElement.className = "product-badge";
      badgeElement.style.backgroundColor = badge.bg_color || "#fd7e14";
      badgeElement.textContent = badge.text || "";
      imageFrame.appendChild(badgeElement);
    }

    const image = document.createElement("img");
    image.src = optimizedImageUrl(product.image_url);
    image.alt = product.title;
    image.width = 1080;
    image.height = 1400;
    image.loading = "lazy";
    imageFrame.appendChild(image);
    card.appendChild(imageFrame);

    const condition = productConditionLabels[product.condition];
    if (condition) {
      const conditionElement = document.createElement("span");
      conditionElement.className = "similar-product-condition";
      conditionElement.textContent = condition;
      card.appendChild(conditionElement);
    }

    const title = document.createElement("h3");
    title.textContent = product.title;
    card.appendChild(title);

    const price = document.createElement("div");
    price.className = "similar-product-price";
    if (product.old_price) {
      const oldPrice = document.createElement("span");
      oldPrice.className = "old-price";
      oldPrice.textContent = product.old_price;
      price.appendChild(oldPrice);
    }
    const currentPrice = document.createElement("span");
    currentPrice.className = "price";
    currentPrice.textContent = product.price;
    price.appendChild(currentPrice);
    card.appendChild(price);

    track.appendChild(card);
  });

  section.append(heading, track);
  container.appendChild(section);
}

loadProductPage().catch(error => {
  console.error("Error loading product page:", error);
  renderProductMessage(
    document.getElementById("product-detail-container"),
    "Ապրանքի տվյալները չհաջողվեց բեռնել։"
  );
});
