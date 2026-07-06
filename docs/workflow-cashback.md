# Cashback 返現系統

返現系統追蹤使用者從 BigGo 導流到電商網站的購物旅程，透過 background 的 session 狀態機和 storage 活動記錄雙重機制運作。目前僅台灣地區（`tw`）支援。

## 相關檔案

| 檔案 | 角色 |
|------|------|
| `biggo/js/libs/cashbackSession.js` | Session 狀態機（SessionMap 抽象層） |
| `biggo/js/libs/cashback.js` | Storage 操作（活動記錄、取消） |
| `biggo/js/core/shared/cashback.js` | 共用工具（item key、30 分鐘逾時檢查） |
| `biggo/js/content/idleCashback.js` | Content script 閒置偵測 |
| `biggo/js/content.bundle.js` | Content script 初始化、結帳偵測 |
| `biggo/js/background.listener.js` | Message passing handlers |

## Storage Key

| Key | 格式 | 值 | 用途 |
|-----|------|-----|------|
| `cashback:${tabId}:${nindex}` | `"cashback:42:tw_mall_shopee"` | timestamp (ms) | 活動中的返現 session（chrome.storage.local） |
| `cb-keylist` | — | key 字串陣列 | 追蹤所有活動中 session（批次清理用，chrome.storage.local） |
| `cashback_sessions` | — | `{ tabId: { host, nindex, isLanded } }` | Session 狀態機（MV3: chrome.storage.session） |

---

## 一、SessionMap — 雙重儲存抽象

返現系統同時維護兩層狀態：
1. **SessionMap** — 追蹤導流跳轉狀態（哪個 tab 正在從 BigGo 導流到哪個電商）
2. **chrome.storage.local** — 追蹤返現活動時間戳（用於 30 分鐘逾時判斷）

### 1.1 MV3 vs MV2 實作差異

```
SessionMap
  │
  ├─ MV3 (chrome.storage.session)
  │    ├─ _load() → chrome.storage.session.get("cashback_sessions")
  │    ├─ _save(map) → chrome.storage.session.set(...)
  │    ├─ has/get/set/delete/update → 全部 async
  │    │
  │    ├─ ✅ SW 重啟後保留（session storage 在瀏覽器開啟期間持續）
  │    └─ ✅ 瀏覽器關閉時自動清除（不需手動 clear）
  │
  └─ MV2 (記憶體 Map)
       ├─ has/get/set/delete/update → async 包裝的同步 Map
       │
       ├─ ✅ background page 持久存在，不會重啟
       └─ ✅ 瀏覽器關閉時自動清除
```

### 1.2 SW 啟動時的 Cashback.clear()

```
background.bundle.js main IIFE
  │
  ├─ MV3 → 不執行 Cashback.clear()
  │         （session 已透過 chrome.storage.session 持久化）
  │
  └─ MV2 → 執行 Cashback.clear()
            （background page 首次啟動時清除舊的返現活動記錄）
```

---

## 二、Session 生命週期

### 2.1 開始 — 使用者點擊 BigGo 導流連結

```
chrome.webNavigation.onBeforeNavigate
  │
  └─► listenBigGoR(info)                    [cashbackSession.js]
        │
        ├─ URL 比對：/r/ path on biggo.com.tw / biggo.com / API_DOMAIN
        │
        ├─ 從 URL 提取 purl 參數（原始商品 URL）
        ├─ decodeURIComponent → 取得 hostname
        ├─ getNindexFromURL → 解析 nindex
        │
        ├─ SessionMap.set(tabId, new Session(host, nindex))
        │    ├─ MV3 → chrome.storage.session 寫入
        │    └─ MV2 → 記憶體 Map 寫入
        │
        └─ Cashback.updateCashbackActivity(nindex, tabId)
             ├─ Shopee 正規化：tw_bid_shopee → tw_mall_shopeemall
             ├─ 存 cashback:${tabId}:${nindex} → Date.now()
             └─ 更新 cb-keylist
```

