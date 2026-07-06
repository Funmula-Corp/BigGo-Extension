# syncECThread — 定時同步排程

`syncECThread` 是 background script 中觸發 Sites 和 ECList 同步的排程機制。它在啟動時立即執行一次，之後每 60 分鐘由 chrome alarm 觸發。

### bindSyncECThread — 初始化

```
bindSyncECThread()
  │
  ├─ syncECThread()                              ← 啟動時立即跑一次
  └─ chrome.alarms.create("syncECThread", 60min)  ← 之後每 60 分鐘觸發
```

### syncECThread — 執行邏輯

```
syncECThread()
  │
  ├─ lastUpdate = storage["update_site_last_time"]（預設 0）
  ├─ storage["update_site_last_time"] = now        ← 無條件寫入，不管後續是否執行
  │
  ├─ lastUpdate 存在 且 距離現在 < 1hr ?
  │    ├─ YES → return（跳過本次）
  │    └─ NO  → 繼續
  │
  ├─ syncSites().catch(console.error)              ← fire-and-forget，不等結果
  └─ syncECList().catch(console.error)             ← fire-and-forget，不等結果
```

### 實際觸發頻率分析

`syncECThread` 內部有 1 小時的節流機制（`LOOP_TIME = 1hr`），而 alarm 每 60 分鐘觸發。由於 `update_site_last_time` 在函式開頭**無條件寫入**，即使因節流跳過執行，timestamp 也會被更新為當下時間。

具體時序：

| 時間 | 事件 | update_site_last_time | 距離上次 | 結果 |
|------|------|-----------------------|----------|------|
| T+0 | 啟動，首次呼叫 | 0 → now | — | lastUpdate=0，`!lastUpdate` 為 true → **執行** |
| T+60m | alarm 觸發 | T+0 → T+60m | 60min | 60min < 1hr → **跳過**（但 timestamp 更新為 T+60m） |
| T+120m | alarm 觸發 | T+60m → T+120m | 60min | 60min < 1hr → **跳過**（timestamp 更新為 T+120m） |

注意：每次 alarm 觸發時，距離上次寫入都是 ~60 分鐘，永遠 < 1 小時。這代表在首次執行後，syncECThread **每次 alarm 觸發都會被跳過**，除非 service worker 被回收後重新啟動（此時 storage 中的時間可能已經超過 1 小時）。

MV3 的 service worker 會被瀏覽器在閒置時回收，重啟後 main IIFE 會再次執行 `bindSyncECThread()`，重新開始上述循環。因此實際觸發頻率取決於 service worker 的存活週期，而非 alarm 間隔。
