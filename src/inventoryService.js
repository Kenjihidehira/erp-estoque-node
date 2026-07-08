import fs from "node:fs";

export function loadInventorySeed(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export class InventoryService {
  constructor(seed) {
    this.seed = seed;
  }

  suppliers() {
    return this.seed.suppliers;
  }

  products(filters = {}) {
    const query = String(filters.query || "").trim().toLowerCase();
    const category = filters.category || "all";
    const risk = filters.risk || "all";

    return this.enrichedProducts().filter((product) => {
      if (category !== "all" && product.category !== category) return false;
      if (risk !== "all" && product.risk !== risk) return false;
      if (!query) return true;
      return `${product.sku} ${product.name} ${product.category} ${product.supplierName}`.toLowerCase().includes(query);
    });
  }

  movements() {
    const products = this.indexBy(this.seed.products, "sku");
    return this.seed.movements.map((movement) => ({
      ...movement,
      productName: products[movement.sku]?.name || movement.sku
    }));
  }

  summary() {
    const products = this.enrichedProducts();
    const stockValue = products.reduce((sum, product) => sum + product.stockValue, 0);
    const purchasePlan = this.purchaseSuggestions();
    const atRisk = products.filter((product) => product.risk === "critical" || product.risk === "high");
    const overstock = products.filter((product) => product.risk === "overstock");
    const serviceLevel = Math.round((products.filter((product) => product.available > product.reorderPoint).length / products.length) * 100);

    return {
      company: this.seed.company,
      skuCount: products.length,
      stockValue,
      serviceLevel,
      atRiskCount: atRisk.length,
      criticalCount: products.filter((product) => product.risk === "critical").length,
      purchaseValue: purchasePlan.reduce((sum, item) => sum + item.estimatedCost, 0),
      frozenCash: overstock.reduce((sum, item) => sum + Math.max(0, item.available - item.targetStock) * item.unitCost, 0),
      averageCoverDays: Math.round(products.reduce((sum, product) => sum + product.daysOfCover, 0) / products.length),
      movementCount: this.seed.movements.length
    };
  }

  purchaseSuggestions() {
    return this.enrichedProducts()
      .filter((product) => product.reorderQty > 0)
      .sort((a, b) => this.riskWeight(b.risk) - this.riskWeight(a.risk))
      .map((product) => ({
        sku: product.sku,
        productName: product.name,
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        leadTimeDays: product.leadTimeDays,
        risk: product.risk,
        available: product.available,
        daysOfCover: product.daysOfCover,
        suggestedQty: product.reorderQty,
        estimatedCost: product.reorderQty * product.unitCost,
        reason: product.risk === "critical"
          ? "Projected stockout before supplier lead time"
          : "Below reorder policy"
      }));
  }

  automationBatch(limit = 3) {
    const suggestions = this.purchaseSuggestions().slice(0, Math.max(1, Math.min(Number(limit) || 3, 6)));
    return {
      sent: suggestions.length,
      totalCost: suggestions.reduce((sum, item) => sum + item.estimatedCost, 0),
      message: `${suggestions.length} purchase workflows prepared for approval.`,
      items: suggestions
    };
  }

  categories() {
    return [...new Set(this.seed.products.map((product) => product.category))].sort();
  }

  enrichedProducts() {
    const suppliers = this.indexBy(this.seed.suppliers, "id");
    return this.seed.products.map((product) => {
      const supplier = suppliers[product.supplierId] || {};
      const available = Math.max(0, product.stock - product.reserved);
      const daysOfCover = Math.round(available / Math.max(product.avgDailySales, 1));
      const reorderQty = available <= product.reorderPoint ? Math.max(0, product.targetStock - available) : 0;
      const risk = this.classifyRisk(product, available, daysOfCover, supplier.leadTimeDays || 7);
      const marginPercent = Math.round(((product.price - product.unitCost) / product.price) * 100);

      return {
        ...product,
        supplierName: supplier.name || "Unknown supplier",
        leadTimeDays: supplier.leadTimeDays || 7,
        supplierSla: supplier.sla || 0,
        available,
        daysOfCover,
        reorderQty,
        risk,
        stockValue: product.stock * product.unitCost,
        marginPercent
      };
    });
  }

  classifyRisk(product, available, daysOfCover, leadTimeDays) {
    if (available <= product.avgDailySales * Math.max(2, leadTimeDays - 2)) return "critical";
    if (available <= product.reorderPoint) return "high";
    if (available > product.targetStock * 1.25) return "overstock";
    return "healthy";
  }

  riskWeight(risk) {
    return { critical: 4, high: 3, healthy: 2, overstock: 1 }[risk] || 0;
  }

  indexBy(rows, key) {
    return Object.fromEntries(rows.map((row) => [row[key], row]));
  }
}
