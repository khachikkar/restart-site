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

  const mainResponse = await fetch("data.json");
  if (!mainResponse.ok) {
    throw new Error(`Could not load data.json: HTTP ${mainResponse.status}`);
  }
  const mainData = await mainResponse.json();

  const sectionGroups = await Promise.all(
    (mainData.product_data_files || []).map(async filePath => {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Could not load ${filePath}: HTTP ${response.status}`);
      }
      return response.json();
    })
  );

  const product = sectionGroups
    .flat()
    .flatMap(section => section.items || [])
    .find(item => String(item.id) === productId);

  if (!product) {
    renderProductMessage(container, "Այս ID-ով ապրանք չի գտնվել։");
    return;
  }

  renderProduct(container, product, mainData.badge_options || {});
  document.title = `${product.title} | Restart`;
}

function renderProductMessage(container, message) {
  container.innerHTML = "";
  const heading = document.createElement("h1");
  heading.className = "product-detail-message";
  heading.textContent = message;
  container.appendChild(heading);
}

function renderProduct(container, product, badgeOptions) {
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
  image.src = product.image_url;
  image.alt = product.title;
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

  layout.append(visual, info);
  container.appendChild(layout);
}

loadProductPage().catch(error => {
  console.error("Error loading product page:", error);
  renderProductMessage(
    document.getElementById("product-detail-container"),
    "Ապրանքի տվյալները չհաջողվեց բեռնել։"
  );
});
