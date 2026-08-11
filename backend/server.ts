import { importExcel } from "./etl/pipeline";

const PORT = Number(process.env.PORT ?? 3001);

Bun.serve({
  port: PORT,
  routes: {
    "/api/upload": {
      POST: async (req) => {
        const form = await req.formData();
        const file = form.get("file");
        if (!(file instanceof File)) {
          return Response.json({ error: "no_file" }, { status: 400 });
        }
        try {
          const result = importExcel(await file.arrayBuffer());
          return Response.json(result);
        } catch (error) {
          const key = error instanceof Error ? error.message : "unknown_error";
          return Response.json({ error: key }, { status: 400 });
        }
      },
    },
  },
});

console.log(`Panziann ETL server on http://localhost:${PORT}`);
