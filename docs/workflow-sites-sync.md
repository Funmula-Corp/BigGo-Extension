# Sites 資料同步

### 入口：syncSites(force?)

`syncSites` 是所有 sites 同步的統一入口。任何需要取得或刷新 sites 資料的地方都透過它呼叫。它將實際邏輯包在 `wrapQueue("sync:sites")` 中，確保同時間只會有一個 sync 在執行，後續呼叫會排隊等待。

```
syncSites(force?)
  │
  └─► wrapQueue("sync:sites")
        │
        └─► syncSitesProcess(force?)
```

### 核心：syncSitesProcess(force?)

這個函式決定「要不要向 API 拉新資料」。判斷邏輯如下：

1. 讀取 `ec_last_time`（上次成功從 API 取得 sites 的時間）
2. 計算兩個 flag：
   - `isFirstTime`：`ec_last_time` 不存在（從未成功過）
   - `isOverTime`：距離上次成功超過 **6 小時**
3. 如果 `force` 或 `isFirstTime` 或 `isOverTime` → 呼叫 `updateSites()` 向 API 拉資料
4. 否則 → 直接從 storage 讀取 `STORAGE_KEY_SITES` 回傳

```
syncSitesProcess(force?)
  │
  ├─ 讀 storage["ec_last_time"]
  │    isFirstTime = !lastTime
  │    isOverTime  = now - lastTime > 6hr
  │
  ├─ force || isFirstTime || isOverTime ?
  │    │
  │    ├─ YES ──► updateSites() → return data
  │    │
  │    └─ NO ──► 讀 storage[STORAGE_KEY_SITES]
  │                │
  │                ├─ 有值 → return sites
  │                └─ 無值 → return {}       ⚠ BUG
  │
  └─► catch → return {}
```

#### ⚠ 已知問題：資料為空時不會主動重新取得

當 `ec_last_time` 存在（代表先前成功取得過）但 `STORAGE_KEY_SITES` 為空時（可能原因：瀏覽器清除 storage、配額超限、或先前寫入失敗），`isFirstTime` 和 `isOverTime` 都為 `false`，程式不會呼叫 `updateSites()`，而是直接回傳 `{}`。

用戶要等到 `ec_last_time` 自然過期（最長 6 小時）才會再次嘗試向 API 取得資料。在這段期間內，所有依賴完整 sites 資料的功能（cashback 判斷、商品推薦、popup 資訊等）都會因為拿到空物件而失效。

此外，API 失敗時完全沒有重試機制。失敗後只能被動等下一次 `syncECThread` 排程觸發（間隔約 60～120 分鐘），無法在短時間內自動恢復。

### updateSites — 向 API 拉取資料

`updateSites()` 是實際發出 HTTP 請求的函式。它呼叫 `getSiteData()`（fetch `/api/sites_v2.php`），成功後將完整 sites 物件寫入 storage，同時更新 `ec_last_time`。

```
updateSites()
  │
  ├─ try:
  │    ├─ data = getSiteData()                ← fetch /api/sites_v2.php
  │    └─ storage.setObject({
  │         STORAGE_KEY_SITES: data,
  │         ec_last_time: Date.now()
  │       })
  │
  ├─ catch:
  │    └─ （空區塊，不做任何處理）
  │       data 維持 undefined
  │       ec_last_time 不會被更新（因為寫入在 try 內、catch 前）
  │       STORAGE_KEY_SITES 也不會被寫入
  │
  └─► updateSitesMap(data)                    ← data 可能是 undefined
  └─► return data                             ← 可能是 undefined
```

**重點：API 失敗時 `updateSites()` 回傳 `undefined`，不是 `sites.json`。** `sites.json` 只在 `updateSitesMap` 建置 domain map 時作為 fallback 使用，因為它只含 `domain` 欄位，不適合作為完整的 sites 資料。

API 失敗時 `ec_last_time` 不會被寫入，所以下次呼叫 `syncSitesProcess` 時 `isFirstTime` 依然為 `true`（如果從未成功過）或 `isOverTime` 保持原狀（如果之前有成功過）。這代表：
- **從未成功過的情況**：下次呼叫會再嘗試（因為 `isFirstTime=true`），但要等排程觸發
- **曾經成功但這次失敗**：`ec_last_time` 保留上次的值，要等它過期才會再嘗試

### updateSitesMap — 建置 Domain Map

`updateSitesMap` 負責將 sites 資料轉換為兩張 domain map 並寫入 storage，供 `domainLocalQuery` 查詢使用。

當傳入的 `sites` 為空（例如 `updateSites` 中 API 失敗，data 為 `undefined`），它會嘗試從 storage 讀取 `STORAGE_KEY_SITES`，如果 storage 也是空的，則最終使用打包在 extension 內的 `sites.json` 作為 fallback。這確保 domain map 在任何情況下都能被建立。

```
updateSitesMap(sites?)
  │
  ├─ sites 有值 → 直接使用
  │
  ├─ sites 為空：
  │    ├─ 讀 storage[STORAGE_KEY_SITES]
  │    │    ├─ 有值且非空 → 使用
  │    │    └─ 無值或空   → 使用 sites.json (fallback)
  │
  └─ buildDomainMap(sites)
       │
       ├─ 遍歷所有 nindex，跳過 "biggo" 開頭的
       │
       ├─ 對每個 site 的 domain 陣列中的每個 hostname：
       │    ├─ 不在 map 也不在 regionMap → map[domain] = nindex（單一對應）
       │    ├─ 已在 map（碰撞）→ 原本的和新的都搬到 regionMap，從 map 刪除
       │    └─ 已在 regionMap → 加入該 domain 的 region 對應
       │
       ├─► 存 STORAGE_KEY_DOMAIN_MAP       { hostname → nindex }（1:1 對應）
       └─► 存 STORAGE_KEY_DOMAIN_REGION_MAP { hostname → { region → nindex } }（多國站台）
```

**碰撞處理範例：** Nike 在台灣和泰國共用 `www.nike.com`，第一次遇到 `tw_pec_nike` 時寫入 `map["www.nike.com"] = "tw_pec_nike"`。第二次遇到 `thai_pec_nike` 時發生碰撞，兩者都搬到 `regionMap["www.nike.com"] = { tw: "tw_pec_nike", thai: "thai_pec_nike" }`，並從 `map` 中刪除。

### buildFallbackDomainMap — 懶載入 Fallback

`buildFallbackDomainMap()` 以模組層級變數 `_fallbackDomainMap` 快取結果。第一次呼叫時從 `sites.json` 建置 domain map，之後直接回傳快取。這個函式用於 `domainLocalQuery` 中，當 storage 的 domain map 為空時作為即時 fallback。
