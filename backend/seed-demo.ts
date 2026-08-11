/**
 * Demo seed for tomorrow's pitch. Idempotent: re-running wipes seed rows and
 * reinserts them. Bootstrap super_admin ("admin") is left untouched.
 *
 * Run:
 *   bun run backend/seed-demo.ts
 *
 * Demo accounts (all password: pannzian2026):
 *   owner   / pannzian2026   — role: owner    (menu, users, analytics)
 *   chef    / pannzian2026   — role: staff    (inventory, orders queue)
 *   server  / pannzian2026   — role: staff    (orders queue, menu upload)
 *   guest   / pannzian2026   — role: visitor  (place orders only)
 */

import { getDb } from "./db";
import { hashPassword, bootstrapSuperAdmin } from "./auth";

const DEMO_PASSWORD = "pannzian2026";

interface DemoAccount { username: string; role: "owner" | "staff" | "visitor" }
const ACCOUNTS: DemoAccount[] = [
  { username: "owner",  role: "owner"   },
  { username: "chef",   role: "staff"   },
  { username: "server", role: "staff"   },
  { username: "guest",  role: "visitor" },
];

interface DemoProduct {
  name: string; category: string; unit: string; location: string; supplier: string;
  unit_price: number; low_stock_threshold: number; opening_qty: number;
}

