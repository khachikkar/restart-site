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

let authMode = "signin";
let products = [];
let isEditing = false;
let selectedImageFile = null;
let previewObjectUrl = null;
let bannerConfig = null;
const bannerPreviewObjectUrls = new WeakMap();

function setMessage(element, message = "", type = "") {
  element.textContent = message;
  element.classList.toggle("is-error", type === "error");
  element.classList.toggle("is-success", type === "success");
}

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
    .order("subcategory", { ascending: true })
    .order("display_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    setMessage(catalogMessage, `Ապրանքները չբեռնվեցին․ ${error.message}`, "error");
    return;
  }

  products = data || [];
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

  Object.entries(data.value).forEach(([key, badge]) => {
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
    card.appendChild(heading);

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
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = null;
  document.getElementById("image-upload-preview").hidden = true;
  document.getElementById("image-preview").removeAttribute("src");
  document.getElementById("image-preview-name").textContent = "";
  document.getElementById("product-id").disabled = false;
  document.getElementById("product-condition").value = "new";
  document.getElementById("product-category").value = "washing";
  document.getElementById("product-badge").value = "";
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
  document.getElementById("product-badge").value = product.badge || "";
  document.getElementById("product-brand").value = product.brand || "";
  document.getElementById("product-brand-logo").value = product.brand_logo || "";
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
  const existing = products.find(product => product.id === id);
  const existingImageUrl = document.getElementById("product-image").value.trim();
  if (!selectedImageFile && !existingImageUrl) {
    setMessage(productMessage, "Ընտրիր նկարը համակարգչից կամ լրացրու նկարի հղումը։", "error");
    saveButton.disabled = false;
    return;
  }

  let imageUrl = existingImageUrl;
  if (selectedImageFile) {
    setMessage(productMessage, "Նկարը վերբեռնվում է…");
    try {
      imageUrl = await uploadAdminImage(selectedImageFile, `products/${id}`);
    } catch (uploadError) {
      setMessage(productMessage, `Նկարը չվերբեռնվեց․ ${uploadError.message}`, "error");
      saveButton.disabled = false;
      return;
    }
  }

  const payload = {
    id,
    category_key: category.category_key,
    subcategory: category.subcategory,
    display_order: isEditing && existing
      ? existing.display_order
      : Math.max(0, ...products.filter(product => product.subcategory === category.subcategory).map(product => product.display_order + 1)),
    title: document.getElementById("product-title").value.trim(),
    price: document.getElementById("product-price").value.trim(),
    old_price: document.getElementById("product-old-price").value.trim(),
    image_url: imageUrl,
    badge: document.getElementById("product-badge").value || null,
    brand: document.getElementById("product-brand").value.trim() || null,
    brand_logo: document.getElementById("product-brand-logo").value.trim() || null,
    condition: document.getElementById("product-condition").value
  };

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

  button.disabled = true;
  setMessage(message, "Նկարները պահվում են…");
  const updatedBanner = JSON.parse(JSON.stringify(bannerConfig));

  try {
    for (const card of document.querySelectorAll(".banner-slide-editor")) {
      const index = Number(card.dataset.slideIndex);
      const slide = updatedBanner.slides[index];
      const slideName = slide.id || `banner-${index + 1}`;
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
    setMessage(message, "Բանների նկարները պահպանվեցին։ Կայքը կցուցադրի նոր նկարները թարմացումից հետո։", "success");
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
document.getElementById("banner-editor-list").addEventListener("change", event => {
  const input = event.target;
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
