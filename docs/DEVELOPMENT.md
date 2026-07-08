# Development & Build

本文件是 BigGo 購物幫手的**深入建置與設定參考**。快速上手（安裝、開發建置、載入未封裝擴充功能）請先看 [`CONTRIBUTING.md`](../CONTRIBUTING.md)；架構高層說明見 [`README.md`](../README.md) 的〈運作原理〉；各子系統的流程細節見同目錄下的 [`workflow-*.md`](./)。

## 需求

- Node.js >= 18
- pnpm >= 8（建議）或 npm >= 8

本 repo 附 `pnpm-lock.yaml`，可重現安裝：

```bash
pnpm install     # 建議；npm install 亦可，會從 package.json 解析
```

## 建置

### 正式版

```bash
npm run build          # Chromium (MV3)
npm run build:v2       # Firefox (MV2)
npm run build:safari   # Safari (MV2)
```

### 開發版

```bash
npm run build:dev      # 開發版單次建置
npm run watch          # Vite watch 模式（MV3）
```

建置輸出在 `./dist`，可直接以「未封裝擴充功能」載入瀏覽器測試（載入步驟見 [`CONTRIBUTING.md`](../CONTRIBUTING.md)）。

### 打包

```bash
npm run bundle         # 將 dist/ 壓成 zip
npm run bundle:all     # 建置所有變體並各自壓成 zip
```

## 設定

### 環境變數

本 repo 附 [`.env.example`](../.env.example)，複製成 `.env` 後填入自己的值即可（`.env` 已被 git 忽略，切勿 commit 真實金鑰）：

```bash
cp .env.example .env
```

建置會讀取下列環境變數：

| 變數 | 由誰設定 | 用途 |
| --- | --- | --- |
| `NODE_ENV` | npm scripts | `production` 或 `development`，控制壓縮與 dev-only 行為。 |
| `MANIFEST_VERSION` | npm scripts | `2` 或 `3`，選擇 manifest 變體（Firefox/Safari 用 MV2，Chromium 用 MV3）。 |
| `BROWSER` | npm scripts | `chrome`、`safari` 或空值，套用瀏覽器專屬的 manifest 微調。 |
| `GA_API_SECRET` | **你**（選填） | Google Analytics Measurement Protocol API secret。未設定時分析功能**停用**。 |
| `GA_MEASUREMENT_ID` | **你**（選填） | Google Analytics measurement ID（`G-XXXXXXXXXX`）。未設定時分析功能**停用**。 |

`NODE_ENV`、`MANIFEST_VERSION`、`BROWSER` 由 `npm run build*` 腳本自動設定，一般不需手動指定。

`GA_API_SECRET` / `GA_MEASUREMENT_ID` 是唯二需要你自行提供的變數，且只在你想啟用分析時才需要。任一缺少時，擴充功能會略過所有分析呼叫——因此單純 `npm run build` 就會產出一個遙測關閉、功能完整的擴充功能：

```bash
GA_API_SECRET=xxxxxxxx GA_MEASUREMENT_ID=G-XXXXXXXXXX npm run build
```

正式部署時，請透過 CI/CD 的機密儲存注入這些值，**不要** commit 進版本庫。

### 後端 host

API host（`extension.biggo.com`）與帳號 host（`account.biggo.com`）寫死在 `vite.config.ts` 與 `util/vite-build.js` 的 `define` 區塊。要指向你自己的後端，請改這兩個檔案。

## 維護 sites.json

`biggo/js/sites.json` 是打包進擴充功能的靜態 fallback 資料集（僅 domain 欄位）。執行時擴充功能優先使用 API 的即時清單，取不到才退回此檔。更新方式：

```bash
npm run update:sites   # 從 API 抓取最新站台資料並寫入 sites.json
npm run clean:sites    # 將 sites.json 精簡為僅保留 domain 欄位
```

## 專案結構

```
biggo/
├── _locales/          # i18n 翻譯
├── js/
│   ├── background.bundle.js   # Background script 進入點
│   ├── content.bundle.js      # Content script 進入點
│   ├── frontend.bundle.js     # Svelte app 進入點
│   ├── core/shared/           # 跨環境共用邏輯
│   ├── libs/                  # Background 模組（sync、cashback、icon）
│   ├── content/               # Content script 模組（iframe 注入、搜尋整合）
│   ├── prototype/             # Bridge 訊息傳遞架構
│   ├── frontend/svelte/       # Svelte 5 元件
│   └── sites.json             # 靜態 fallback 站台資料
├── pages/                     # 擴充功能頁面（popup、options、privacy）
├── manifest.base.json         # 共用 manifest
├── manifest.v3.json           # 僅 Chrome MV3
├── manifest.v2.json           # 僅 Firefox/Safari MV2
├── manifest.safari.json       # Safari 專屬覆寫
└── manifest.biggo.json        # BigGo 站台清單（建置時合併進來）
util/
├── build.js                   # 主建置腳本（複製資產 → Vite → 合併 manifest）
├── vite-build.js              # Vite programmatic API（12 個 IIFE bundle）
├── bundle.js                  # 壓縮 dist/
├── clean-sites.js             # 精簡 sites.json
└── update-sites.js            # 更新 sites.json
native/
└── safari/                    # 將擴充功能包成 Safari app 的 Xcode 專案
```

## 技術棧

- **建置**：Vite 6 + Svelte 5 compiler
- **UI**：Svelte 5
- **執行環境**：ES modules、async/await
- **唯一執行期相依套件**：`uuid`

擴充功能有三個透過瀏覽器訊息傳遞彼此溝通的執行環境：**background script**（MV3 為 service worker、MV2 為常駐頁面）、注入頁面的 **content scripts**、以及由 content script 動態注入的 **Svelte frontend**。
