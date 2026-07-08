const productForm = document.querySelector("#productForm");
const movementForm = document.querySelector("#movementForm");
const movementProduct = document.querySelector("#movementProduct");
const statsEl = document.querySelector("#stats");
const productsTable = document.querySelector("#productsTable");
const movementsEl = document.querySelector("#movements");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const lowStockOnly = document.querySelector("#lowStockOnly");

let products = [];
let movements = [];

function currency(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function date(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const payload = await response.json();

  if (!response.ok) throw new Error(payload.error || "Erro inesperado.");

  return payload.data;
}

function getProductQuery() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (categoryFilter.value) params.set("category", categoryFilter.value);
  if (lowStockOnly.checked) params.set("lowStock", "true");
  return params.toString();
}

async function load() {
  const query = getProductQuery();
  const [productData, movementData, statsData] = await Promise.all([
    api(`/api/products${query ? `?${query}` : ""}`),
    api("/api/movements"),
    api("/api/stats")
  ]);

  products = productData;
  movements = movementData;
  renderStats(statsData);
  renderProducts();
  renderMovements();
  renderProductOptions();
  renderCategoryOptions();
}

function renderStats(data) {
  const cards = [
    ["Produtos", data.totalProducts],
    ["Unidades", data.totalStock],
    ["Valor em estoque", currency(data.inventoryValue)],
    ["Baixo estoque", data.lowStock]
  ];

  statsEl.innerHTML = cards
    .map(([label, value]) => `
      <article class="stat">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>
    `)
    .join("");
}

function renderProducts() {
  if (products.length === 0) {
    productsTable.innerHTML = "<tr><td colspan='7'>Nenhum produto encontrado.</td></tr>";
    return;
  }

  productsTable.innerHTML = productsconst state = {
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

    .map((product) => {
      const low = product.stock <= product.minStock;
      const status = low ? "Baixo estoque" : "Saudável";
      return `
        <tr>
          <td>${product.sku}</td>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.stock} / mín. ${product.minStock}</td>
          <td>${currency(product.cost)}</td>
          <td>${currency(product.price)}</td>
          <td><span class="pill ${low ? "low" : ""}">${status}</span></td>
        </tr>
      `;
    })
    .join("");
}

function renderMovements() {
  movementsEl.innerHTML = movements.slice(0, 8)
    .map((movement) => `
      <article class="movement">
        <div>
          <strong>${movement.type.toUpperCase()} • ${movement.product?.name || "Produto removido"}</strong>
          <p>${movement.reason} • ${date(movement.createdAt)}</p>
        </div>
        <span class="pill ${movement.type === "saida" ? "warn" : ""}">${movement.quantity} un.</span>
      </article>
    `)
    .join("");
}

function renderProductOptions() {
  const allProducts = movements
    .map((movement) => movement.product)
    .filter(Boolean)
    .reduce((map, product) => map.set(product.id, product), new Map());

  products.forEach((product) => allProducts.set(product.id, product));

  movementProduct.innerHTML = [...allProducts.values()]
    .map((product) => `<option value="${product.id}">${product.sku} — ${product.name}</option>`)
    .join("");
}

function renderCategoryOptions() {
  const current = categoryFilter.value;
  const categories = [...new Set(products.map((product) => product.category))].sort();
  categoryFilter.innerHTML = "<option value=''>Todas categorias</option>"
    + categories.map((category) => `<option value="${category}">${category}</option>`).join("");
  categoryFilter.value = current;
}

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(productForm).entries());

  try {
    await api("/api/products", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    productForm.reset();
    await load();
  } catch (error) {
    alert(error.message);
  }
});

movementForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(movementForm).entries());

  try {
    await api("/api/movements", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    movementForm.reset();
    await load();
  } catch (error) {
    alert(error.message);
  }
});

[searchInput, categoryFilter, lowStockOnly].forEach((field) => {
  field.addEventListener("input", load);
});

load();
