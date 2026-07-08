# API Endpoints

Base URL when running locally:

```text
http://localhost:3333
```

## Health

`GET /api/health`

Returns service status and version.

## Summary

`GET /api/summary`

Returns inventory KPIs:

- SKU count
- Inventory value at cost
- Service level
- Risk SKU count
- Critical SKU count
- Suggested purchase value
- Frozen cash in overstock
- Average days of cover

## Products

`GET /api/products`

Optional query parameters:

- `query`: SKU, product, category or supplier text
- `category`: product category
- `risk`: `critical`, `high`, `healthy` or `overstock`

## Movements

`GET /api/movements`

Returns recent stock movements enriched with product names.

## Suppliers

`GET /api/suppliers`

Returns supplier SLA and lead-time data.

## Purchase Suggestions

`GET /api/purchase-suggestions`

Returns products below reorder policy, ranked by stockout risk.

## Automation Simulation

`POST /api/automations/run`

Body:

```json
{
  "limit": 3
}
```

Returns a demo-safe purchase workflow batch for approval.
