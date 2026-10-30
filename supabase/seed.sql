insert into public.products (id, category_key, subcategory, display_order, title, price, old_price, image_url, badge, brand, brand_logo, condition)
values
  (1, 'techniqua', 'Լվացքի մեքենաներ', 0, 'Լվացքի մեքենա Samsung', '180,000 դր', '210,000 դր', 'assets/washing/washing-autumn.png', 'urgent', 'Samsung', 'assets/brands/beko.svg', 'new'),
  (11, 'techniqua', 'Լվացքի մեքենաներ', 1, 'Լվացքի մեքենա Samsung', '180,000 դր', '210,000 դր', 'assets/washing/washing-autumn.png', 'new', 'Samsung', 'assets/brands/beko.svg', 'new'),
  (12, 'techniqua', 'Լվացքի մեքենաներ', 2, 'Լվացքի մեքենա Samsung', '180,000 դր', '210,000 դր', 'assets/washing/washing-autumn.png', 'special', 'Samsung', 'assets/brands/beko.svg', 'new'),
  (2, 'techniqua', 'Լվացքի մեքենաներ', 3, 'Լվացքի մեքենա LG AI DD', '220,000 դր', '', 'assets/washing/washing-1.png', 'new_item', 'Samsung', 'assets/brands/samsung.svg', 'used'),
  (103, 'techniqua', 'Լվացքի մեքենաներ', 4, 'Լվացքի մեքենա Bosch Serie 6', '245,000 դր', '270,000 դր', 'assets/washing/washing-1.png', 'sale', 'Samsung', 'assets/brands/lg.svg', 'used'),
  (104, 'techniqua', 'Լվացքի մեքենաներ', 5, 'Լվացքի մեքենա Samsung 5kg', '40,000 դր', '60,000 դր', 'assets/washing/samsung-5kg-used.jpg', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'used'),
  (105, 'techniqua', 'Լվացքի մեքենաներ', 6, 'Լվացքի մեքենա Hisense 7kg', '70,000 դր', '90,000 դր', 'assets/washing/hisense-7kg-used.jpg', 'sale', 'Hisense', 'assets/brands/hisense.svg', 'used'),
  (106, 'techniqua', 'Լվացքի մեքենաներ', 7, 'Լվացքի մեքենա Indesit 7kg', '140,000 դր', '', 'assets/washing/indesit-7kg-new.jpg', 'sale', 'Indesit', 'assets/brands/indesit.svg', 'new'),
  (5, 'techniqua', 'Սառնարաններ', 0, 'Սառնարան No Frost', '280,000 դր', '310,000 դր', 'assets/refregirators/refrejirator-1.png', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'used'),
  (55, 'techniqua', 'Սառնարաններ', 1, 'Սառնարան No Frost', '280,000 դր', '310,000 դր', 'assets/refregirators/refrejirator-1.png', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'used'),
  (202, 'techniqua', 'Սառնարաններ', 2, 'Երկխորշ Սառնարան Samsung Side-by-Side', '450,000 դր', '500,000 դր', 'assets/refregirators/refrejirator-1.png', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'used'),
  (203, 'techniqua', 'Սառնարաններ', 3, 'Սառնարան LG Total No Frost', '340,000 դր', '', 'assets/refregirators/refrejirator-1.png', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'used'),
  (3, 'techniqua', 'Սպասք լվալու մեքենաներ', 0, 'Սպասք լվացող մեքենա Bosch', '195,000 դր', '', 'assets/dishwash/dishwash-1.png', 'sale', 'Samsung', 'assets/brands/hisense.svg', 'used'),
  (39, 'techniqua', 'Սպասք լվալու մեքենաներ', 1, 'դֆդֆ մեքենա Bosch', '195,000 դր', '', 'assets/dishwash/dishwash-1.png', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'used'),
  (303, 'techniqua', 'Սպասք լվալու մեքենաներ', 2, 'Սպասք լվացող մեքենա Siemens', '240,000 դր', '270,000 դր', 'assets/dishwash/dishwash-autumn.png', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'used'),
  (33, 'techniqua', 'Սպասք լվալու մեքենաներ', 3, 'Սպասք լվացող մեքենա Siemens', '240,000 դր', '270,000 դր', 'assets/dishwash/dishwash-autumn.png', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'used'),
  (4, 'spare_parts', 'Պահեստամասեր', 0, 'Պոլպնակ (Pomp) լվացքի մեքենայի', '8,000 դր', '10,000 դր', 'assets/spare/sp-1.png', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'used'),
  (402, 'spare_parts', 'Պահեստամասեր', 1, 'Տաքացուցիչ (ТЭН) լվացքի մեքենայի', '6,500 դր', '8,000 դր', 'assets/spare/sp-1.png', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'new'),
  (403, 'spare_parts', 'Պահեստամասեր', 2, 'Սառնարանի թերմոստատ', '5,000 դր', '', 'assets/spare/sp-1.png', 'sale', 'Samsung', 'assets/brands/samsung.svg', 'used')
on conflict (id) do update set
  category_key = excluded.category_key,
  subcategory = excluded.subcategory,
  display_order = excluded.display_order,
  title = excluded.title,
  price = excluded.price,
  old_price = excluded.old_price,
  image_url = excluded.image_url,
  badge = excluded.badge,
  brand = excluded.brand,
  brand_logo = excluded.brand_logo,
  condition = excluded.condition;

insert into public.site_config (key, value)
values
  ('badge_options', '{"sale":{"text":"-40%","bg_color":"red"},"sold_out":{"text":"Sold out","bg_color":"gray"},"urgent":{"text":"Շտապ","bg_color":"#fd7e14"},"new_item":{"text":"Նոր տեսականի","bg_color":"green"},"special":{"text":"Հատուկ առաջարկ","bg_color":"blue"},"new":{"text":"New","bg_color":"purple"}}'::jsonb),
  ('banner', '{"title":"Աշնանային մինչև 40% Զեղչ ամբողջ տեսականու համար","description":"Զանգահարիր հիմա և ստացիր քո զեղչը","button_text":"Տեսնել ապրանքները","button_link":"#products","image_url":"assets/banners/hero-banner-web-autumn-sale.png","mobile_image_url":"assets/banners/hero-banner-mob-autumn-sale.png","slides":[{"id":"banner-1","image_url":"assets/banners/hero-banner-web-autumn-sale.png","mobile_image_url":"assets/banners/hero-banner-mob-autumn-sale.png"},{"id":"banner-2","image_url":"assets/banners/hero-banner-web.png","mobile_image_url":"assets/banners/hero-banner-mob.png"},{"id":"banner-3","image_url":"assets/banners/hero-banner-web-general.png","mobile_image_url":"assets/banners/hero-banner-mob-general.png"}]}'::jsonb)
on conflict (key) do update set value = excluded.value;
