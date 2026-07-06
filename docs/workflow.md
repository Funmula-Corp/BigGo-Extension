# Extension Workflow

本文件詳細描述 BigGo Extension 中 Sites 資料取得、Domain 查詢、ECList 同步，以及安裝/更新時的完整運作流程。所有描述皆對應目前程式碼的實際行為。

---

## 相關檔案

| 檔案 | 角色 |
|------|------|
| `biggo/js/libs/sync.js` | Sites / ECList / Region / Login 的同步邏輯 |
| `biggo/js/libs/domain.js` | Domain → nindex 查詢（本地 + 遠端） |
| `biggo/js/libs/queue.js` | 同步佇列（wrapQueue） |
| `biggo/js/core/shared/sites.js` | Content / Background 共用的 sites 存取介面 |
| `biggo/js/core/shared/storage.js` | chrome.storage.local 封裝 + storage key 常數 |
| `biggo/js/background.bundle.js` | Background script 進入點，包含排程與生命週期 |
| `biggo/js/sites.json` | 打包在 extension 內的靜態 fallback（僅 domain 欄位） |

---

## Storage Key 對照表

以下列出同步相關的所有 storage key，以及它們在流程中的角色。

| Storage Key | 常數名稱 | 寫入時機 | 內容 |
|-------------|----------|----------|------|
| `"sites"` | `STORAGE_KEY_SITES` | `updateSites()` API 成功時 | 完整 sites 物件（含 item, detail, domain 等） |
| `"ec_last_time"` | （字串直接使用） | `updateSites()` API 成功時 | timestamp，用於 6 小時 TTL 判斷 |
| `"domain_map"` | `STORAGE_KEY_DOMAIN_MAP` | `updateSitesMap()` | `{ hostname: nindex }` 單一對應 |
| `"domain_region_map"` | `STORAGE_KEY_DOMAIN_REGION_MAP` | `updateSitesMap()` | `{ hostname: { region: nindex } }` 多國對應 |
| `"update_site_last_time"` | （字串直接使用） | `syncECThread()` 開頭無條件寫入 | timestamp，用於 syncECThread 的 1 小時節流 |
| `"ec_list"` | `STORAGE_KEY_EC_LIST` | `updateECList()` API 成功時 | 扁平化後的 ECList |
| `"ec_list_update_at"` | （字串直接使用） | `updateECList()` API 成功時 | timestamp，用於 3 小時 TTL 判斷 |
| `"account_token"` | `STORAGE_KEY_ACCOUNT_TOKEN` | `syncAccountToken()` 取得 token 時 | account token 字串 |
| `"sync_token_update_at"` | （字串直接使用） | `syncAccountToken()` 取得 token 時 | timestamp，用於 30 分鐘 TTL 判斷 |
| `"login"` | `STORAGE_KEY_LOGIN` | `syncLoginProcess()` 透過 `User.setLogin()` | 登入狀態（JSON boolean） |
| `"login_last_time"` | `STORAGE_KEY_LOGIN_LAST_TIME` | `syncLoginProcess()` API 成功時 | timestamp，用於 30 分鐘 TTL 判斷 |
| `"username"` | （字串直接使用） | `syncLoginProcess()` API 回傳有 name 時 | 使用者名稱 |

---

## Workflow 文件

| 文件 | 說明 |
|------|------|
| [Sites 資料同步](workflow-sites-sync.md) | syncSites、updateSites、updateSitesMap、buildDomainMap、fallback 機制 |
| [Domain 查詢](workflow-domain-query.md) | getId、domainLocalQuery、content script 端的站台查詢 |
| [ECList 同步](workflow-eclist-sync.md) | syncECList、updateECList、transformECList |
| [Account Token 與登入同步](workflow-account-login.md) | syncAccountToken、syncLogin、getMemberData |
| [syncECThread — 定時同步排程](workflow-ec-thread.md) | bindSyncECThread、節流機制、觸發頻率分析 |
| [安裝與更新流程](workflow-install-update.md) | INSTALL / UPDATE 生命週期、main IIFE、時序重點 |
| [資料來源優先順序](workflow-data-priority.md) | 三層 fallback（API → storage → sites.json） |
| [wrapQueue — 同步佇列](workflow-wrap-queue.md) | key-based 序列化、queue key 對照表 |
| [sites.json 維護](workflow-sites-json.md) | update:sites / clean:sites script |
| [Cashback 返現系統](workflow-cashback.md) | Session 生命週期、活動逾時、結帳偵測 |
| [Popup 選單與 Icon 系統](workflow-popup-icon.md) | setPopupMenu 決策、Icon 狀態、閃爍動畫 |
| [Content Script 與 Message Passing](workflow-content-message.md) | 頁面偵測、iframe 注入、Bridge 協定、訊息對照表 |
