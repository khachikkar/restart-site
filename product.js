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

  const whatsappButton = document.createElement("a");
  whatsappButton.className = "product-detail-whatsapp whatsapp-btn";
  whatsappButton.href = createProductWhatsAppUrl(product);
  whatsappButton.target = "_blank";
  whatsappButton.rel = "noopener noreferrer";
  whatsappButton.setAttribute("aria-label", `${product.title} ապրանքի մասին գրել WhatsApp-ով`);
  whatsappButton.innerHTML = `
    <svg class="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.5 0 .15 5.35.15 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.25-1.64a11.9 11.9 0 0 0 5.82 1.48h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.19-3.49-8.43ZM12.08 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.71.97.99-3.62-.24-.37a9.86 9.86 0 0 1-1.52-5.26c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.98 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.45 9.89-9.9 9.89Zm5.43-7.41c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.53.08-.8.38-.28.3-1.05 1.02-1.05 2.49s1.08 2.89 1.23 3.09c.15.2 2.12 3.24 5.14 4.55.72.31 1.28.5 1.72.64.72.23 1.37.2 1.89.12.58-.09 1.77-.73 2.02-1.44.25-.72.25-1.32.18-1.44-.08-.13-.28-.2-.58-.35Z"/>
    </svg>
    Գրել WhatsApp-ով`;
  info.appendChild(whatsappButton);

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

function createProductWhatsAppUrl(product) {
  const message = [
    "Բարև Ձեզ, հետաքրքրված եմ այս ապրանքով։",
    `Ապրանք՝ ${product.title}`,
    `Գին՝ ${product.price}`,
    `Հղում՝ ${window.location.href}`
  ].join("\n");

  return `https://wa.me/37498206064?text=${encodeURIComponent(message)}`;
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
    setProductCardImageSource(image, product.image_url, "(max-width: 760px) 42vw, 220px");
    image.alt = product.title;
    image.width = 493;
    image.height = 640;
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
