import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { InventoryService, loadInventorySeed } from "./inventoryService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const seedPath = process.env.SEED_PATH || path.join(rootDir, "data", "seed.json");
const service = new InventoryService(loadInventorySeed(seedPath));

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function json(res, payload, status = 200) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Payload grande demais"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON inválido"));
      }
    });
  });
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url, "http://localhost");
  const routePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.resolve(publicDir, routePath.replace(/^\/+/, ""));

  if (!filePath.startsWith(publicDir)) {
    return json(res, { error: "Proibido" }, 403);
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return json(res, { error: "Não encontrado" }, 404);
  }

  res.writeHead(200, {
    "content-type": mimeTypes[path.extname(filePath)] || "application/octet-stream"
  });
  fs.createReadStream(filePath).pipe(res);
}

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url, "http://localhost");

      if (requestUrl.pathname === "/api/health") {
        return json(res, { ok: true, service: "erp-estoque-node", version: "2.0.0" });
      }

      if (requestUrl.pathname === "/api/summary") {
        return json(res, service.summary());
      }

      if (requestUrl.pathname === "/api/products") {
        return json(res, {
          categories: service.categories(),
          products: service.products({
            query: requestUrl.searchParams.get("query") || "",
            category: requestUrl.searchParams.get("category") || "all",
            risk: requestUrl.searchParams.get("risk") || "all"
          })
        });
      }

      if (requestUrl.pathname === "/api/movements") {
        return json(res, { movements: service.movements() });
      }

      if (requestUrl.pathname === "/api/suppliers") {
        return json(res, { suppliers: service.suppliers() });
      }

      if (requestUrl.pathname === "/api/purchase-suggestions") {
        return json(res, { suggestions: service.purchaseSuggestions() });
      }

      if (requestUrl.pathname === "/api/automations/run" && req.method === "POST") {
        const body = await readBody(req);
        return json(res, service.automationBatch(body.limit || 3));
      }

      if (requestUrl.pathname.startsWith("/api/")) {
        return json(res, { error: "Rota não encontrada" }, 404);
      }

      return serveStatic(req, res);
    } catch (error) {
      return json(res, { error: error.message }, 400);
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3333);
  createServer().listen(port, () => {
    console.log(`StockPilot ERP rodando em http://localhost:${port}`);
  });
}
