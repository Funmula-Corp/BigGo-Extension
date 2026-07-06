# sites.json 維護

`sites.json` 是打包在 extension 內的靜態 fallback 資料，只包含 `domain` 欄位（用於 `buildDomainMap`）。其目的是確保在 API 無法存取時，extension 至少能進行基本的 domain → nindex 查詢。

```
npm run update:sites       ← util/update-sites.js
  └─ 從 API 取得最新 sites → 寫入 biggo/js/sites.json

npm run clean:sites        ← util/clean-sites.js
  │
  ├─ 讀取 biggo/js/sites.json（完整 API 格式）
  ├─ 每個 entry 只保留 { domain: [...] }
  │    ├─ 移除 item（name, image, checkout_url, ...）
  │    └─ 移除 detail（image, rate_desc, desc, ...）
  └─ 寫回 biggo/js/sites.json（~51KB，原始 ~717KB，縮減 93%）
```

更新流程：`npm run update:sites` → `npm run clean:sites` → commit。

由於 `sites.json` 只隨版本更新而改變，如果 API 新增了站台但 extension 尚未更新，`sites.json` 的 fallback 會缺少新站台的 domain。此時只有等 API 成功回應後寫入 storage，新站台才會被識別。
