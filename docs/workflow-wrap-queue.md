# wrapQueue — 同步佇列

`wrapQueue` 提供 key-based 的序列化執行。同一個 key 同時間只會有一個函式在執行，後續呼叫排隊等待前一個完成後才開始。不同 key 之間互不影響。

```
wrapQueue(key, fn)
  │
  ├─ globalQueue[key] 不存在 → 初始化為 Promise.resolve("")
  │
  ├─ 將 fn 串接到 promise chain：
  │    globalQueue[key] = globalQueue[key].then(fn)
  │
  ├─ fn 成功 → scheduleCleanup(key)
  │    └─ 5 分鐘後從 globalQueue 移除該 key
  │
  ├─ fn 失敗 → console.error + scheduleCleanup(key)
  │    └─ 回傳 undefined（吞掉 error，不向外拋出）
  │
  └─ return globalQueue[key]
```

目前使用的 queue key：

| Queue Key | 使用函式 | 說明 |
|-----------|----------|------|
| `"sync:sites"` | `syncSites()` | Sites 同步，6hr TTL |
| `"sync:eclist"` | `syncECList()` | ECList 同步，3hr TTL |
| `"sync:region"` | `syncRegion()` | Region 同步，3hr TTL |
| `"sync:login"` | `syncLogin()` | Login 同步，30min TTL |
| `"sync:cp:{nindex}"` | `syncCoupon()` | 單一商店優惠券，30min TTL |

注意：`wrapQueue` 的 catch 會吞掉錯誤並回傳 `undefined`。這代表如果 `syncSitesProcess` 內部拋出未捕獲的例外，`syncSites()` 的呼叫端會收到 `undefined` 而非 error，可能導致靜默失敗。
