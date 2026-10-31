const { url: supabaseUrl, publishableKey } = window.RESTART_SUPABASE_CONFIG || {};
const supabaseClient = window.supabase?.createClient(supabaseUrl, publishableKey);

const categoryOptions = {
  washing: { category_key: "techniqua", subcategory: "Լվացքի մեքենաներ" },
  refrigerator: { category_key: "techniqua", subcategory: "Սառնարաններ" },
  dishwasher: { category_key: "techniqua", subcategory: "Սպասք լվալու մեքենաներ" },
  spare: { category_key: "spare_parts", subcategory: "Պահեստամասեր" }
};

const authScreen = document.getElementById("auth-screen");
const accessDenied = document.getElementById("access-denied");
const dashboard = document.getElementById("dashboard");
const authForm = document.getElementById("auth-form");
const authMessage = document.getElementById("auth-message");
const productForm = document.getElementById("product-form");
const productMessage = document.getElementById("product-message");
const catalogMessage = document.getElementById("catalog-message");
const productList = document.getElementById("admin-product-list");
const badgeSelect = document.getElementById("product-badge");
const discountFields = document.getElementById("product-discount-fields");
const discountPercentInput = document.getElementById("product-discount-percent");
let adminBadgeOptions = {};
let discountPriceNeedsCalculation = false;
const brandSelect = document.getElementById("product-brand");
const brandLogoInput = document.getElementById("product-brand-logo");
const brandLogoOptions = document.getElementById("brand-logo-options");
const newBrandFields = document.getElementById("new-brand-fields");
const newBrandNameInput = document.getElementById("new-brand-name");
const newBrandLogoFileInput = document.getElementById("new-brand-logo-file");
const newBrandLogoPreview = document.getElementById("new-brand-logo-preview");
const newBrandLogoPreviewImage = document.getElementById("new-brand-logo-preview-image");
const newBrandLogoPreviewName = document.getElementById("new-brand-logo-preview-name");

const brandOptions = [
  { name: "Samsung", logo: "assets/brands/samsung.svg" },
  { name: "LG", logo: "assets/brands/lg.svg" },
  { name: "Beko", logo: "assets/brands/beko.svg" },
  { name: "Electrolux", logo: "assets/brands/electrolux.svg" },
  { name: "Hisense", logo: "assets/brands/hisense.svg" },
  { name: "Indesit", logo: "assets/brands/indesit.svg" }
];

let authMode = "signin";
let products = [];
let isEditing = false;
let selectedImageFile = null;
let selectedBrandLogoFile = null;
let previewObjectUrl = null;
let brandLogoPreviewObjectUrl = null;
let bannerConfig = null;
const bannerPreviewObjectUrls = new WeakMap();
const bannerTextColorToggle = document.getElementById("banner-text-color-enabled");
const bannerTextColorFields = document.getElementById("banner-text-color-fields");
const bannerTextColorPicker = document.getElementById("banner-text-color-picker");
const bannerTextColorCode = document.getElementById("banner-text-color-code");
const bannerButtonColorToggle = document.getElementById("banner-button-color-enabled");
const bannerButtonColorFields = document.getElementById("banner-button-color-fields");
const bannerButtonColorPicker = document.getElementById("banner-button-color-picker");
const bannerButtonColorCode = document.getElementById("banner-button-color-code");
const bannerButtonTextInput = document.getElementById("banner-button-text");
const bannerButtonTextColorToggle = document.getElementById("banner-button-text-color-enabled");
const bannerButtonTextColorFields = document.getElementById("banner-button-text-color-fields");
const bannerButtonTextColorPicker = document.getElementById("banner-button-text-color-picker");
const bannerButtonTextColorCode = document.getElementById("banner-button-text-color-code");
const bannerTitleInput = document.getElementById("banner-title");
const bannerDescriptionInput = document.getElementById("banner-description");

function syncBrandSelection(brandName) {
  const addingNewBrand = brandName === "__new__";
  newBrandFields.hidden = !addingNewBrand;
  brandLogoOptions.hidden = addingNewBrand;

  if (addingNewBrand) {
    brandSelect.value = "__new__";
    brandLogoInput.value = "";
    brandLogoOptions.querySelectorAll(".brand-logo-option").forEach(button => {
      button.setAttribute("aria-pressed", "false");
      button.classList.remove("is-selected");
    });
    return;
  }

  const selectedBrand = brandOptions.find(brand => brand.name === brandName);
  if (brandName && !selectedBrand && ![...brandSelect.options].some(option => option.value === brandName)) {
    const existingBrand = document.createElement("option");
    existingBrand.value = brandName;
    existingBrand.textContent = `${brandName} (առանց լոգոյի)`;
    brandSelect.appendChild(existingBrand);
  }

  brandSelect.value = selectedBrand?.name || brandName || "";
  brandLogoInput.value = selectedBrand?.logo || "";

  brandLogoOptions.querySelectorAll(".brand-logo-option").forEach(button => {
    const isSelected = button.dataset.brand === brandSelect.value;
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("is-selected", isSelected);
  });
}

