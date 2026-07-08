import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { InventoryService, loadInventorySeed } from "../src/inventoryService.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const service = new InventoryService(loadInventorySeed(path.join(root, "data", "seed.json")));

test("summary calculates commercial inventory KPIs", () => {
  const summary = service.summary();
  assert.equal(summary.skuCount, 6);
  assert.ok(summary.stockValue > 0);
  assert.ok(summary.purchaseValue > 0);
  assert.ok(summary.serviceLevel >= 0 && summary.serviceLevel <= 100);
});

test("critical products create purchase suggestions with supplier data", () => {
  const suggestions = service.purchaseSuggestions();
  assert.ok(suggestions.length >= 3);
  assert.equal(suggestions[0].risk, "critical");
  assert.ok(suggestions[0].supplierName);
  assert.ok(suggestions[0].estimatedCost > 0);
});

test("filters combine category, risk and search", () => {
  const rows = service.products({ category: "Pet", risk: "critical", query: "racao" });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sku, "PET-8802");
});

test("automation batch limits purchase workflows", () => {
  const batch = service.automationBatch(2);
  assert.equal(batch.sent, 2);
  assert.equal(batch.items.length, 2);
  assert.ok(batch.totalCost > 0);
});