// Pannzian's back-of-house pantry. Prices in ₱, thresholds set so a handful
// of items land in the low-stock chip for the pitch.
const PRODUCTS: DemoProduct[] = [
  // Grains & staples
  { name: "Jasmine Rice",       category: "Grains",     unit: "kg",   location: "Dry Store A", supplier: "Sunrise Grains",   unit_price:   72, low_stock_threshold:  15, opening_qty: 48 },
  { name: "Garlic Rice Mix",    category: "Grains",     unit: "kg",   location: "Dry Store A", supplier: "Sunrise Grains",   unit_price:   90, low_stock_threshold:   8, opening_qty:  6 },
  { name: "Sugar (white)",      category: "Grains",     unit: "kg",   location: "Dry Store A", supplier: "Batangas Trading", unit_price:   68, low_stock_threshold:   5, opening_qty: 12 },
  { name: "Salt (sea)",         category: "Grains",     unit: "kg",   location: "Dry Store A", supplier: "Pangasinan Salts", unit_price:   38, low_stock_threshold:   3, opening_qty:  9 },

  // Meat & seafood
  { name: "Chicken Thigh",      category: "Meat",       unit: "kg",   location: "Chiller 1",   supplier: "Bounty Fresh",     unit_price:  240, low_stock_threshold:   6, opening_qty: 14 },
  { name: "Pork Belly (liempo)",category: "Meat",       unit: "kg",   location: "Chiller 1",   supplier: "Monterey Meats",   unit_price:  360, low_stock_threshold:   5, opening_qty:  4 },
  { name: "Beef Shank",         category: "Meat",       unit: "kg",   location: "Chiller 1",   supplier: "Monterey Meats",   unit_price:  420, low_stock_threshold:   4, opening_qty:  9 },
  { name: "Longganisa (skinless)", category: "Meat",    unit: "kg",   location: "Chiller 1",   supplier: "Vigan Provisions", unit_price:  310, low_stock_threshold:   3, opening_qty:  2.5 },
  { name: "Bangus (deboned)",   category: "Seafood",    unit: "pc",   location: "Chiller 2",   supplier: "Dagupan Fisheries",unit_price:  145, low_stock_threshold:  12, opening_qty: 22 },
  { name: "Shrimp (medium)",    category: "Seafood",    unit: "kg",   location: "Chiller 2",   supplier: "Dagupan Fisheries",unit_price:  580, low_stock_threshold:   3, opening_qty:  6 },
  { name: "Squid (cleaned)",    category: "Seafood",    unit: "kg",   location: "Chiller 2",   supplier: "Dagupan Fisheries",unit_price:  360, low_stock_threshold:   3, opening_qty:  4 },

  // Produce
  { name: "Calamansi",          category: "Produce",    unit: "kg",   location: "Chiller 3",   supplier: "Batangas Farms",   unit_price:  120, low_stock_threshold:   2, opening_qty:  5 },
  { name: "Ripe Mango",         category: "Produce",    unit: "kg",   location: "Chiller 3",   supplier: "Guimaras Growers", unit_price:  180, low_stock_threshold:   6, opening_qty:  4 },
  { name: "Coconut Milk",       category: "Produce",    unit: "L",    location: "Dry Store B", supplier: "Quezon Coco Co.",  unit_price:  110, low_stock_threshold:   6, opening_qty: 14 },
  { name: "Young Coconut Meat", category: "Produce",    unit: "kg",   location: "Chiller 3",   supplier: "Quezon Coco Co.",  unit_price:  160, low_stock_threshold:   3, opening_qty:  7 },
  { name: "White Onion",        category: "Produce",    unit: "kg",   location: "Dry Store B", supplier: "Nueva Ecija Farms",unit_price:   85, low_stock_threshold:   5, opening_qty: 11 },
  { name: "Garlic",             category: "Produce",    unit: "kg",   location: "Dry Store B", supplier: "Nueva Ecija Farms",unit_price:  180, low_stock_threshold:   2, opening_qty:  1.5 },
  { name: "Ginger",             category: "Produce",    unit: "kg",   location: "Dry Store B", supplier: "Nueva Ecija Farms",unit_price:  140, low_stock_threshold:   2, opening_qty:  3 },
  { name: "Tomato",             category: "Produce",    unit: "kg",   location: "Chiller 3",   supplier: "Batangas Farms",   unit_price:   80, low_stock_threshold:   4, opening_qty:  6 },
  { name: "Kangkong",           category: "Produce",    unit: "bundle", location: "Chiller 3", supplier: "Batangas Farms",   unit_price:   35, low_stock_threshold:   5, opening_qty: 12 },
  { name: "Sitao (long beans)", category: "Produce",    unit: "kg",   location: "Chiller 3",   supplier: "Batangas Farms",   unit_price:   90, low_stock_threshold:   2, opening_qty:  1 },
  { name: "Pandan Leaves",      category: "Produce",    unit: "bundle", location: "Chiller 3", supplier: "Laguna Herbs",     unit_price:   40, low_stock_threshold:   3, opening_qty:  5 },
  { name: "Ube (mashed)",       category: "Produce",    unit: "kg",   location: "Freezer 1",   supplier: "Baguio Root Co.",  unit_price:  220, low_stock_threshold:   2, opening_qty:  3 },

  // Dairy & eggs
  { name: "Eggs (medium)",      category: "Dairy",      unit: "tray", location: "Chiller 1",   supplier: "Bounty Fresh",     unit_price:  220, low_stock_threshold:   4, opening_qty:  8 },
  { name: "Evaporated Milk",    category: "Dairy",      unit: "can",  location: "Dry Store A", supplier: "Alaska Milk",      unit_price:   38, low_stock_threshold:  12, opening_qty: 30 },
  { name: "Condensed Milk",     category: "Dairy",      unit: "can",  location: "Dry Store A", supplier: "Alaska Milk",      unit_price:   48, low_stock_threshold:  10, opening_qty: 24 },

  // Condiments
  { name: "Soy Sauce",          category: "Condiments", unit: "L",    location: "Dry Store B", supplier: "Silver Swan",      unit_price:   62, low_stock_threshold:   4, opening_qty:  9 },
  { name: "Cane Vinegar",       category: "Condiments", unit: "L",    location: "Dry Store B", supplier: "Datu Puti",        unit_price:   48, low_stock_threshold:   4, opening_qty: 10 },
  { name: "Patis (fish sauce)", category: "Condiments", unit: "L",    location: "Dry Store B", supplier: "Rufina Patis",     unit_price:   70, low_stock_threshold:   3, opening_qty:  6 },
  { name: "Bagoong (sauteed)",  category: "Condiments", unit: "jar",  location: "Dry Store B", supplier: "Barrio Fiesta",    unit_price:  110, low_stock_threshold:   4, opening_qty:  9 },
  { name: "Tamarind Paste",     category: "Condiments", unit: "pack", location: "Dry Store B", supplier: "Knorr",            unit_price:   28, low_stock_threshold:  10, opening_qty: 24 },
  { name: "Cooking Oil",        category: "Condiments", unit: "L",    location: "Dry Store B", supplier: "Baguio Oil",       unit_price:   95, low_stock_threshold:   6, opening_qty: 14 },

  // Beverages
  { name: "Sago Pearls",        category: "Beverages",  unit: "kg",   location: "Dry Store A", supplier: "Manila Suppliers", unit_price:  140, low_stock_threshold:   2, opening_qty:  4 },
  { name: "Iced Tea Powder",    category: "Beverages",  unit: "kg",   location: "Dry Store A", supplier: "Nestle Pro",       unit_price:  260, low_stock_threshold:   2, opening_qty:  5 },
  { name: "San Miguel Pale",    category: "Beverages",  unit: "bottle",location: "Chiller 4",  supplier: "SMC",              unit_price:   68, low_stock_threshold:  24, opening_qty: 48 },
];