function initializeBrandPicker() {
  renderBrandLogoOptions();

  brandSelect.addEventListener("change", () => syncBrandSelection(brandSelect.value));
  syncBrandSelection(brandSelect.value);
}

function renderBrandLogoOptions() {
  const buttons = brandOptions.map(brand => {
    const button = document.createElement("button");
    button.className = "brand-logo-option";
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.dataset.brand = brand.name;

    if (brand.logo) {
      const image = document.createElement("img");
      image.src = brand.logo;
      image.alt = "";
      image.loading = "lazy";
      button.appendChild(image);
    } else {
      const noLogo = document.createElement("span");
      noLogo.className = "brand-logo-missing";
      noLogo.textContent = "Լոգո չկա";
      button.appendChild(noLogo);
    }

    const name = document.createElement("span");
    name.textContent = brand.name;
    button.appendChild(name);
    return button;
  });
  brandLogoOptions.replaceChildren(...buttons);

  buttons.forEach(button => {
    button.addEventListener("click", () => syncBrandSelection(button.dataset.brand));
  });
}

function registerBrandOption(name, logo) {
  const normalizedName = (name || "").trim();
  if (!normalizedName || normalizedName === "__new__") return;

  const existing = brandOptions.find(brand => brand.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase());
  if (existing) {
    if (!existing.logo && logo) existing.logo = logo;
    return;
  }

  brandOptions.push({ name: normalizedName, logo: logo || "", custom: true });
  const option = document.createElement("option");
  option.value = normalizedName;
  option.textContent = normalizedName;
  option.dataset.customBrand = "true";
  brandSelect.insertBefore(option, brandSelect.querySelector('[value="__new__"]'));
}

function loadBrandsFromProducts(productRows) {
  productRows.forEach(product => registerBrandOption(product.brand, product.brand_logo));
  renderBrandLogoOptions();
  syncBrandSelection(brandSelect.value);
}

initializeBrandPicker();

function setMessage(element, message = "", type = "") {
  element.textContent = message;
  element.classList.toggle("is-error", type === "error");
  element.classList.toggle("is-success", type === "success");
}

function formatPriceWithDram(value) {
  const amount = String(value ?? "")
    .trim()
    .replace(/(?:\s*(?:դրամ|դր\.?|amd|֏))+$/iu, "")
    .trim();
  return amount ? `${amount} դր` : "";
}

function showDiscountFields() {
  discountFields.hidden = badgeSelect.value !== "__custom_discount__";
}

function parsePriceAmount(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function formatPriceAmount(value) {
  return `${new Intl.NumberFormat("en-US").format(value)} դր`;
}

badgeSelect.addEventListener("change", () => {
  showDiscountFields();
  discountPriceNeedsCalculation = badgeSelect.value === "__custom_discount__";
});
discountPercentInput.addEventListener("input", () => {
  discountPriceNeedsCalculation = badgeSelect.value === "__custom_discount__";
});
document.getElementById("product-price").addEventListener("input", () => {
  discountPriceNeedsCalculation = badgeSelect.value === "__custom_discount__";
});
showDiscountFields();

[document.getElementById("product-price"), document.getElementById("product-old-price")].forEach(input => {
  input.addEventListener("blur", () => {
    if (input.value.trim()) input.value = formatPriceWithDram(input.value);
  });
});

document.getElementById("product-price").addEventListener("blur", event => {
  if (badgeSelect.value !== "__custom_discount__" || !discountPriceNeedsCalculation) return;
  discountPriceNeedsCalculation = false;

  const percent = Number(discountPercentInput.value);
  const oldPrice = parsePriceAmount(event.currentTarget.value);
  if (!Number.isInteger(percent) || percent < 1 || percent > 99 || oldPrice <= 0) return;

  const newPrice = Math.round(oldPrice * (100 - percent) / 100);
  const oldPriceText = formatPriceAmount(oldPrice);
  const newPriceText = formatPriceAmount(newPrice);
  const approved = window.confirm(
    `Հաշվարկել -${percent}% զեղչը՞\n\nՀին գին՝ ${oldPriceText}\nՆոր գին՝ ${newPriceText}\n\nՀաստատելու դեպքում այս գները կլրացվեն դաշտերում։`
  );

  if (!approved) return;
  document.getElementById("product-old-price").value = oldPriceText;
  event.currentTarget.value = newPriceText;
});

function showScreen(screen) {
  authScreen.hidden = screen !== "auth";
  accessDenied.hidden = screen !== "denied";
  dashboard.hidden = screen !== "dashboard";
}

function categoryForProduct(product) {
  return Object.entries(categoryOptions).find(([, category]) =>
    category.category_key === product.category_key && category.subcategory === product.subcategory
  )?.[0] || "washing";
}

async function showDashboardForUser(user) {
  showScreen("denied");
  document.getElementById("admin-user-email").textContent = user.email || "";

  const { data: accessRecord, error } = await supabaseClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    setMessage(authMessage, `Չհաջողվեց ստուգել ադմինի իրավունքը․ ${error.message}`, "error");
    showScreen("auth");
    return;
  }

  if (!accessRecord) {
    showScreen("denied");
    return;
  }

  showScreen("dashboard");
  await Promise.all([loadProducts(), loadBadges(), loadBannerSettings()]);
}

