# ERP Estoque Node

ERP comercial de operações de estoque construído com Node.js, API REST, painel responsivo e fluxos de automação seguros para demonstração.

Este projeto foi desenhado como sistema de portfólio para propostas freelance. Ele modela um problema real de negócio: pequenos varejistas perdem margem quando ruptura, excesso de estoque e prazo de fornecedores são controlados manualmente.

## Valor Comercial

O app ajuda um gerente de operações ou compras a:

- Detectar SKUs com risco de ruptura antes do prazo de reposição do fornecedor.
- Priorizar reposição por estoque disponível, dias de cobertura e política de compra.
- Estimar caixa necessário para lotes de compra.
- Monitorar valor em estoque, caixa parado, nível de serviço e SKUs críticos.
- Revisar movimentações recentes de vendas, reservas, entradas e transferências.
- Simular fluxos de compra sem enviar mensagens externas reais.

## Funcionalidades

- API Node.js sem dependências externas.
- Painel com KPIs, quadro de reposição, fila de compras e tabela de movimentações.
- Filtro de produtos por busca, categoria e nível de risco.
- Enriquecimento por prazo e SLA de fornecedor.
- Cálculo de quantidade de reposição com base em estoque, reservas, ponto de pedido e estoque alvo.
- Endpoint de automação demo para preparação de lote de compras.
- Dados de exemplo em `data/seed.json`.
- Testes automatizados de regras de negócio e smoke.
- Dockerfile pronto para publicação.

## Stack

- Node.js 18+
- Servidor `http` nativo
- HTML, CSS e JavaScript
- Dados de exemplo em JSON
- `node:test`

## Como Rodar Localmente

```bash
npm start
```

Acesse:

```text
http://localhost:3333
```

## Testes

```bash
npm test
npm run smoke
```

## Documentação da API

Veja:

```text
docs/api-endpoints.md
```

Principais endpoints:

- `GET /api/health`
- `GET /api/summary`
- `GET /api/products`
- `GET /api/movements`
- `GET /api/suppliers`
- `GET /api/purchase-suggestions`
- `POST /api/automations/run`

## Prévia

Prévia do painel:

```text
docs/dashboard-preview.svg
```

## Docker

```bash
docker build -t erp-estoque-node .
docker run --rm -p 3333:3333 erp-estoque-node
```

## Melhorias Possíveis

- Adicionar persistência em PostgreSQL ou SQLite.
- Adicionar autenticação e permissões por perfil.
- Importar/exportar catálogo de produtos via CSV.
- Integrar email/webhook de fornecedores.
- Gerar pedido de compra em PDF.
- Adicionar regras multiestoque para transferência entre depósitos.