interface DemoMenuItem {
  name: string; category: string; description: string; price: number;
  ingredients: { product: string; quantity: number }[];
  available?: boolean;
}

const MENU: DemoMenuItem[] = [
  // Breakfast (silogs)
  {
    name: "Tapsilog",
    category: "Breakfast",
    description: "Beef tapa cured overnight, garlic rice, sunny-side egg, side of atchara.",
    price: 195,
    ingredients: [
      { product: "Beef Shank",       quantity: 0.18 },
      { product: "Garlic Rice Mix",  quantity: 0.20 },
      { product: "Eggs (medium)",    quantity: 0.033 },
      { product: "Soy Sauce",        quantity: 0.03 },
      { product: "Garlic",           quantity: 0.01 },
    ],
  },
  {
    name: "Longsilog",
    category: "Breakfast",
    description: "Sweet skinless longganisa, garlic rice, egg, cane vinegar dip.",
    price: 175,
    ingredients: [
      { product: "Longganisa (skinless)", quantity: 0.15 },
      { product: "Garlic Rice Mix",       quantity: 0.20 },
      { product: "Eggs (medium)",         quantity: 0.033 },
      { product: "Cane Vinegar",          quantity: 0.02 },
    ],
  },
  {
    name: "Bangsilog",
    category: "Breakfast",
    description: "Marinated deboned bangus, garlic rice, egg, calamansi wedges.",
    price: 210,
    ingredients: [
      { product: "Bangus (deboned)",  quantity: 1 },
      { product: "Garlic Rice Mix",   quantity: 0.20 },
      { product: "Eggs (medium)",     quantity: 0.033 },
      { product: "Calamansi",         quantity: 0.02 },
      { product: "Soy Sauce",         quantity: 0.02 },
    ],
  },

  // Rice bowls
  {
    name: "Chicken Adobo Rice Bowl",
    category: "Rice Bowls",
    description: "Slow-braised chicken thigh in soy, vinegar, bay, and cracked pepper. Steamed rice.",
    price: 220,
    ingredients: [
      { product: "Chicken Thigh",  quantity: 0.22 },
      { product: "Jasmine Rice",   quantity: 0.20 },
      { product: "Soy Sauce",      quantity: 0.05 },
      { product: "Cane Vinegar",   quantity: 0.03 },
      { product: "Garlic",         quantity: 0.01 },
      { product: "White Onion",    quantity: 0.03 },
    ],
  },
  {
    name: "Pork Sisig Bowl",
    category: "Rice Bowls",
    description: "Chopped crispy liempo on a hot plate with calamansi and chili. Rice on the side.",
    price: 265,
    ingredients: [
      { product: "Pork Belly (liempo)", quantity: 0.20 },
      { product: "Jasmine Rice",        quantity: 0.20 },
      { product: "Calamansi",           quantity: 0.02 },
      { product: "White Onion",         quantity: 0.04 },
      { product: "Eggs (medium)",       quantity: 0.033 },
    ],
  },
  {
    name: "Bicol Express Rice",
    category: "Rice Bowls",
    description: "Pork belly stewed in coconut milk with siling labuyo. Rice.",
    price: 245,
    ingredients: [
      { product: "Pork Belly (liempo)", quantity: 0.18 },
      { product: "Coconut Milk",        quantity: 0.15 },
      { product: "Jasmine Rice",        quantity: 0.20 },
      { product: "Bagoong (sauteed)",   quantity: 0.02 },
    ],
  },

  // Grilled
  {
    name: "Chicken Inasal (quarter)",
    category: "Grilled",
    description: "Bacolod-style marinated chicken quarter over charcoal, achuete oil.",
    price: 235,
    ingredients: [
      { product: "Chicken Thigh",  quantity: 0.30 },
      { product: "Calamansi",      quantity: 0.03 },
      { product: "Ginger",         quantity: 0.02 },
      { product: "Cane Vinegar",   quantity: 0.03 },
      { product: "Jasmine Rice",   quantity: 0.20 },
    ],
  },
  {
    name: "Liempo Grill",
    category: "Grilled",
    description: "Half-slab pork belly, grilled crisp, house atchara.",
    price: 295,
    ingredients: [
      { product: "Pork Belly (liempo)", quantity: 0.28 },
      { product: "Soy Sauce",           quantity: 0.03 },
      { product: "Calamansi",           quantity: 0.02 },
      { product: "Jasmine Rice",        quantity: 0.20 },
    ],
  },

  // Seafood
  {
    name: "Sinigang na Hipon",
    category: "Seafood",
    description: "Shrimp in tamarind broth with kangkong, sitao, and tomato.",
    price: 320,
    ingredients: [
      { product: "Shrimp (medium)",   quantity: 0.18 },
      { product: "Tamarind Paste",    quantity: 0.03 },
      { product: "Kangkong",          quantity: 0.5 },
      { product: "Sitao (long beans)",quantity: 0.06 },
      { product: "Tomato",            quantity: 0.10 },
      { product: "White Onion",       quantity: 0.04 },
    ],
  },
  {
    name: "Grilled Bangus w/ Ensalada",
    category: "Seafood",
    description: "Whole deboned milkfish, stuffed with tomato and onion, tomato-salted-egg salad.",
    price: 285,
    ingredients: [
      { product: "Bangus (deboned)",  quantity: 1 },
      { product: "Tomato",            quantity: 0.10 },
      { product: "White Onion",       quantity: 0.05 },
      { product: "Calamansi",         quantity: 0.02 },
      { product: "Jasmine Rice",      quantity: 0.20 },
    ],
  },
  {
    name: "Adobong Pusit",
    category: "Seafood",
    description: "Squid braised in its own ink with vinegar and garlic.",
    price: 275,
    ingredients: [
      { product: "Squid (cleaned)",  quantity: 0.20 },
      { product: "Cane Vinegar",     quantity: 0.05 },
      { product: "Soy Sauce",        quantity: 0.03 },
      { product: "Garlic",           quantity: 0.02 },
      { product: "Jasmine Rice",     quantity: 0.20 },
    ],
  },

  // Merienda
  {
    name: "Turon (2 pcs)",
    category: "Merienda",
    description: "Banana and jackfruit spring rolls, caramelized muscovado glaze.",
    price: 95,
    ingredients: [
      { product: "Sugar (white)",  quantity: 0.03 },
      { product: "Cooking Oil",    quantity: 0.02 },
    ],
  },
  {
    name: "Lumpiang Shanghai (6 pcs)",
    category: "Merienda",
    description: "Pork spring rolls, sweet-chili dip.",
    price: 165,
    ingredients: [
      { product: "Pork Belly (liempo)", quantity: 0.10 },
      { product: "White Onion",         quantity: 0.02 },
      { product: "Garlic",              quantity: 0.005 },
      { product: "Cooking Oil",         quantity: 0.03 },
    ],
  },

  // Desserts
  {
    name: "Halo-Halo",
    category: "Desserts",
    description: "Shaved ice, sweet beans, sago, ube halaya, leche flan, evaporated milk.",
    price: 185,
    available: true,
    ingredients: [
      { product: "Evaporated Milk",     quantity: 0.15 },
      { product: "Ube (mashed)",        quantity: 0.05 },
      { product: "Sago Pearls",         quantity: 0.03 },
      { product: "Sugar (white)",       quantity: 0.02 },
      { product: "Young Coconut Meat",  quantity: 0.05 },
    ],
  },
  {
    name: "Buko Pandan",
    category: "Desserts",
    description: "Young coconut, pandan jelly, condensed milk, cream.",
    price: 145,
    ingredients: [
      { product: "Young Coconut Meat", quantity: 0.10 },
      { product: "Pandan Leaves",      quantity: 0.10 },
      { product: "Condensed Milk",     quantity: 0.2 },
    ],
  },
  {
    name: "Ube Cheesecake Slice",
    category: "Desserts",
    description: "Baked ube cheesecake, graham crust, coconut cream drizzle.",
    price: 165,
    ingredients: [
      { product: "Ube (mashed)",       quantity: 0.06 },
      { product: "Condensed Milk",     quantity: 0.15 },
      { product: "Eggs (medium)",      quantity: 0.033 },
    ],
  },

  // Drinks
  {
    name: "Fresh Mango Shake",
    category: "Drinks",
    description: "Ripe Guimaras mango blended with milk and ice.",
    price: 135,
    ingredients: [
      { product: "Ripe Mango",     quantity: 0.20 },
      { product: "Evaporated Milk",quantity: 0.2 },
      { product: "Sugar (white)",  quantity: 0.02 },
    ],
  },
  {
    name: "Calamansi Iced Tea",
    category: "Drinks",
    description: "Iced tea brightened with fresh calamansi.",
    price: 85,
    ingredients: [
      { product: "Iced Tea Powder", quantity: 0.02 },
      { product: "Calamansi",       quantity: 0.02 },
      { product: "Sugar (white)",   quantity: 0.02 },
    ],
  },
  {
    name: "Coconut Water (fresh)",
    category: "Drinks",
    description: "Chilled buko juice, served in the shell.",
    price: 95,
    available: false,
    ingredients: [
      { product: "Young Coconut Meat", quantity: 0.15 },
    ],
  },
  {
    name: "San Miguel Pale Pilsen",
    category: "Drinks",
    description: "The classic. Ice-cold, one bottle.",
    price: 95,
    ingredients: [
      { product: "San Miguel Pale", quantity: 1 },
    ],
  },
];