async function loadProducts() {
  setMessage(catalogMessage, "Բեռնում է ապրանքների ցանկը…");
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("display_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    setMessage(catalogMessage, `Ապրանքները չբեռնվեցին․ ${error.message}`, "error");
    return;
  }

  products = data || [];
  loadBrandsFromProducts(products);
  renderProductList();
  setMessage(catalogMessage);
}

async function loadBadges() {
  const { data, error } = await supabaseClient
    .from("site_config")
    .select("value")
    .eq("key", "badge_options")
    .maybeSingle();

  if (error || !data?.value) return;

  adminBadgeOptions = data.value;

  Object.entries(data.value).forEach(([key, badge]) => {
    if (badgeSelect.querySelector(`option[value="${key}"]`)) return;
    const option = document.createElement("option");
    option.value = key;
    option.textContent = badge.text || key;
    badgeSelect.appendChild(option);
  });
}

async function loadBannerSettings() {
  const { data, error } = await supabaseClient
    .from("site_config")
    .select("value")
    .eq("key", "banner")
    .maybeSingle();

  if (error) {
    setMessage(document.getElementById("banner-message"), `Բանների տվյալները չբեռնվեցին․ ${error.message}`, "error");
    return;
  }

  bannerConfig = data?.value || null;
  renderBannerEditors();
}

function renderBannerEditors() {
  const editorList = document.getElementById("banner-editor-list");
  editorList.replaceChildren();
  bannerTitleInput.value = bannerConfig?.title || "";
  bannerDescriptionInput.value = bannerConfig?.description || "";
  bannerButtonTextInput.value = bannerConfig?.button_text || "Տեսնել ապրանքները";
  const savedColor = /^#[0-9a-f]{6}$/i.test(bannerConfig?.text_color || "")
    ? bannerConfig.text_color
    : "#FFFFFF";
  bannerTextColorToggle.checked = bannerConfig?.custom_text_color_enabled === true;
  bannerTextColorPicker.value = savedColor;
  bannerTextColorCode.value = savedColor.toUpperCase();
  updateBannerTextColorFields();
  const savedButtonColor = /^#[0-9a-f]{6}$/i.test(bannerConfig?.button_color || "")
    ? bannerConfig.button_color
    : "#111111";
  bannerButtonColorToggle.checked = bannerConfig?.custom_button_color_enabled === true;
  bannerButtonColorPicker.value = savedButtonColor;
  bannerButtonColorCode.value = savedButtonColor.toUpperCase();
  updateBannerButtonColorFields();
  const savedButtonTextColor = /^#[0-9a-f]{6}$/i.test(bannerConfig?.button_text_color || "")
    ? bannerConfig.button_text_color
    : "#FFFFFF";
  bannerButtonTextColorToggle.checked = bannerConfig?.custom_button_text_color_enabled === true;
  bannerButtonTextColorPicker.value = savedButtonTextColor;
  bannerButtonTextColorCode.value = savedButtonTextColor.toUpperCase();
  updateBannerButtonTextColorFields();
  const slides = Array.isArray(bannerConfig?.slides) ? bannerConfig.slides : [];

  if (!slides.length) {
    setMessage(document.getElementById("banner-message"), "Բանների սլայդներ չեն գտնվել։", "error");
    return;
  }

  slides.forEach((slide, index) => {
    const card = document.createElement("article");
    card.className = "banner-slide-editor";
    card.dataset.slideIndex = String(index);

    const heading = document.createElement("h3");
    heading.textContent = slide.id || `Banner ${index + 1}`;
    if (slide.enabled === false) card.classList.add("is-disabled");
    card.appendChild(heading);

    const visibilityLabel = document.createElement("label");
    visibilityLabel.className = "banner-slide-visibility";
    const visibilityInput = document.createElement("input");
    visibilityInput.type = "checkbox";
    visibilityInput.className = "banner-slide-enabled";
    visibilityInput.checked = slide.enabled !== false;
    visibilityInput.setAttribute("aria-label", `${heading.textContent} ցուցադրել կայքում`);
    const visibilityText = document.createElement("span");
    visibilityText.textContent = "Ցուցադրել կայքում";
    visibilityLabel.append(visibilityInput, visibilityText);
    card.appendChild(visibilityLabel);

    [
      { key: "image_url", label: "Համակարգչի նկար", mobile: false },
      { key: "mobile_image_url", label: "Բջջայինի նկար", mobile: true }
    ].forEach(({ key, label, mobile }) => {
      const field = document.createElement("div");
      field.className = "banner-image-editor";
      const fieldLabel = document.createElement("label");
      fieldLabel.textContent = label;
      const image = document.createElement("img");
      image.className = `banner-image-preview${mobile ? " is-mobile" : ""}`;
      image.alt = `${heading.textContent} — ${label}`;
      image.src = slide[key] || slide.image_url || "";
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif";
      input.className = "banner-file-input";
      input.dataset.imageKey = key;
      input.setAttribute("aria-label", `${heading.textContent}: ${label}`);
      field.append(fieldLabel, image, input);
      card.appendChild(field);
    });

    editorList.appendChild(card);
  });
}

