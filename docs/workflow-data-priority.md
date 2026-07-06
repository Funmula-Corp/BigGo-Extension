# 資料來源優先順序

整體而言，extension 中有兩層資料需求：

1. **Domain Map**（hostname → nindex）：用於快速判斷使用者正在瀏覽的網站是哪個電商。
2. **完整 Sites 資料**（nindex → { domain, item, detail, ... }）：用於 cashback 費率、商品推薦、popup 資訊等功能。

```
                         Sites 完整資料               Domain Map
                         ──────────────               ──────────

 1st   API /sites_v2.php ──► STORAGE_KEY_SITES
                                     │
                                     ├──► DOMAIN_MAP
                                     └──► DOMAIN_REGION_MAP
                                                │
 2nd                               storage 有值 → 用 storage
                                                │
 3rd                               storage 無值 → buildDomainMap(sites.json)
```

- **Domain Map** 有三層 fallback（API → storage → sites.json），保證任何情況都能查詢
- **完整 Sites 資料** 只有 API 一個來源，API 失敗時 `STORAGE_KEY_SITES` 不會被寫入，維持空值
