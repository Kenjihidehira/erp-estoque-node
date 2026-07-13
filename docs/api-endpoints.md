# Endpoints da API

URL base ao rodar localmente:

```text
http://localhost:3333
```

## Saúde

`GET /api/health`

Retorna status do serviço e versão.

## Resumo

`GET /api/summary`

Retorna KPIs de estoque:

- quantidade de SKUs
- valor do estoque a custo
- nível de serviço
- quantidade de SKUs em risco
- quantidade de SKUs críticos
- valor sugerido de compra
- caixa parado em excesso de estoque
- média de dias de cobertura

## Produtos

`GET /api/products`

Parâmetros opcionais:

- `query`: texto de SKU, produto, categoria ou fornecedor
- `category`: categoria do produto
- `risk`: `critical`, `high`, `healthy` ou `overstock`

## Movimentações

`GET /api/movements`

Retorna movimentações recentes enriquecidas com nomes de produtos.

## Fornecedores

`GET /api/suppliers`

Retorna dados de SLA e prazo dos fornecedores.

## Sugestões de Compra

`GET /api/purchase-suggestions`

Retorna produtos abaixo da política de reposição, ordenados por risco de ruptura.

## Simulação de Automação

`POST /api/automations/run`

Body:

```json
{
  "limit": 3
}
```

Retorna um lote de fluxo de compra seguro para demonstração e pronto para aprovação.
