# 貢獻指南

> 繁體中文 | [English](./CONTRIBUTING.en.md)

感謝你有興趣參與貢獻！本文件說明如何設定專案、我們的程式碼慣例，以及如何讓你的變更被合併。

> **Repository 模型。** 這個 GitHub repository 是上游、是 source of truth。Funmula 內部的
> 建置版本以下游 fork 維護；內部專屬設定（分析金鑰、私有 endpoint）**不包含**在本開源
> repository 中。貢獻一律採 upstream-first（先進上游）。

## 開始開發

需求：

- Node.js >= 18
- pnpm >= 8（建議）或 npm >= 8

```bash
pnpm install       # 安裝相依套件（附 pnpm-lock.yaml，可重現安裝；npm install 亦可）
npm run build:dev  # 開發版建置 → ./dist
npm run watch      # Vite watch 模式（Chromium MV3）
```

在瀏覽器載入未封裝的 `./dist` 目錄：

- **Chrome/Edge**：`chrome://extensions` → 開啟 *開發人員模式* → *載入未封裝項目* → 選 `dist/`
- **Firefox**：先執行 `npm run build:v2`，再到 `about:debugging` → *This Firefox* → *Load Temporary Add-on* → 選 `dist/manifest.json`

正式版建置：

```bash
npm run build          # Chromium (MV3)
npm run build:v2       # Firefox (MV2)
npm run build:safari   # Safari (MV2)
```

架構細節見 [`README.md`](./README.md) 的〈運作原理〉；建置變體、環境變數、後端 host 與專案結構等開發參考見 [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)，各子系統的流程文件見 [`docs/`](./docs/)。

## 程式碼風格與命名

本專案是 **ESM JavaScript**（`"type": "module"`），**尚未設定 ESLint / Prettier**，因此以下
慣例請**手動遵循**，並以「與周邊程式碼保持一致」為最高原則。

**格式**

- 縮排用 **2 個空格**，不用 tab。
- 字串用**雙引號** `"..."`。
- **行尾不加分號**（依賴 ASI）。
- import 使用 ESM 具名匯入，大括號內不加空白：`import {foo, bar} from "./mod"`。
- 變數宣告優先用 `const`，需要重新指派才用 `let`；避免新增 `var`。

**命名**

- 一般變數與函式：`camelCase`（例如 `getSitesLang`、`domCashbackBtn`）。
- 模組層級常數：`UPPER_SNAKE_CASE`（例如 `ELEMENT_ID`、`DESTROY_TIME`）。
- 類別與 Svelte 元件：`PascalCase`（例如 `Dialog`）。
- 慣用前綴：布林值用 `is*`（`isLogin`、`isCashbackActive`）；DOM 節點變數用 `dom*`（`domClose`）。
- 檔名：分層／進入點檔用點分命名（`content.listener.js`、`background.bundle.js`），一般模組用
  `camelCase`（`storeDescPopup.js`）。

**其他**

- 所有面向使用者的文字都要走 `i18n()`，**不要寫死字串**——這是多語系支援的基礎。
- 站台一律以 **nindex**（`{region}_{type}_{name}`）識別。

## 開發注意事項

- **分析／機密。** 開源版建置必須能在沒有任何私有憑證的情況下運作。分析金鑰於建置時
  由環境變數注入，未設定時預設為 no-op——請**勿**在程式碼寫死任何真實金鑰。
- **三個執行環境。** Background、content script 與 Svelte frontend 透過 Bridge 訊息傳遞層
  溝通。動到跨環境程式碼前，請先讀
  [`docs/workflow-content-message.md`](./docs/workflow-content-message.md)。
- **目前尚未設定測試框架。** 請在 PR 中描述你的手動測試步驟（哪些站台、哪些瀏覽器）。

## Commit 訊息

我們採用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>: <簡短摘要>

feat:     新功能
fix:      修正 bug
docs:     僅文件
refactor: 既非修 bug 也非加功能的程式碼調整
chore:    工具／維護
build:    建置系統或相依套件
```

摘要請用祈使句（例如：`fix: normalize account token`）。

## 分支與 Pull Request 流程

**開工前**

- 非瑣碎的變更，建議**先開一個 issue** 對齊做法再動手，避免白做工。
- 一個 PR 只做**一件事**：新功能、修 bug、重構請分開送，別把不相關的變更混在一起。

**分支命名**

- 從最新的 `main` 開 topic branch。
- 分支名沿用 commit 的 type：`feat/…`、`fix/…`、`docs/…`、`refactor/…`、`chore/…`
  （例如 `fix/cashback-token-normalize`）。

**送出 PR**

1. Fork 本 repo，從 `main` 開分支。
2. 進行變更，保持 diff 聚焦。
3. 確認正式版建置成功（`npm run build`）且擴充功能可正常載入。
4. 開 PR，清楚說明**改了什麼**、**為什麼**、以及**如何測試**（哪些站台／nindex、哪些瀏覽器）。
   若對應某個 issue，請一併連結。

**能被 merge 的 PR**

- 正式版建置通過，擴充功能能載入且功能正常。
- 遵循上述風格與命名慣例，且與周邊程式碼一致。
- 沒有寫死任何真實金鑰／機密；面向使用者的字串都已 `i18n()`。
- diff 聚焦，未夾帶不相關的重構或格式變動。
- 維護者會進行 review；請以**後續 commit** 回應意見，除非維護者要求，否則不要 force-push
  重寫已被 review 的歷史。

## 貢獻的授權

本專案採 **Apache License 2.0** 授權。提交貢獻即表示你同意你的貢獻以相同條款授權
（見授權條款第 5 節）。不需要另外簽署 CLA。

## 行為準則

參與本專案受 [行為準則](./CODE_OF_CONDUCT.md) 規範。

## 回報安全問題

安全漏洞請**勿**開公開 issue。私下回報方式見 [`SECURITY.md`](./SECURITY.md)。
