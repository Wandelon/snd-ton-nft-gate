# TON NFT Factory + Access Gate (testnet)

Монорепо:

- `contracts/` — смарт‑контракты (Tact) + скрипты деплоя (Blueprint).
- `frontend/` — React UI (Vite) + TonConnect + access gate (2 jetton + NFT).

## Требования на машине

- Node.js LTS (рекомендую 20+)
- npm (ставится вместе с Node)

Если `npm` не находится в PATH — переустановите Node с галкой “Add to PATH”.

## Быстрый старт

### 1) Контракты

```bash
cd contracts
npm install
```

Скопируйте `contracts/.env.example` в `contracts/.env` и заполните.

Деплой в testnet:

```bash
npm run build
npm run deploy:testnet
```

### 2) Фронтенд

```bash
cd frontend
npm install
```

Скопируйте `frontend/.env.example` в `frontend/.env` и заполните адреса.

Локально:

```bash
npm run dev
```

Сборка:

```bash
npm run build
```

## GitHub Pages

Workflow лежит в `.github/workflows/pages.yml`.

Нужно включить Pages в репозитории: Settings → Pages → Source = GitHub Actions.

Pages URL: `https://wandelon.github.io/snd-ton-nft-gate/`

