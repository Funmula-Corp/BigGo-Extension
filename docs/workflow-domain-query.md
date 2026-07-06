# Domain 查詢

### getId — 入口

Content script 透過 message passing 呼叫 background 的 `getId(url)` 來判斷使用者正在瀏覽的網站是否為已知電商。

`getId` 先進行基本驗證（URL 格式、排除 Google），然後呼叫 `domainLocalQuery` 做本地查詢。

```
getId(url)
  │
  ├─ 非合法 URL → return ""
  ├─ hostname 包含 google.co → return ""
  │
  └─► getIdProcess(domain, url)
        └─► domainLocalQuery(domain, url)
```

### domainLocalQuery — 本地 Domain Map 查詢

`domainLocalQuery` 依序查詢 regionMap 和 domainMap。每一步都有 fallback 機制：先嘗試從 storage 讀取，如果為空則即時從 `sites.json` 建置。

查詢 regionMap 時，會取得使用者的 region（透過 `getRegion()`），並做 `th → thai` 的轉換以匹配 nindex 命名規則。如果使用者的 region 沒有對應的 nindex，則取 regionMap 中第一個可用的 nindex。

```
domainLocalQuery(domain, url)
  │
  ├─ 從 URL 取出 hostname
  │
  ├─ 讀 storage[DOMAIN_REGION_MAP]
  │    ├─ 有值且非空 → 使用 storage 的值
  │    └─ 無值或空{} → buildFallbackDomainMap().regionMap
  │
  ├─ hostname 在 regionMap 中？
  │    └─ YES：
  │         ├─ 取得 user region（th → thai 轉換）
  │         ├─ regions[region] 存在 → return 該 nindex
  │         └─ 不存在 → return 第一個 region 的 nindex
  │
  ├─ 讀 storage[DOMAIN_MAP]
  │    ├─ 有值且非空 → 使用 storage 的值
  │    └─ 無值或空{} → buildFallbackDomainMap().map
  │
  ├─ hostname 在 domainMap 中？
  │    └─ YES → return nindex
  │
  └─ return ""（未知站台）
```

**重點：** `domainLocalQuery` 透過 `buildFallbackDomainMap` 保證在任何情況下都有 domain map 可查。即使 storage 完全是空的（剛安裝且 API 尚未回應），也能用打包的 `sites.json` 回答。但它只能回答「這個 domain 對應哪個 nindex」，無法提供完整的站台資訊（cashback 費率、checkout URL 等），那些需要依賴 `STORAGE_KEY_SITES`。

### Content Script 端的站台查詢

Content script 有另一條查詢路徑，在 `biggo/js/core/shared/sites.js` 中的 `getNindexFromURL`：

```
getNindexFromURL(url)                          ← content script 呼叫
  │
  └─► envCall:
        ├─ content context → send("get", "domainId", url)  → 透過 message passing 到 background 的 getId
        └─ background context → getId(url)                  → 直接呼叫

  └─► resolveGlobalSiteNindex(nindex)          ← 處理多國站台映射（如 nike.tw → nike.th）
```

另一條路徑 `getNindexFromSitelist(url)` 則會同時查 ECList 的 regex pattern (`ptn`) 和 sites 的 domain 陣列，提供更廣泛的比對。這條路徑需要完整的 sites 和 ECList 資料，如果 `STORAGE_KEY_SITES` 為空就會失效。

### getSiteList / getECList — Content 端取得資料

`getSiteList()` 和 `getECList()` 是 content script 取得完整資料的介面。它們先嘗試從 storage 讀取，如果為空則透過 `envCall` 觸發同步：

```
getSiteList()
  │
  ├─ 讀 storage[STORAGE_KEY_SITES]
  │    ├─ 有值 → return
  │    └─ 無值 → envCall:
  │         ├─ content → send("sync", "sites")     → message 到 background
  │         └─ background → syncSites()             → 直接呼叫
  └─ fallback → return {}
```

這代表如果 background 的 `syncSites` 也回傳空的（因為上述 BUG），content script 同樣拿到 `{}`。