### 2.2 確認降落 — 使用者到達電商網站

```
chrome.webNavigation.onCompleted
  │
  └─► landingSite({url, tabId})              [cashbackSession.js]
        │
        ├─ 不在 session 中 → return
        │
        ├─ hostname 與 session 的 host 相符？
        │    ├─ YES → SessionMap.update(tabId, s => s.isLanded = true)
        │    └─ NO  → return（忽略，可能是中間頁）
```

### 2.3 離開 — 使用者導航到其他網站

```
chrome.webNavigation.onCommitted
  │
  └─► listenOtherSite(info)                 [cashbackSession.js]
        │
        ├─ 尚未降落（isLanded=false）→ return
        │
        ├─ BigGo 自有 domain（API_DOMAIN）→ return
        ├─ 已知金流處理器（acs.nccc.com.tw）→ return
        ├─ 同一商店（nindex 相符）→ return（允許）
        ├─ Shopee Mall 特例（tw_mall_shopeemall + shopee.tw/mall）→ return
        │
        └─ 以上都不符合 → 取消返現
             └─ Cashback.cancelCashback(session.nindex, tabId)
                  └─ storage.removeItem(cashback:${tabId}:${nindex})
```

### 2.4 關閉 Tab

```
chrome.tabs.onRemoved
  │
  └─► onTabClosed(tabId)                    [cashbackSession.js]
        │
        ├─ 在 session 中？
        │    ├─ YES → stop(tabId) + Cashback.cancelCashback(nindex, tabId)
        │    └─ NO  → return
```

---

## 三、活動逾時（30 分鐘）

### 3.1 isActivity 檢查

```
isActivity(nindex, tabId)                    [core/shared/cashback.js]
  │
  ├─ Shopee 正規化：tw_bid_shopee → tw_mall_shopeemall
  │
  ├─ 讀 storage[cashback:${tabId}:${nindex}]
  │    ├─ 無值 → return false
  │    └─ 有值 → (now - time) / 1000 <= 1800 ?
  │              ├─ YES → return true（30 分鐘內）
  │              └─ NO  → return false（已過期）
```

### 3.2 Content Script 閒置偵測

```
content.bundle.js 初始化
  │
  ├─ isActCashback && isCashbackNindex ?
  │    │
  │    └─ YES：
  │         ├─ idleCashback.init(nindex)
  │         ├─ idleCashback.listen()         ← 綁定 mousemove / keypress / mousedown
  │         ├─ idleCashback.tick()           ← 開始 30 分鐘倒數
  │         └─ idleCashback.onPop(callback)  ← 逾時回呼
  │
  │
  使用者活動：
  │
  ├─ mousemove / keypress / mousedown（每分鐘節流）
  │    └─ updateTimer()
  │         └─ send("cashback", "update_cookie", nindex)
  │              └─ background: Cashback.updateCashbackActivity()
  │                   └─ storage[cashback:tabId:nindex] → Date.now()  ← 重設計時器
  │
  │
  30 分鐘無活動：
  │
  └─ tick() 觸發
       ├─ setIdleHint()                      ← 顯示「返現即將到期」提示
       └─ callback()
            ├─ cancelCashbackAndClearPopup(nindex)
            └─ ga("cashback:expire", "popup", ...)
```

---

## 四、結帳頁面偵測

```
content.bundle.js handleNormalEC()
  │
  ├─ site.item.checkout_done_url 存在？
  │    └─ isCheckoutPage(checkout_done_url, location.href) ?
  │         │
  │         ├─ YES 且 isCashbackNindex：
  │         │    ├─ cancelCashbackAndClearPopup(nindex)
  │         │    ├─ updateIcon(nindex, "biggo")
  │         │    └─ ga("popup-checkoutpage", ...)
  │         │
  │         └─ NO → 繼續一般流程
```

---

## 五、返現取消路徑總覽

### 5.1 cancelCashback（單一 session）