function updateBannerTextColorFields() {
  const enabled = bannerTextColorToggle.checked;
  bannerTextColorFields.hidden = !enabled;
  bannerTextColorPicker.disabled = !enabled;
  bannerTextColorCode.disabled = !enabled;
}

function updateBannerButtonColorFields() {
  const enabled = bannerButtonColorToggle.checked;
  bannerButtonColorFields.hidden = !enabled;
  bannerButtonColorPicker.disabled = !enabled;
  bannerButtonColorCode.disabled = !enabled;
}

function updateBannerButtonTextColorFields() {
  const enabled = bannerButtonTextColorToggle.checked;
  bannerButtonTextColorFields.hidden = !enabled;
  bannerButtonTextColorPicker.disabled = !enabled;
  bannerButtonTextColorCode.disabled = !enabled;
}

function normalizeBannerTextColor(value) {
  const trimmed = value.trim();
  const normalized = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized.toUpperCase() : "";
}

async function uploadAdminImage(file, pathPrefix) {
  const extensionByType = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif"
  };
  const extension = extensionByType[file.type];
  if (!extension) throw new Error("Այս նկարի ձևաչափը չի աջակցվում։ Օգտագործիր JPEG, PNG, WebP, GIF կամ AVIF։");
  if (file.size > 10 * 1024 * 1024) throw new Error("Նկարը պետք է լինի մինչև 10 ՄԲ։");

  const randomId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const imagePath = `${pathPrefix}/${randomId}.${extension}`;
  const { data, error } = await supabaseClient.storage
    .from("product-images")
    .upload(imagePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });

  if (error) throw error;
  return supabaseClient.storage.from("product-images").getPublicUrl(data.path).data.publicUrl;
}

function renderProductList() {
  const filter = document.getElementById("catalog-filter").value;
  const visibleProducts = products.filter(product => filter === "all" || product.category_key === filter);
  document.getElementById("product-count").textContent = visibleProducts.length;
  productList.replaceChildren();

  if (!visibleProducts.length) {
    const empty = document.createElement("p");
    empty.className = "admin-message";
    empty.textContent = "Այս բաժնում ապրանքներ չկան։";
    productList.appendChild(empty);
    return;
  }

  visibleProducts.forEach(product => {
    const row = document.createElement("article");
    row.className = "admin-product-row";

    const image = document.createElement("img");
    image.src = product.image_url;
    image.alt = product.title;
    image.loading = "lazy";
    row.appendChild(image);

    const details = document.createElement("div");
    details.className = "admin-product-details";
    const title = document.createElement("h3");
    title.className = "admin-product-title";
    title.textContent = product.title;
    const meta = document.createElement("p");
    meta.className = "admin-product-meta";
    meta.textContent = `ID ${product.id} · ${product.price} · ${product.subcategory}`;
    details.append(title, meta);
    row.appendChild(details);

    const actions = document.createElement("div");
    actions.className = "admin-product-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Խմբագրել";
    editButton.addEventListener("click", () => beginEdit(product));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-product";
    deleteButton.textContent = "Ջնջել";
    deleteButton.addEventListener("click", () => deleteProduct(product));
    actions.append(editButton, deleteButton);
    row.appendChild(actions);

    productList.appendChild(row);
  });
}

function resetProductForm() {
  productForm.reset();
  selectedImageFile = null;
  selectedBrandLogoFile = null;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
  if (brandLogoPreviewObjectUrl) URL.revokeObjectURL(brandLogoPreviewObjectUrl);
  brandLogoPreviewObjectUrl = null;
  newBrandLogoPreview.hidden = true;
  newBrandLogoPreviewImage.removeAttribute("src");
  newBrandLogoPreviewName.textContent = "";
  document.getElementById("image-upload-preview").hidden = true;
  document.getElementById("image-preview").removeAttribute("src");
  document.getElementById("image-preview-name").textContent = "";
  document.getElementById("product-id").disabled = false;
  document.getElementById("product-condition").value = "new";
  document.getElementById("product-category").value = "washing";
  document.getElementById("product-badge").value = "";
  discountPercentInput.value = "";
  discountPriceNeedsCalculation = false;
  showDiscountFields();
  syncBrandSelection("");
  document.getElementById("editor-heading").textContent = "Ավելացնել ապրանք";
  document.getElementById("save-product").textContent = "Պահպանել ապրանքը";
  document.getElementById("cancel-edit").hidden = true;
  isEditing = false;
  setMessage(productMessage);
}

