# ERP Estoque Node

Mini ERP full-stack para controle de estoque, feito com Node.js puro, HTML, CSS e JavaScript.

## Funcionalidades

- API REST sem frameworks externos
- Dashboard web responsivo
- Cadastro de produtos com SKU único
- Registro de entrada, saída e ajuste de estoque
- Bloqueio de saída com estoque insuficiente
- Filtros por busca, categoria e baixo estoque
- Indicadores de estoque, unidades e valor parado
- Histórico de movimentações
- Persistência em arquivo JSON
- Testes automatizados com `node:test`

## Como rodar

```bash
npm start
```

Acesse:

```txt
http://localhost:3333
```

## Testes

```bash
npm test
```

## Rotas

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/health` | Status da API |
| GET | `/api/products` | Lista produtos |
| GET | `/api/products?lowStock=true` | Lista produtos em baixo estoque |
| GET | `/api/movements` | Lista movimentações |
| GET | `/api/stats` | Indicadores |
| POST | `/api/products` | Cadastra produto |
| POST | `/api/movements` | Registra movimentação |

## Tecnologias

- Node.js
- JavaScript
- HTML
- CSS
- JSON como banco local
- Node Test Runner
