# ERP Estoque Node

Commercial inventory operations ERP built with Node.js, a REST API, a responsive dashboard and demo-safe automation flows.

This project is designed as a portfolio system for freelance proposals. It models a real business problem: small retailers lose margin when stockouts, excess inventory and supplier lead times are controlled manually.

## Business Value

The app helps an operations or purchasing manager:

- Detect SKUs at risk of stockout before supplier lead time expires.
- Prioritize replenishment by available stock, days of cover and reorder policy.
- Estimate the cash needed for purchase batches.
- Monitor inventory value, frozen cash, service level and critical SKUs.
- Review recent stock movements across sales, reservations, inbound and transfer operations.
- Simulate purchase workflows without sending real external messages.

## Features

- Node.js API without external dependencies.
- Dashboard with KPI cards, reorder board, purchase queue and movements table.
- Product filtering by search, category and risk level.
- Supplier lead-time and SLA enrichment.
- Reorder quantity calculation from stock, reservations, reorder point and target stock.
- Demo automation endpoint for purchase batch preparation.
- Seed data in `data/seed.json`.
- Automated business and smoke tests.
- Dockerfile for deploy-ready runtime.

## Stack

- Node.js 18+
- Native `http` server
- HTML, CSS and JavaScript
- JSON seed data
- `node:test`

## Run Locally

```bash
npm start
```

Open:

```text
http://localhost:3333
```

## Tests

```bash
npm test
npm run smoke
```

## API Documentation

See:

```text
docs/api-endpoints.md
```

Main endpoints:

- `GET /api/health`
- `GET /api/summary`
- `GET /api/products`
- `GET /api/movements`
- `GET /api/suppliers`
- `GET /api/purchase-suggestions`
- `POST /api/automations/run`

## Preview

Dashboard preview:

```text
docs/dashboard-preview.svg
```

## Docker

```bash
docker build -t erp-estoque-node .
docker run --rm -p 3333:3333 erp-estoque-node
```

## Possible Improvements

- Add PostgreSQL or SQLite persistence.
- Add authentication and role-based permissions.
- Add CSV import/export for product catalog updates.
- Add supplier email/webhook integration.
- Add PDF purchase order generation.
- Add multi-warehouse transfer rules.