function beginEdit(product) {
  isEditing = true;
  document.getElementById("product-id").value = product.id;
  document.getElementById("product-id").disabled = true;
  document.getElementById("product-category").value = categoryForProduct(product);
  document.getElementById("product-title").value = product.title;
  document.getElementById("product-price").value = product.price;
  document.getElementById("product-old-price").value = product.old_price || "";
  document.getElementById("product-condition").value = product.condition || "new";
  const savedDiscountMatch = String(product.badge || "").match(/^discount_(\d{1,2})$/);
  document.getElementById("product-badge").value = savedDiscountMatch ? "__custom_discount__" : (product.badge || "");
  discountPercentInput.value = savedDiscountMatch?.[1] || "";
  discountPriceNeedsCalculation = false;
  showDiscountFields();
  syncBrandSelection(product.brand || "");
  document.getElementById("product-image").value = product.image_url;
  document.getElementById("editor-heading").textContent = "Խմբագրել ապրանքը";
  document.getElementById("save-product").textContent = "Պահպանել փոփոխությունները";
  document.getElementById("cancel-edit").hidden = false;
  setMessage(productMessage);
  document.querySelector(".product-editor-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveProduct(event) {
  event.preventDefault();
  setMessage(productMessage);
  const saveButton = document.getElementById("save-product");
  saveButton.disabled = true;

  const id = Number(document.getElementById("product-id").value);
  const category = categoryOptions[document.getElementById("product-category").value];
  const selectedBrandName = brandSelect.value;
  const selectedBrand = brandOptions.find(brand => brand.name === brandSelect.value);
  const isAddingNewBrand = selectedBrandName === "__new__";
  const newBrandName = newBrandNameInput.value.trim();
  const existing = products.find(product => product.id === id);
  const existingImageUrl = document.getElementById("product-image").value.trim();
  const badgeSelection = badgeSelect.value;
  const discountPercent = Number(discountPercentInput.value);

  if (badgeSelection === "__custom_discount__" && (!Number.isInteger(discountPercent) || discountPercent < 1 || discountPercent > 99)) {
    setMessage(productMessage, "Մուտքագրիր զեղչի տոկոսը՝ 1-ից 99։", "error");
    saveButton.disabled = false;
    return;
  }

  if (isAddingNewBrand) {
    if (!newBrandName || newBrandName === "__new__") {
      setMessage(productMessage, "Գրիր նոր բրենդի անունը։", "error");
      saveButton.disabled = false;
      return;
    }
    if (brandOptions.some(brand => brand.name.toLocaleLowerCase() === newBrandName.toLocaleLowerCase())) {
      setMessage(productMessage, "Այս բրենդն արդեն կա ցանկում․ ընտրիր այն ցանկից։", "error");
      saveButton.disabled = false;
      return;
    }
    if (!selectedBrandLogoFile) {
      setMessage(productMessage, "Ընտրիր նոր բրենդի լոգոյի ֆայլը։", "error");
      saveButton.disabled = false;
      return;
    }
  }

  if (!selectedImageFile && !existingImageUrl) {
    setMessage(productMessage, "Ընտրիր նկարը համակարգչից կամ լրացրու նկարի հղումը։", "error");
    saveButton.disabled = false;
    return;
  }

  let imageUrl = existingImageUrl;
  let brandLogoUrl = selectedBrand?.logo || null;
  let brandName = selectedBrandName;
  try {
    if (isAddingNewBrand) {
      setMessage(productMessage, "Նոր բրենդի լոգոն վերբեռնվում է…");
      brandLogoUrl = await uploadAdminImage(selectedBrandLogoFile, "brands");
      brandName = newBrandName;
    }

    if (selectedImageFile) {
      setMessage(productMessage, "Ապրանքի նկարը վերբեռնվում է…");
      imageUrl = await uploadAdminImage(selectedImageFile, `products/${id}`);
    }
  } catch (uploadError) {
    setMessage(productMessage, `Նկարը չվերբեռնվեց․ ${uploadError.message}`, "error");
    saveButton.disabled = false;
    return;
  }

  const payload = {
    id,
    category_key: category.category_key,
    subcategory: category.subcategory,
    display_order: isEditing && existing
      ? existing.display_order
      : Math.min(0, ...products.map(product => Number(product.display_order) || 0)) - 1,
    title: document.getElementById("product-title").value.trim(),
    price: formatPriceWithDram(document.getElementById("product-price").value),
    old_price: formatPriceWithDram(document.getElementById("product-old-price").value),
    image_url: imageUrl,
    badge: badgeSelection === "__custom_discount__" ? `discount_${discountPercent}` : (badgeSelection || null),
    brand: brandName || null,
    brand_logo: brandLogoUrl,
    condition: document.getElementById("product-condition").value
  };

  if (badgeSelection === "__custom_discount__") {
    const badgeKey = `discount_${discountPercent}`;
    const badgeText = `-${discountPercent}%`;
    const nextBadgeOptions = {
      ...adminBadgeOptions,
      [badgeKey]: { ...(adminBadgeOptions[badgeKey] || {}), text: badgeText, bg_color: adminBadgeOptions[badgeKey]?.bg_color || "#fd7e14" }
    };
    const { error: badgeError } = await supabaseClient
      .from("site_config")
      .update({ value: nextBadgeOptions })
      .eq("key", "badge_options");

    if (badgeError) {
      saveButton.disabled = false;
      setMessage(productMessage, `Չհաջողվեց պահպանել նշանը․ ${badgeError.message}`, "error");
      return;
    }

    adminBadgeOptions = nextBadgeOptions;
    if (!badgeSelect.querySelector(`option[value="${badgeKey}"]`)) {
      const option = document.createElement("option");
      option.value = badgeKey;
      badgeSelect.insertBefore(option, badgeSelect.querySelector('option[value="__custom_discount__"]'));
    }
    const savedBadgeOption = badgeSelect.querySelector(`option[value="${badgeKey}"]`);
    savedBadgeOption.textContent = badgeText;
  }

  const result = isEditing
    ? await supabaseClient.from("products").update(payload).eq("id", id)
    : await supabaseClient.from("products").insert(payload);

  saveButton.disabled = false;
  if (result.error) {
    saveButton.disabled = false;
    setMessage(productMessage, `Չհաջողվեց պահպանել․ ${result.error.message}`, "error");
    return;
  }

  setMessage(productMessage, "Ապրանքը պահպանվեց։", "success");
  saveButton.disabled = false;
  resetProductForm();
  await loadProducts();
}

async function deleteProduct(product) {
  const approved = window.confirm(`Ջնջե՞լ «${product.title}» ապրանքը (ID ${product.id})։`);
  if (!approved) return;

  setMessage(catalogMessage);
  const { error } = await supabaseClient.from("products").delete().eq("id", product.id);
  if (error) {
    setMessage(catalogMessage, `Չհաջողվեց ջնջել․ ${error.message}`, "error");
    return;
  }

  if (isEditing && Number(document.getElementById("product-id").value) === product.id) resetProductForm();
  setMessage(catalogMessage, "Ապրանքը հեռացվեց ցանկից։", "success");
  await loadProducts();
}

async function saveBannerImages() {
  const button = document.getElementById("save-banners");
  const message = document.getElementById("banner-message");
  if (!bannerConfig?.slides) {
    setMessage(message, "Բանների տվյալները դեռ չեն բեռնվել։", "error");
    return;
  }

  const customTextColorEnabled = bannerTextColorToggle.checked;
  const normalizedTextColor = normalizeBannerTextColor(bannerTextColorCode.value);
  const customButtonColorEnabled = bannerButtonColorToggle.checked;
  const normalizedButtonColor = normalizeBannerTextColor(bannerButtonColorCode.value);
  const customButtonTextColorEnabled = bannerButtonTextColorToggle.checked;
  const normalizedButtonTextColor = normalizeBannerTextColor(bannerButtonTextColorCode.value);
  const bannerTitle = bannerTitleInput.value.trim();
  const bannerDescription = bannerDescriptionInput.value.trim();
  const buttonText = bannerButtonTextInput.value.trim();
  if (!bannerTitle) {
    setMessage(message, "Գրիր banner-ի գլխավոր վերնագիրը։", "error");
    bannerTitleInput.focus();
    return;
  }
  if (!buttonText) {
    setMessage(message, "Գրիր banner-ի կոճակի տեքստը։", "error");
    bannerButtonTextInput.focus();
    return;
  }
  if (customTextColorEnabled && !normalizedTextColor) {
    setMessage(message, "Գրիր գույնի ճիշտ HEX կոդ, օրինակ՝ #FFFFFF։", "error");
    bannerTextColorCode.focus();
    return;
  }
  if (customButtonColorEnabled && !normalizedButtonColor) {
    setMessage(message, "Գրիր կոճակի գույնի ճիշտ HEX կոդ, օրինակ՝ #111111։", "error");
    bannerButtonColorCode.focus();
    return;
  }
  if (customButtonTextColorEnabled && !normalizedButtonTextColor) {
    setMessage(message, "Գրիր կոճակի տեքստի ճիշտ HEX կոդ, օրինակ՝ #FFFFFF։", "error");
    bannerButtonTextColorCode.focus();
    return;
  }

  button.disabled = true;
  setMessage(message, "Բանների կարգավորումները պահվում են…");
  const updatedBanner = JSON.parse(JSON.stringify(bannerConfig));
  updatedBanner.title = bannerTitle;
  updatedBanner.description = bannerDescription;
  updatedBanner.custom_text_color_enabled = customTextColorEnabled;
  if (normalizedTextColor) updatedBanner.text_color = normalizedTextColor;
  updatedBanner.custom_button_color_enabled = customButtonColorEnabled;
  if (normalizedButtonColor) updatedBanner.button_color = normalizedButtonColor;
  updatedBanner.custom_button_text_color_enabled = customButtonTextColorEnabled;
  if (normalizedButtonTextColor) updatedBanner.button_text_color = normalizedButtonTextColor;
  updatedBanner.button_text = buttonText;

  try {
    for (const card of document.querySelectorAll(".banner-slide-editor")) {
      const index = Number(card.dataset.slideIndex);
      const slide = updatedBanner.slides[index];
      const slideName = slide.id || `banner-${index + 1}`;
      const visibilityInput = card.querySelector(".banner-slide-enabled");
      slide.enabled = visibilityInput ? visibilityInput.checked : slide.enabled !== false;
      for (const input of card.querySelectorAll(".banner-file-input")) {
        const file = input.files?.[0];
        if (!file) continue;
        setMessage(message, `${slideName} նկարը վերբեռնվում է…`);
        slide[input.dataset.imageKey] = await uploadAdminImage(file, `banners/${slideName}`);
      }
    }

    if (updatedBanner.slides[0]) {
      updatedBanner.image_url = updatedBanner.slides[0].image_url || updatedBanner.image_url;
      updatedBanner.mobile_image_url = updatedBanner.slides[0].mobile_image_url || updatedBanner.mobile_image_url;
    }

    const { error } = await supabaseClient
      .from("site_config")
      .update({ value: updatedBanner })
      .eq("key", "banner");

    if (error) throw error;
    bannerConfig = updatedBanner;
    renderBannerEditors();
    setMessage(message, "Բանների կարգավորումները պահպանվեցին։", "success");
  } catch (error) {
    setMessage(message, `Չհաջողվեց պահպանել բանները․ ${error.message}`, "error");
  } finally {
    button.disabled = false;
  }
}

document.getElementById("signup-toggle").addEventListener("click", () => {
  authMode = authMode === "signin" ? "signup" : "signin";
  const isSignup = authMode === "signup";
  document.getElementById("auth-heading").textContent = isSignup ? "Ստեղծել ադմինի հաշիվ" : "Մուտք ադմինկա";
  document.getElementById("auth-description").textContent = isSignup
    ? "Ստեղծիր հաշիվ քո հաստատված էլ․ փոստով։ Ադմին հասանելիությունը կմիանա առանձին հաստատումից հետո։"
    : "Մուտք գործիր հաստատված ադմին հաշվի միջոցով։";
  document.getElementById("auth-submit").textContent = isSignup ? "Ստեղծել հաշիվ" : "Մուտք գործել";
  document.getElementById("signup-toggle").textContent = isSignup ? "Արդեն հաշիվ ունե՞ս․ մուտք գործել" : "Առաջին մուտք է՞․ ստեղծել հաշիվ";
  document.getElementById("auth-password").autocomplete = isSignup ? "new-password" : "current-password";
  setMessage(authMessage);
});

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  setMessage(authMessage);
  const email = document.getElementById("auth-email").value.trim().toLowerCase();
  const password = document.getElementById("auth-password").value;
  const submitButton = document.getElementById("auth-submit");
  submitButton.disabled = true;

  const result = authMode === "signup"
    ? await supabaseClient.auth.signUp({ email, password })
    : await supabaseClient.auth.signInWithPassword({ email, password });

  submitButton.disabled = false;
  if (result.error) {
    setMessage(authMessage, result.error.message, "error");
    return;
  }

  if (authMode === "signup") {
    setMessage(authMessage, result.data.session
      ? "Հաշիվը ստեղծվեց։ Եթե էլ․ փոստի հաստատում պահանջվի, նախ հաստատիր նամակից, հետո նորից մուտք գործիր։"
      : "Ստուգիր էլ․ փոստդ և հաստատիր հաշիվը, ապա մուտք գործիր։", "success");
    if (result.data.session) await showDashboardForUser(result.data.user);
    return;
  }

  await showDashboardForUser(result.data.user);
});