移除 `storage[cashback:${tabId}:${nindex}]`

| # | 觸發路徑 | 位置 | 場景 |
|---|----------|------|------|
| 1 | `listenOtherSite` | `cashbackSession.js` | 已降落後導航到其他網站 |
| 2 | `onTabClosed` | `cashbackSession.js` | 關閉 tab |
| 3 | Content: 結帳完成 | `content.bundle.js` | checkout_done_url 匹配 |
| 4 | Content: 閒置逾時 | `content.bundle.js` | 30 分鐘無 mousemove/keypress |
| 5 | Content: 不支援返現 | `content.bundle.js` | 電商存在但 isCashbackNindex=false |
| 6 | Content 主動請求 | `background.listener.js` | send("cashback", "cancel_cashback") |

### 5.2 clear（全部清除）

移除 `cb-keylist` 中記錄的所有 cashback session

| # | 觸發路徑 | 位置 | 場景 |
|---|----------|------|------|
| 7 | `logoutHandle` | `biggo.js` | 使用者在 BigGo 登出 |
| 8 | main IIFE 啟動 | `background.bundle.js` | **僅 MV2**，SW 啟動時清除 |

### 5.3 自然過期

| # | 觸發路徑 | 位置 | 場景 |
|---|----------|------|------|
| 9 | `isActivity` | `core/shared/cashback.js` | timestamp 超過 30 分鐘，回傳 false |

```
返現 session 存活中
  │
  ├─ 導航到其他網站 ──────────► cancelCashback       [#1]
  ├─ 關閉 tab ────────────────► cancelCashback       [#2]
  ├─ 到達結帳完成頁 ──────────► cancelCashback       [#3]
  ├─ 30 分鐘無操作 ──────────► cancelCashback        [#4]
  ├─ 站台不支援返現 ──────────► cancelCashback       [#5]
  ├─ content 主動取消 ────────► cancelCashback       [#6]
  ├─ 使用者登出 BigGo ────────► clear (全部)         [#7]
  ├─ SW 啟動（僅 MV2）────────► clear (全部)         [#8]
  └─ 時間自然過期 ────────────► isActivity=false     [#9]
```

---

## 六、完整 Happy Path

```
1. 使用者在 BigGo 搜尋結果點擊返現連結
   URL: https://extension.biggo.com/r/?f=extension&i=tw_mall_shopee&purl=...
     ↓
2. listenBigGoR()
   ├─ SessionMap.set(42, Session{shopee.tw, tw_mall_shopee, isLanded:false})
   └─ storage[cashback:42:tw_mall_shopee] = 1710697200000
     ↓
3. 瀏覽器載入 Shopee 商品頁
     ↓
4. landingSite()
   └─ SessionMap.update(42, s => s.isLanded = true)
     ↓
5. content script 初始化
   ├─ isActivity() = true（30 分鐘內）
   ├─ idleCashback 開始監控
   └─ icon 變紫色（MURASAKI）
     ↓
6. 使用者瀏覽商品（持續活動）
   └─ 每次活動 → updateCashbackActivity() → 重設 timestamp
     ↓
7. 使用者結帳完成
   ├─ 偵測到 checkout_done_url
   └─ cancelCashback() → 移除 storage → session 結束
```

---

## 七、特殊處理

| 情境 | 處理方式 |
|------|----------|
| Shopee nindex 正規化 | `tw_bid_shopee` → `tw_mall_shopeemall` |
| Shopee Mall 子域 | `shopee.tw/mall` 路徑不觸發離站取消 |
| 金流頁面（NCCC） | `acs.nccc.com.tw` 不觸發離站取消 |
| BigGo 自有域名 | `API_DOMAIN` 不觸發離站取消 |
| 地區限制 | 僅 `tw` 地區啟用返現 |
| MV3 SW 重啟 | SessionMap 透過 chrome.storage.session 保留，不影響返現 |
| MV2 啟動 | Cashback.clear() 清除所有舊 session |
