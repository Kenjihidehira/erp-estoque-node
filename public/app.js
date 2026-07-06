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

  productsTable.innerHTML = products
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