// ---------------------------------------------------------------------

const db = getDb();
await bootstrapSuperAdmin(db);

// Wipe seed rows before reinserting. Preserve super_admin and any real orders.
db.transaction(() => {
  db.query(`DELETE FROM users WHERE role != 'super_admin' AND username IN (${ACCOUNTS.map(() => "?").join(",")})`)
    .run(...ACCOUNTS.map((a) => a.username));

  // Menu recipes + items
  db.query("DELETE FROM menu_item_ingredients").run();
  db.query("DELETE FROM order_lines").run();
  db.query("DELETE FROM orders").run();
  db.query("DELETE FROM menu_items").run();

  // Products + movements
  db.query("DELETE FROM stock_movements").run();
  db.query("DELETE FROM products").run();
})();

// Accounts -----------------------------------------------------------
const passwordHash = await hashPassword(DEMO_PASSWORD);
for (const acc of ACCOUNTS) {
  db.query("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)")
    .run(acc.username, passwordHash, acc.role);
}

// Products + opening stock ------------------------------------------
const insertProduct = db.query(`
  INSERT INTO products (name, category, unit, location, supplier, unit_price, low_stock_threshold)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertOpening = db.query(`
  INSERT INTO stock_movements (product_id, delta, reason, note)
  VALUES (?, ?, 'opening', 'Demo seed opening stock')
`);
const productIdByName = new Map<string, number>();
db.transaction(() => {
  for (const p of PRODUCTS) {
    const res = insertProduct.run(
      p.name, p.category, p.unit, p.location, p.supplier, p.unit_price, p.low_stock_threshold,
    );
    const id = Number(res.lastInsertRowid);
    productIdByName.set(p.name, id);
    if (p.opening_qty > 0) insertOpening.run(id, p.opening_qty);
  }
})();

// Menu items + recipes ----------------------------------------------
const insertMenu = db.query(`
  INSERT INTO menu_items (name, description, category, price, available)
  VALUES (?, ?, ?, ?, ?)
`);
const insertIngredient = db.query(`
  INSERT INTO menu_item_ingredients (menu_item_id, product_id, quantity)
  VALUES (?, ?, ?)
`);
db.transaction(() => {
  for (const m of MENU) {
    const res = insertMenu.run(m.name, m.description, m.category, m.price, m.available === false ? 0 : 1);
    const menuId = Number(res.lastInsertRowid);
    for (const ing of m.ingredients) {
      const pid = productIdByName.get(ing.product);
      if (!pid) throw new Error(`Recipe references unknown product: ${ing.product}`);
      insertIngredient.run(menuId, pid, ing.quantity);
    }
  }
})();

const productCount = (db.query("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n;
const menuCount    = (db.query("SELECT COUNT(*) AS n FROM menu_items").get() as { n: number }).n;
const lowCount     = (db.query("SELECT COUNT(*) AS n FROM current_stock WHERE is_low = 1 AND low_stock_threshold > 0").get() as { n: number }).n;

console.log("========================================================");
console.log(" Pannzian demo seed complete");
console.log("--------------------------------------------------------");
console.log(` Accounts (password: ${DEMO_PASSWORD}):`);
for (const a of ACCOUNTS) console.log(`   ${a.username.padEnd(8)} — ${a.role}`);
console.log(` Products : ${productCount}   (${lowCount} below threshold)`);
console.log(` Menu     : ${menuCount} dishes across ${new Set(MENU.map((m) => m.category)).size} categories`);
console.log("========================================================");
