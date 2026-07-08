const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { afterEach, beforeEach, test } = require("node:test");
const { createServer } = require("../src/server");

let server;
let baseUrl;
let tempDir;

function listen(app) {
  return new Promise((resolve) => {
    app.listen(0, () => {
      resolve(`http://127.0.0.1:${app.address().port}`);
    });
  });
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  return { status: response.status, data: await response.json() };
}

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "erp-estoque-"));
  server = createServer({
    dataFile: path.join(tempDir, "inventory.json"),
    publicDir: path.join(__dirname, "..", "public")
  });
  baseUrl = await listen(server);
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(tempDir, { recursive: true, force: true });
});

test("health check funciona", async () => {
  const response = await request("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.data.status, "ok");
});

test("cria produto e bloqueia SKU duplicado", async () => {
  const payload = {
    sku: "cam-pro-01",
    name: "Câmera Pro",
    category: "Segurança",
    cost: 200,
    price: 399.9,
    minStock: 3,
    stock: 5import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "../src/server.js";

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

test("health and summary endpoints respond", async () => {
  const server = createServer();
  const baseUrl = await listen(server);

  try {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).ok, true);

    const summary = await fetch(`${baseUrl}/api/summary`);
    const payload = await summary.json();
    assert.equal(summary.status, 200);
    assert.ok(payload.stockValue > 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("product endpoint supports operational filters", async () => {
  const server = createServer();
  const baseUrl = await listen(server);

  try {
    const response = await fetch(`${baseUrl}/api/products?category=Pet&risk=critical&query=racao`);
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.products.length, 1);
    assert.equal(payload.products[0].sku, "PET-8802");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("automation endpoint creates purchase batch", async () => {
  const server = createServer();
  const baseUrl = await listen(server);

  try {
    const response = await fetch(`${baseUrl}/api/automations/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 2 })
    });
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.sent, 2);
    assert.ok(payload.totalCost > 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

  };

  const created = await request("/api/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  assert.equal(created.status, 201);
  assert.equal(created.data.data.sku, "CAM-PRO-01");

  const duplicate = await request("/api/products", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  assert.equal(duplicate.status, 409);
});

test("registra saída e impede estoque negativo", async () => {
  const products = await request("/api/products");
  const product = products.data.data[0];

  const movement = await request("/api/movements", {
    method: "POST",
    body: JSON.stringify({
      productId: product.id,
      type: "saida",
      quantity: 1,
      reason: "Venda teste"
    })
  });

  assert.equal(movement.status, 201);
  assert.equal(movement.data.data.product.stock, product.stock - 1);

  const invalid = await request("/api/movements", {
    method: "POST",
    body: JSON.stringify({
      productId: product.id,
      type: "saida",
      quantity: 9999
    })
  });

  assert.equal(invalid.status, 422);
});

test("gera estatísticas e filtra baixo estoque", async () => {
  const stats = await request("/api/stats");
  assert.equal(stats.status, 200);
  assert.ok(stats.data.data.totalProducts >= 3);
  assert.ok(stats.data.data.inventoryValue > 0);

  const lowStock = await request("/api/products?lowStock=true");
  assert.equal(lowStock.status, 200);
  assert.ok(lowStock.data.data.some((product) => product.stock <= product.minStock));
});
