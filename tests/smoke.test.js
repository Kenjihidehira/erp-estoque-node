import assert from "node:assert/strict";
import { createServer } from "../src/server.js";

const server = createServer();

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

try {
  const health = await fetch(`${baseUrl}/api/health`).then((res) => res.json());
  assert.equal(health.ok, true);

  const summary = await fetch(`${baseUrl}/api/summary`).then((res) => res.json());
  assert.ok(summary.purchaseValue > 0);

  const products = await fetch(`${baseUrl}/api/products?risk=critical`).then((res) => res.json());
  assert.ok(products.products.length > 0);

  const automation = await fetch(`${baseUrl}/api/automations/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 2 })
  }).then((res) => res.json());
  assert.equal(automation.sent, 2);

  const html = await fetch(baseUrl).then((res) => res.text());
  assert.match(html, /StockPilot ERP/);

  console.log("Smoke test OK: StockPilot ERP API and dashboard respond correctly.");
} finally {
  await new Promise((resolve) => server.close(resolve));
}
