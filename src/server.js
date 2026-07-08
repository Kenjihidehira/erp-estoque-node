const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { InventoryStorage } = require("./storage");

const defaultDataFile = path.join(process.cwd(), "data", "inventory.json");
const defaultPublicDir = path.join(__dirname, "..", "public");
const movementTypes = ["entrada", "saida", "ajuste"];

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(payload));
}

function mime(filePath) {
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8"
  };
  return types[path.extname(filePath)] || "application/octet-stream";
}

async function parseBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        request.destroy();
        reject(new Error("Payload muito grande."));
      }
    });

    request.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("JSON inválido."));
      }
    });
  });
}

function validateProduct(input) {
  if (!input.sku || String(input.sku).trim().length < 3) return "SKU precisa ter pelo menos 3 caracteres.";
  if (!input.name || String(input.name).trim().length < 3) return "Nome precisa ter pelo menos 3 caracteres.";
  if (!input.category || String(input.category).trim().length < 3) return "Categoria precisa ter pelo menos 3 caracteres.";
  if (Number(input.cost) < 0) return "Custo inválido.";
  if (Number(input.price) <= 0) return "Preço precisa ser maior que zero.";
  if (Number(input.stock || 0) < 0) return "Estoque inicial não pode ser negativo.";
  if (Number(input.minStock || 0) < 0) return "Estoque mínimo não pode ser negativo.";
  return null;
}

function validateMovement(input) {
  if (!input.productId) return "Produto é obrigatório.";
  if (!movementTypes.includes(input.type)) return "Tipo de movimentação inválido.";
  if (!Number.isFinite(Number(input.quantity)) || Number(input.quantity) < 0) return "Quantidade inválida.";
  if (input.type !== "ajuste" && Number(input.quantity) <= 0) return "Quantidade precisa ser maior que zero.";
  return null;
}

function filterProducts(products, params) {
  const search = params.get("search")?.trim().toLowerCase();
  const category = params.get("category");
  const lowStock = params.get("lowStock") === "true";

  return products.filter((product) => {
    const text = `${product.sku} ${product.name} ${product.category}`.toLowerCase();
    return (!search || text.includes(search))
      && (!category || product.category === category)
      && (!lowStock || product.stock <= product.minStock);
  });
}

function enrichMovements(products, movements) {
  const map = new Map(products.map((product) => [product.id, product]));
  return movements.map((movement) => ({
    ...movement,
    product: map.get(movement.productId) || null
  }));
}

function stats(products, movements) {
  const inventoryValue = products.reduce((sum, product) => sum + product.stock * product.cost, 0);
  const potentialRevenue = products.reduce((sum, product) => sum + product.stock * product.price, 0);
  const lowStock = products.filter((product) => product.stock <= product.minStock).length;
  const sales = movements
    .filter((movement) => movement.type === "saida")
    .reduce((sum, movement) => sum + movement.quantity * movement.unitValue, 0);
  const entries = movements
    .filter((movement) => movement.type === "entrada")
    .reduce((sum, movement) => sum + movement.quantity, 0);

  return {
    totalProducts: products.length,
    totalStock: products.reduce((sum, product) => sum + product.stock, 0),
    inventoryValue,import http from "node:http";
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
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function serveStatic(req, res) {
  const requestUrl = new URL(req.url, "http://localhost");
  const routePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.resolve(publicDir, routePath.replace(/^\/+/, ""));

  if (!filePath.startsWith(publicDir)) {
    return json(res, { error: "Forbidden" }, 403);
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return json(res, { error: "Not found" }, 404);
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
        return json(res, { error: "Route not found" }, 404);
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
    console.log(`StockPilot ERP running at http://localhost:${port}`);
  });
}

    potentialRevenue,
    lowStock,
    sales,
    entries
  };
}

async function serveStatic(response, url, publicDir) {
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const safe = path.normalize(decodeURIComponent(requested)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, safe);

  if (!filePath.startsWith(publicDir)) {
    sendJson(response, 403, { error: "Acesso negado." });
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, { "Content-Type": mime(filePath) });
    response.end(content);
  } catch {
    sendJson(response, 404, { error: "Arquivo não encontrado." });
  }
}

function createServer(options = {}) {
  const storage = new InventoryStorage(options.dataFile || defaultDataFile);
  const publicDir = options.publicDir || defaultPublicDir;

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    try {
      if (url.pathname.startsWith("/api/")) {
        if (request.method === "GET" && url.pathname === "/api/health") {
          sendJson(response, 200, { status: "ok", service: "erp-estoque-node" });
          return;
        }

        if (request.method === "GET" && url.pathname === "/api/products") {
          const data = await storage.read();
          sendJson(response, 200, { data: filterProducts(data.products, url.searchParams) });
          return;
        }

        if (request.method === "GET" && url.pathname === "/api/movements") {
          const data = await storage.read();
          sendJson(response, 200, { data: enrichMovements(data.products, data.movements) });
          return;
        }

        if (request.method === "GET" && url.pathname === "/api/stats") {
          const data = await storage.read();
          sendJson(response, 200, { data: stats(data.products, data.movements) });
          return;
        }

        if (request.method === "POST" && url.pathname === "/api/products") {
          const input = await parseBody(request);
          const error = validateProduct(input);

          if (error) {
            sendJson(response, 422, { error });
            return;
          }

          const product = await storage.createProduct(input);
          sendJson(response, 201, { data: product });
          return;
        }

        if (request.method === "POST" && url.pathname === "/api/movements") {
          const input = await parseBody(request);
          const error = validateMovement(input);

          if (error) {
            sendJson(response, 422, { error });
            return;
          }

          const result = await storage.registerMovement(input);
          sendJson(response, 201, { data: result });
          return;
        }

        sendJson(response, 404, { error: "Rota não encontrada." });
        return;
      }

      await serveStatic(response, url, publicDir);
    } catch (error) {
      sendJson(response, error.status || 400, { error: error.message });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3333);
  createServer().listen(port, () => {
    console.log(`ERP Estoque rodando em http://localhost:${port}`);
  });
}

module.exports = { createServer, stats, filterProducts };
