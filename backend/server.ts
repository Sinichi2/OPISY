import { importExcel } from "./etl/pipeline";
import { getDb } from "./db";
import { bootstrapSuperAdmin, guard, jsonError } from "./auth";
import { login, logout, me, changePassword, mfaEnroll, mfaConfirm } from "./handlers/auth";
import { listUsers, createUser, deleteUser, resetPassword } from "./handlers/users";
import { uploadImage, serveUpload } from "./handlers/images";
import {
  listProducts, createProduct, updateProduct, deleteProduct,
  listMovements, createMovement, listWasteReasons,
} from "./handlers/products";
import {
  listPublicMenu, listMenuAll, createMenuItem, updateMenuItem,
  deleteMenuItem, setRecipe, toggleAvailability,
} from "./handlers/menu";
import {
  placeOrder, listOrders, claimNext, claim, release,
  updateStatus, setPriority, queuePositionByToken, myOrder,
} from "./handlers/orders";
import { wasteAnalytics, salesAnalytics, lowStockAnalytics } from "./handlers/analytics";

const PORT = Number(process.env.PORT ?? 3001);

await bootstrapSuperAdmin(getDb());

Bun.serve({
  port: PORT,
  routes: {
    "/api/auth/login":            { POST: login },
    "/api/auth/logout":           { POST: logout },
    "/api/auth/me":               { GET:  me },
    "/api/auth/change-password":  { POST: changePassword },
    "/api/auth/mfa/enroll":       { POST: mfaEnroll },
    "/api/auth/mfa/confirm":      { POST: mfaConfirm },

    "/api/users":                       { GET: listUsers, POST: createUser },
    "/api/users/:id":                   { DELETE: deleteUser },
    "/api/users/:id/reset-password":    { POST: resetPassword },

    "/api/images":                      { POST: uploadImage },
    "/uploads/*":                       { GET: serveUpload },

    "/api/products":                    { GET: listProducts, POST: createProduct },
    "/api/products/:id":                { PATCH: updateProduct, DELETE: deleteProduct },
    "/api/stock/movements":             { GET: listMovements, POST: createMovement },
    "/api/waste-reasons":               { GET: listWasteReasons },

    "/api/menu":                        { GET: listPublicMenu, POST: createMenuItem },
    "/api/menu/all":                    { GET: listMenuAll },
    "/api/menu/:id":                    { PATCH: updateMenuItem, DELETE: deleteMenuItem },
    "/api/menu/:id/recipe":             { PUT: setRecipe },
    "/api/menu/:id/availability":       { POST: toggleAvailability },

    "/api/orders":                      { GET: listOrders, POST: placeOrder },
    "/api/orders/claim-next":           { POST: claimNext },
    "/api/orders/mine":                 { GET: myOrder },
    "/api/orders/queue-position":       { GET: queuePositionByToken },
    "/api/orders/:id/claim":            { POST: claim },
    "/api/orders/:id/release":          { POST: release },
    "/api/orders/:id/status":           { PATCH: updateStatus },
    "/api/orders/:id/priority":         { POST: setPriority },

    "/api/analytics/waste":             { GET: wasteAnalytics },
    "/api/analytics/sales":             { GET: salesAnalytics },
    "/api/analytics/low-stock":         { GET: lowStockAnalytics },

    "/api/upload": {
      POST: guard("staff", async (req) => {
        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof File)) return jsonError(400, "no_file");
        try {
          const result = importExcel(await file.arrayBuffer());
          return Response.json(result);
        } catch (error) {
          const key = error instanceof Error ? error.message : "unknown_error";
          return jsonError(400, key);
        }
      }),
    },
  },
});

console.log(`Panziann server on http://localhost:${PORT}`);