document.getElementById("denied-signout").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showScreen("auth");
});

document.getElementById("signout-button").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  showScreen("auth");
  setMessage(authMessage, "Դուրս եկար համակարգից։");
});

document.getElementById("cancel-edit").addEventListener("click", resetProductForm);
document.getElementById("catalog-filter").addEventListener("change", renderProductList);
productForm.addEventListener("submit", saveProduct);
document.getElementById("save-banners").addEventListener("click", saveBannerImages);
bannerTitleInput.addEventListener("input", () => setMessage(document.getElementById("banner-message")));
bannerDescriptionInput.addEventListener("input", () => setMessage(document.getElementById("banner-message")));
bannerButtonTextInput.addEventListener("input", () => setMessage(document.getElementById("banner-message")));
bannerTextColorToggle.addEventListener("change", updateBannerTextColorFields);
bannerButtonColorToggle.addEventListener("change", updateBannerButtonColorFields);
bannerButtonTextColorToggle.addEventListener("change", updateBannerButtonTextColorFields);
bannerTextColorPicker.addEventListener("input", () => {
  bannerTextColorCode.value = bannerTextColorPicker.value.toUpperCase();
  setMessage(document.getElementById("banner-message"));
});
bannerTextColorCode.addEventListener("input", () => {
  const normalized = normalizeBannerTextColor(bannerTextColorCode.value);
  if (normalized) bannerTextColorPicker.value = normalized;
  setMessage(document.getElementById("banner-message"));
});
bannerButtonColorPicker.addEventListener("input", () => {
  bannerButtonColorCode.value = bannerButtonColorPicker.value.toUpperCase();
  setMessage(document.getElementById("banner-message"));
});
bannerButtonColorCode.addEventListener("input", () => {
  const normalized = normalizeBannerTextColor(bannerButtonColorCode.value);
  if (normalized) bannerButtonColorPicker.value = normalized;
  setMessage(document.getElementById("banner-message"));
});
bannerButtonTextColorPicker.addEventListener("input", () => {
  bannerButtonTextColorCode.value = bannerButtonTextColorPicker.value.toUpperCase();
  setMessage(document.getElementById("banner-message"));
});
bannerButtonTextColorCode.addEventListener("input", () => {
  const normalized = normalizeBannerTextColor(bannerButtonTextColorCode.value);
  if (normalized) bannerButtonTextColorPicker.value = normalized;
  setMessage(document.getElementById("banner-message"));
});
document.getElementById("banner-editor-list").addEventListener("change", event => {
  const input = event.target;
  if (input.matches(".banner-slide-enabled")) {
    input.closest(".banner-slide-editor")?.classList.toggle("is-disabled", !input.checked);
    setMessage(document.getElementById("banner-message"));
    return;
  }
  if (!input.matches(".banner-file-input")) return;

  const file = input.files?.[0];
  const preview = input.parentElement.querySelector(".banner-image-preview");
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
    input.value = "";
    setMessage(document.getElementById("banner-message"), "Ընտրիր նկար մինչև 10 ՄԲ չափով։", "error");
    return;
  }

  const oldUrl = bannerPreviewObjectUrls.get(preview);
  if (oldUrl) URL.revokeObjectURL(oldUrl);
  const objectUrl = URL.createObjectURL(file);
  bannerPreviewObjectUrls.set(preview, objectUrl);
  preview.src = objectUrl;
  setMessage(document.getElementById("banner-message"));
});
document.getElementById("product-image-file").addEventListener("change", event => {
  const file = event.target.files?.[0] || null;
  selectedImageFile = null;
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;

  const preview = document.getElementById("image-upload-preview");
  const previewImage = document.getElementById("image-preview");
  const previewName = document.getElementById("image-preview-name");
  if (!file) {
    preview.hidden = true;
    previewImage.removeAttribute("src");
    previewName.textContent = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    event.target.value = "";
    setMessage(productMessage, "Ընտրիր նկարային ֆայլ։", "error");
    preview.hidden = true;
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    event.target.value = "";
    setMessage(productMessage, "Նկարը պետք է լինի մինչև 10 ՄԲ։", "error");
    preview.hidden = true;
    return;
  }

  selectedImageFile = file;
  previewObjectUrl = URL.createObjectURL(file);
  previewImage.src = previewObjectUrl;
  previewName.textContent = file.name;
  preview.hidden = false;
  setMessage(productMessage);
});

