# ECList 同步

ECList 的同步機制和 Sites 類似，但 TTL 較短（3 小時），且**有檢查資料是否為空**。

### syncECListProcess

```
syncECListProcess(force?)
  │
  ├─ 讀 storage["ec_list_update_at"]
  │    isOverTime = now - lastUpdate > 3hr
  │
  ├─ 讀 storage[STORAGE_KEY_EC_LIST]
  │
  ├─ force || !list || isOverTime ?
  │    │
  │    ├─ YES ──► updateECList()
  │    └─ NO  ──► return list
  │
  └─► return list
```

注意與 `syncSitesProcess` 的關鍵差異：ECList 在 NO 分支的判斷是 `!list`（資料為空就更新），而 Sites 只看 TTL。這代表 **ECList 不會遇到 Sites 的那個 BUG**——如果 ECList 資料被清空，下次同步會立即重新拉取。

### updateECList

```
updateECList()
  │
  ├─ fetch /api/eclist.php
  │
  ├─ obj.result 為 true?
  │    ├─ YES → transformECList(obj.data)
  │    │          │
  │    │          └─ 將 { region: { nindex: {...} } }
  │    │             轉為 { nindex: { region, nindex, ... } }
  │    │
  │    │        存 STORAGE_KEY_EC_LIST + STORAGE_UNION_LIST + ec_list_update_at
  │    │
  │    └─ NO → list = {}
  │
  ├─ catch → return {}
  │
  └─► return list
```
