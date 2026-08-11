/**
 * All user-facing text, one object, three languages. Add a key here and it
 * is available everywhere via useLang().t(key).
 */
export const DEFAULT_LANG = "en";
export type Lang = "en" | "ilo" | "tl";

type Entry = Record<Lang, string>;

export const STRINGS: Record<string, Entry> = {
  // -- meta / shell -------------------------------------------------
  window_title:    { en: "Pan - Inventory Management System", ilo: "Pan - Panagimatang ti Imbentaryo", tl: "Pan - Sistema ng Imbentaryo" },
  app_name:        { en: "Panziann",                          ilo: "Panziann",                         tl: "Panziann" },

  // -- language picker ---------------------------------------------
  language:        { en: "Language", ilo: "Pagsasao", tl: "Wika" },
  english:         { en: "English",  ilo: "Ingles",   tl: "Ingles" },
  ilokano:         { en: "Ilokano",  ilo: "Iluko",    tl: "Ilokano" },
  tagalog:         { en: "Tagalog",  ilo: "Tagalog",  tl: "Tagalog" },

  // -- auth ---------------------------------------------------------
  login:              { en: "Log in",                       ilo: "Sumrek",                             tl: "Mag-log in" },
  logout:             { en: "Log out",                      ilo: "Rumuar",                             tl: "Mag-log out" },
  username:           { en: "Username",                     ilo: "Nagan ti agar-aramat",               tl: "Username" },
  password:           { en: "Password",                     ilo: "Tulbek",                             tl: "Password" },
  remember_me:        { en: "Remember me",                  ilo: "Laglagipennak",                      tl: "Tandaan ako" },
  sign_in:            { en: "Sign in",                      ilo: "Sumrek",                             tl: "Mag-sign in" },
  totp_code:          { en: "Authenticator code",           ilo: "Kodigo ti authenticator",            tl: "Authenticator code" },
  missing_credentials:{ en: "Enter username and password.", ilo: "Ikkam ti username ken tulbek.",      tl: "Ilagay ang username at password." },
  invalid_credentials:{ en: "Wrong username or password.",  ilo: "Saan a husto ti nagan wenno tulbek.",tl: "Mali ang username o password." },
  rate_limited:       { en: "Too many attempts. Try again later.", ilo: "Adu unay ti panagpadas. Padasem manen.", tl: "Sobrang dami ng pagsubok. Subukan mamaya." },
  unauthenticated:    { en: "Please sign in.",              ilo: "Sumrek pay laeng.",                  tl: "Mag-sign in muna." },
  invalid_totp:       { en: "Wrong authenticator code.",    ilo: "Saan a husto ti kodigo.",            tl: "Mali ang authenticator code." },
  password_too_short: { en: "Password must be at least 8 characters.", ilo: "Ti tulbek masapul 8+ letra.", tl: "Password dapat 8+ karakter." },
  passwords_do_not_match: { en: "Passwords do not match.",  ilo: "Saan nga agpada dagiti tulbek.",     tl: "Hindi tugma ang mga password." },
  error_generic:      { en: "Something went wrong.",        ilo: "Adda saan a nasayaat.",              tl: "May problema." },

  // -- nav ----------------------------------------------------------
  nav_menu:        { en: "Menu",         ilo: "Menu",                   tl: "Menu" },
  nav_cart:        { en: "Cart",         ilo: "Kariton",                tl: "Cart" },
  nav_my_orders:   { en: "My orders",    ilo: "Dagiti orderko",         tl: "Aking orders" },
  nav_orders:      { en: "Orders",       ilo: "Dagiti order",           tl: "Mga order" },
  nav_inventory:   { en: "Inventory",    ilo: "Imbentaryo",             tl: "Imbentaryo" },
  nav_menu_edit:   { en: "Edit menu",    ilo: "Baliwan ti menu",        tl: "I-edit menu" },
  nav_upload:      { en: "Upload Excel", ilo: "Iyapload ti Excel",      tl: "Mag-upload ng Excel" },
  nav_users:       { en: "Users",        ilo: "Dagiti agar-aramat",     tl: "Mga user" },
  nav_analytics:   { en: "Analytics",    ilo: "Panagsuki",              tl: "Analytics" },

  // -- forbidden / errors ------------------------------------------
  forbidden:       { en: "Access denied",  ilo: "Naiparit ti panagsrek", tl: "Bawal pumasok" },
  forbidden_desc:  { en: "Your role cannot access this page.",
                     ilo: "Saan a mabalin ti rolem ti agsrek iti daytoy.",
                     tl: "Hindi maaari ng iyong role na pumasok dito." },
  loading:         { en: "Loading...",     ilo: "Ur-urayem...",           tl: "Naglo-load..." },
  back_home:       { en: "Back to menu",   ilo: "Agsubli iti menu",       tl: "Balik sa menu" },

  // -- excel upload (existing feature) -----------------------------
  upload_heading:  { en: "Upload current inventory",         ilo: "Iyapload ti agdama nga imbentaryo", tl: "I-upload ang kasalukuyang imbentaryo" },
  upload_sub:      { en: "Choose the Excel file to import.", ilo: "Piliem ti Excel a papan-iyapload.", tl: "Piliin ang Excel na i-uupload." },
  choose_file:     { en: "CHOOSE FILE",    ilo: "PILIEN TI FILE",         tl: "PILIIN ANG FILE" },
  upload_done:     { en: "Done!",          ilo: "Nalpasen!",              tl: "Tapos na!" },
  new_products:    { en: "new products",   ilo: "baro a produkto",        tl: "bagong produkto" },
  updated:         { en: "updated",        ilo: "na-update",              tl: "na-update" },
  skipped:         { en: "skipped",        ilo: "nalabsan",               tl: "nilaktawan" },
  upload_failed:   { en: "Upload failed.", ilo: "Saan a nag-upload.",     tl: "Hindi na-upload." },
  no_products:     { en: "No products found. The sheet needs a column named Product or Item.",
                     ilo: "Awan nabirukan a produkto. Kasapulan ti kolum a Product wenno Item.",
                     tl: "Walang nakitang produkto. Kailangan ng kolum na Product o Item." },
  no_file:         { en: "No file selected.", ilo: "Awan napili a file.", tl: "Walang piniling file." },

  // -- inventory / products ----------------------------------------
  add_product:       { en: "Add product",     ilo: "Mangnayon a produkto",  tl: "Magdagdag ng produkto" },
  edit_product:      { en: "Edit product",    ilo: "Baliwan ti produkto",   tl: "I-edit ang produkto" },
  name:              { en: "Name",            ilo: "Nagan",                 tl: "Pangalan" },
  category:          { en: "Category",        ilo: "Kategoria",             tl: "Kategorya" },
  unit:              { en: "Unit",            ilo: "Yunit",                 tl: "Yunit" },
  location:          { en: "Location",        ilo: "Lugar",                 tl: "Lokasyon" },
  supplier:          { en: "Supplier",        ilo: "Nagtaudan",             tl: "Supplier" },
  unit_price:        { en: "Unit price",      ilo: "Presyo",                tl: "Presyo bawat yunit" },
  quantity:          { en: "Quantity",        ilo: "Bilang",                tl: "Dami" },
  low_stock:         { en: "Low stock",       ilo: "Bassit ti stok",        tl: "Mababa ang stock" },
  low_stock_threshold: { en: "Low-stock threshold", ilo: "Limit ti bassit a stok", tl: "Threshold ng low stock" },
  image:             { en: "Image",           ilo: "Ladawan",               tl: "Larawan" },
  save:              { en: "Save",            ilo: "Isalbar",               tl: "I-save" },
  cancel:            { en: "Cancel",          ilo: "Waksien",               tl: "Kanselahin" },
  edit:              { en: "Edit",            ilo: "Baliwan",               tl: "I-edit" },
  delete:            { en: "Delete",          ilo: "Ikkaten",               tl: "Burahin" },
  confirm_delete:    { en: "Delete this?",    ilo: "Ikkatem daytoy?",       tl: "Burahin ito?" },
  inventory_empty:   { en: "No products yet.",ilo: "Awan pay ti produkto.", tl: "Wala pang produkto." },
  low_stock_banner:  { en: "products below threshold", ilo: "produkto nga bassit ti stok", tl: "produktong mababa" },
  adjust_stock:      { en: "Adjust stock",    ilo: "Baliwan ti stok",       tl: "I-adjust ang stock" },
  reason:            { en: "Reason",          ilo: "Rason",                 tl: "Dahilan" },
  reason_code:       { en: "Reason code",     ilo: "Kodigo ti rason",       tl: "Reason code" },
  note:              { en: "Note",            ilo: "Nota",                  tl: "Note" },
  delta:             { en: "Change (+/-)",    ilo: "Sukat (+/-)",           tl: "Pagbabago (+/-)" },
  reason_opening:    { en: "Opening",         ilo: "Panglukat",             tl: "Panimula" },
  reason_delivery:   { en: "Delivery",        ilo: "Naidalanan",            tl: "Delivery" },
  reason_usage:      { en: "Usage",           ilo: "Nausar",                tl: "Nagamit" },
  reason_waste:      { en: "Waste",           ilo: "Nasayang",              tl: "Nasayang" },
  reason_correction: { en: "Correction",      ilo: "Panamalinteg",          tl: "Correction" },
  duplicate_name:    { en: "That name already exists.", ilo: "Adda metten dayta a nagan.", tl: "Meron nang ganyan na pangalan." },
  missing_name:      { en: "Name is required.", ilo: "Kasapulan ti nagan.", tl: "Kailangan ng pangalan." },
  missing_price:     { en: "Price is required.", ilo: "Kasapulan ti presyo.", tl: "Kailangan ng presyo." },

  // -- menu ---------------------------------------------------------
  add_dish:          { en: "Add dish",         ilo: "Mangnayon a putahe",     tl: "Magdagdag ng ulam" },
  edit_dish:         { en: "Edit dish",        ilo: "Baliwan ti putahe",      tl: "I-edit ang ulam" },
  description:       { en: "Description",      ilo: "Deskripsion",            tl: "Paglalarawan" },
  price:             { en: "Price",            ilo: "Presyo",                 tl: "Presyo" },
  available:         { en: "Available",        ilo: "Adda",                   tl: "Available" },
  unavailable:       { en: "Unavailable",      ilo: "Awan",                   tl: "Wala" },
  recipe:            { en: "Recipe",           ilo: "Resipe",                 tl: "Recipe" },
  add_ingredient:    { en: "+ Add ingredient", ilo: "+ Mangnayon a sangkap",  tl: "+ Magdagdag ng sangkap" },
  menu_empty:        { en: "No dishes yet.",   ilo: "Awan pay ti putahe.",    tl: "Wala pang ulam." },
  add_to_cart:       { en: "Add to cart",      ilo: "Inayon iti kariton",     tl: "Idagdag sa cart" },
  menu_item_not_found: { en: "Dish not found.", ilo: "Awan a nabirukan a putahe.", tl: "Hindi mahanap ang ulam." },

  // -- tables / QR ordering -----------------------------------------
  nav_tables:        { en: "Tables",           ilo: "Dagiti lamisaan",        tl: "Mga mesa" },
  locations:         { en: "Locations",        ilo: "Dagiti lugar",           tl: "Mga lokasyon" },
  add_location:      { en: "Add location",     ilo: "Mangnayon a lugar",      tl: "Magdagdag ng lokasyon" },
  add_table:         { en: "Add table",        ilo: "Mangnayon a lamisaan",   tl: "Magdagdag ng mesa" },
  table_label:       { en: "Table label",      ilo: "Etiketa ti lamisaan",    tl: "Label ng mesa" },
  print_qr:          { en: "Print QR",         ilo: "I-print ti QR",          tl: "I-print ang QR" },
  no_location:       { en: "No location",      ilo: "Awan lugar",             tl: "Walang lokasyon" },
  tables_empty:      { en: "No tables yet.",   ilo: "Awan pay ti lamisaan.",  tl: "Wala pang mesa." },
  table_not_found:   { en: "Table not found.", ilo: "Awan a nabirukan a lamisaan.", tl: "Hindi mahanap ang mesa." },
  location_not_found:{ en: "Location not found.", ilo: "Awan a nabirukan a lugar.", tl: "Hindi mahanap ang lokasyon." },
};

export function t(key: string, lang: string): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return (entry as Record<string, string>)[lang] ?? entry[DEFAULT_LANG] ?? key;
}