newBrandLogoFileInput.addEventListener("change", event => {
  const file = event.target.files?.[0] || null;
  selectedBrandLogoFile = null;
  if (brandLogoPreviewObjectUrl) URL.revokeObjectURL(brandLogoPreviewObjectUrl);
  brandLogoPreviewObjectUrl = null;

  if (!file) {
    newBrandLogoPreview.hidden = true;
    newBrandLogoPreviewImage.removeAttribute("src");
    newBrandLogoPreviewName.textContent = "";
    return;
  }

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    event.target.value = "";
    setMessage(productMessage, "Լոգոյի համար ընտրիր PNG, JPEG կամ WebP նկար։", "error");
    newBrandLogoPreview.hidden = true;
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    event.target.value = "";
    setMessage(productMessage, "Լոգոյի ֆայլը պետք է լինի մինչև 10 ՄԲ։", "error");
    newBrandLogoPreview.hidden = true;
    return;
  }

  selectedBrandLogoFile = file;
  brandLogoPreviewObjectUrl = URL.createObjectURL(file);
  newBrandLogoPreviewImage.src = brandLogoPreviewObjectUrl;
  newBrandLogoPreviewName.textContent = file.name;
  newBrandLogoPreview.hidden = false;
  setMessage(productMessage);
});

if (!supabaseClient) {
  showScreen("auth");
  setMessage(authMessage, "Supabase կապը չհաջողվեց բեռնել։ Թարմացրու էջը կամ ստուգիր ինտերնետը։", "error");
} else {
  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
      setMessage(authMessage, error.message, "error");
      return;
    }
    if (data.session?.user) showDashboardForUser(data.session.user);
  });
}
