import assert from "node:assert/strict";
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
