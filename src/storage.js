const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const seed = {
  products: [
    {
      id: "prd-1",
      sku: "NOTE-PRO-14",
      name: "Notebook Pro 14",
      category: "Informática",
      cost: 3200,
      price: 4890,
      minStock: 4,
      stock: 8,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "prd-2",
      sku: "HEAD-BT-90",
      name: "Headset Bluetooth 90",
      category: "Periféricos",
      cost: 120,
      price: 249.9,
      minStock: 12,
      stock: 10,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 7).toISOString()
    },
    {
      id: "prd-3",
      sku: "MON-27-ULTRA",
      name: "Monitor Ultra 27",
      category: "Monitores",
      cost: 890,
      price: 1399.9,
      minStock: 6,
      stock: 16,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
    }
  ],
  movements: [
    {
      id: "mov-1",
      productId: "prd-1",
      type: "entrada",
      quantity: 3,
      unitValue: 3200,
      reason: "Compra de reposição",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "mov-2",
      productId: "prd-2",
      type: "saida",
      quantity: 2,
      unitValue: 249.9,
      reason: "Venda balcão",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]
};

class InventoryStorage {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async ensureFile() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, JSON.stringify(seed, null, 2));
    }
  }

  async read() {
    await this.ensureFile();
    const content = await fs.readFile(this.filePath, "utf8");
    const data = JSON.parse(content);
    return {
      products: data.products || [],
      movements: data.movements || []
    };
  }

  async write(data) {
    await this.ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async createProduct(input) {
    const data = await this.read();
    const normalizedSku = input.sku.trim().toUpperCase();

    if (data.products.some((product) => product.sku === normalizedSku)) {
      const error = new Error("SKU já cadastrado.");
      error.status = 409;
      throw error;
    }

    const now = new Date().toISOString();
    const product = {
      id: crypto.randomUUID(),
      sku: normalizedSku,
      name: input.name.trim(),
      category: input.category.trim(),
      cost: Number(input.cost),
      price: Number(input.price),
      minStock: Number(input.minStock || 0),
      stock: Number(input.stock || 0),
      createdAt: now,
      updatedAt: now
    };

    data.products.unshift(product);

    if (product.stock > 0) {
      data.movements.unshift({
        id: crypto.randomUUID(),
        productId: product.id,
        type: "entrada",
        quantity: product.stock,
        unitValue: product.cost,
        reason: "Estoque inicial",
        createdAt: now
      });
    }

    await this.write(data);
    return product;
  }

  async registerMovement(input) {
    const data = await this.read();
    const product = data.products.find((item) => item.id === input.productId);

    if (!product) {
      const error = new Error("Produto não encontrado.");
      error.status = 404;
      throw error;
    }

    const quantity = Number(input.quantity);
    const type = input.type;

    if (type === "saida" && product.stock < quantity) {
      const error = new Error("Estoque insuficiente para saída.");
      error.status = 422;
      throw error;
    }

    if (type === "entrada") product.stock += quantity;
    if (type === "saida") product.stock -= quantity;
    if (type === "ajuste") product.stock = quantity;

    product.updatedAt = new Date().toISOString();

    const movement = {
      id: crypto.randomUUID(),
      productId: product.id,
      type,
      quantity,
      unitValue: Number(input.unitValue || (type === "saida" ? product.price : product.cost)),
      reason: input.reason?.trim() || "Movimentação manual",
      createdAt: new Date().toISOString()
    };

    data.movements.unshift(movement);
    await this.write(data);

    return { product, movement };
  }
}

module.exports = { InventoryStorage, seed };
