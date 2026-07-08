const state = {
  query: "",
  category: "all",
  risk: "all",
  automationRuns: 0
};

const money = (value) => new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
}).format(value);

const label = (value) => value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const qs = (selector) => {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`Missing ${selector}`);
  return node;
};

async function api(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function renderSummary(summary) {
  qs("#stockValue").textContent = money(summary.stockValue);
  qs("#atRiskCount").textContent = String(summary.atRiskCount);
  qs("#criticalCount").textContent = `${summary.criticalCount} critical | ${summary.averageCoverDays} avg cover days`;
  qs("#serviceLevel").textContent = `${summary.serviceLevel}%`;
  qs("#purchaseValue").textContent = money(summary.purchaseValue);
  qs("#automationReadiness").textContent = `${summary.movementCount} movements analyzed`;
}

function renderCategoryOptions(categories) {
  const current = state.category;
  qs("#categoryFilter").innerHTML = [
    `<option value="all">All categories</option>`,
    ...categories.map((category) => `<option value="${category}">${category}</option>`)
  ].join("");
  qs("#categoryFilter").value = current;
}

function renderProducts(products) {
  qs("#productBoard").innerHTML = products.map((product) => `
    <article class="product-card ${product.risk}">
      <header>
        <span>${product.sku}</span>
        <b>${label(product.risk)}</b>
      </header>
      <strong>${product.name}</strong>
      <small>${product.category} | ${product.supplierName}</small>
      <div class="stock-bar">
        <i style="width:${Math.min(100, Math.round((product.available / product.targetStock) * 100))}%"></i>
      </div>
      <div class="product-metrics">
        <div><span>${product.available}</span><small>available</small></div>
        <div><span>${product.daysOfCover}</span><small>days cover</small></div>
        <div><span>${product.reorderQty}</span><small>reorder qty</small></div>
      </div>
      <footer>
        <span>${money(product.stockValue)}</span>
        <small>${product.marginPercent}% margin</small>
      </footer>
    </article>
  `).join("");
}

function renderPurchases(suggestions) {
  qs("#purchaseQueue").innerHTML = suggestions.map((item) => `
    <article class="queue-item ${item.risk}">
      <header>
        <span>${item.sku}</span>
        <b>${label(item.risk)}</b>
      </header>
      <strong>${item.productName}</strong>
      <small>${item.supplierName} | ${item.leadTimeDays} day lead time</small>
      <div class="queue-metrics">
        <span>${item.available} available</span>
        <span>${item.daysOfCover} days</span>
      </div>
      <footer>
        <strong>${item.suggestedQty} units</strong>
        <span>${money(item.estimatedCost)}</span>
      </footer>
    </article>
  `).join("");
}

function renderMovements(movements) {
  qs("#movementBody").innerHTML = movements.map((movement) => `
    <tr>
      <td>${movement.id}</td>
      <td><strong>${movement.productName}</strong><small>${movement.sku}</small></td>
      <td><span class="movement ${movement.type}">${label(movement.type)}</span></td>
      <td>${movement.quantity}</td>
      <td>${movement.date}</td>
      <td>${movement.channel}</td>
    </tr>
  `).join("");
}

async function loadDashboard() {
  const params = new URLSearchParams({
    query: state.query,
    category: state.category,
    risk: state.risk
  });
  const [summary, products, purchases, movements] = await Promise.all([
    api("/api/summary"),
    api(`/api/products?${params}`),
    api("/api/purchase-suggestions"),
    api("/api/movements")
  ]);

  renderSummary(summary);
  renderCategoryOptions(products.categories);
  renderProducts(products.products);
  renderPurchases(purchases.suggestions);
  renderMovements(movements.movements);
}

async function runAutomation() {
  const result = await api("/api/automations/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 3 })
  });
  state.automationRuns += result.sent;
  qs("#automationLog").textContent = `${result.sent} purchase workflows | ${money(result.totalCost)} | ${state.automationRuns} this session`;
}

function bindEvents() {
  qs("#refreshBtn").addEventListener("click", loadDashboard);
  qs("#runAutomationBtn").addEventListener("click", runAutomation);
  qs("#searchInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    loadDashboard();
  });
  qs("#categoryFilter").addEventListener("change", (event) => {
    state.category = event.target.value;
    loadDashboard();
  });
  qs("#riskFilter").addEventListener("change", (event) => {
    state.risk = event.target.value;
    loadDashboard();
  });
}

bindEvents();
loadDashboard().catch((error) => {
  qs("#automationLog").textContent = error.message;
});
