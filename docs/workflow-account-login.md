# Account Token 與登入同步

### syncAccountToken — 取得並驗證 Token

`syncAccountToken` 負責兩件事：(1) 從 ACCOUNT_DOMAIN 取得 token，(2) 用 token 向 API_DOMAIN 發起 login 請求。TTL 為 **30 分鐘**。

**注意：此函式沒有使用 `wrapQueue`。** INSTALL 時 `firstStart` 和 main IIFE 會並行呼叫，可能同時發出兩個 `get_token.php` 請求。

```
syncAccountToken(force?)
  │
  ├─ CACHE_EXPIRE_TIME = 30 分鐘
  │
  ├─ 讀 storage["sync_token_update_at"]（預設 0）
  │    isOverTime = now - lastUpdate > 30min
  │
  ├─ 讀 storage[STORAGE_KEY_ACCOUNT_TOKEN]
  │
  │  ┌─ 階段一：取得 Token ─────────────────────┐
  │  │                                           │
  ├─ !token || isOverTime || force ?             │
  │    │                                         │
  │    ├─ YES → fetch ACCOUNT_DOMAIN/api/get_token.php
  │    │         存 STORAGE_KEY_ACCOUNT_TOKEN     │
  │    │         存 sync_token_update_at          │
  │    │                                         │
  │    └─ NO → 使用 storage 中的 token            │
  │  └──────────────────────────────────────────┘
  │
  │  ┌─ 階段二：發起 Login ─────────────────────┐
  │  │                                           │
  ├─ token 有效（非空、非 "[]"）                  │
  │  且 (force || isOverTime) ?                  │
  │    │                                         │
  │    ├─ YES → fetch API_DOMAIN/api/login.php?token=...
  │    │         User.setLogin(true)              │
  │    │                                         │
  │    └─ NO → 跳過 login 呼叫                   │
  │  └──────────────────────────────────────────┘
  │
  └─ return token
```

#### ⚠ 已知問題

1. **沒有 error handling** — `getText(url)` 失敗會直接拋錯。main IIFE 有 `.catch(console.error)` 接住，但 `firstStart()` 裡用 `await syncAccountToken()` 沒有 try/catch，失敗會導致後續的 `syncLogin` 和 `chrome.tabs.create` 不執行。

2. **階段二的觸發條件** — 當 token 為空（首次）觸發階段一取得新 token 後，如果原本 `isOverTime` 為 `false`（timestamp 存在且未過期），階段二的條件 `force || isOverTime` 為 `false`，login.php 不會被呼叫。不過此情況很少見（token 為空但 timestamp 未過期）。

### syncLogin — 檢查登入狀態

`syncLogin` 透過 `wrapQueue("sync:login")` 序列化。它呼叫 `getMemberData` 向 API 查詢登入狀態，TTL 為 **30 分鐘**。

```
syncLogin(force?)
  │
  └─► wrapQueue("sync:login")
        │
        └─► syncLoginProcess(force?)
              │
              ├─ TIMEOUT = 30 分鐘
              │
              ├─ 讀 storage[STORAGE_KEY_LOGIN]
              │    isFirstTime = !loginStatus
              │
              ├─ 讀 storage[STORAGE_KEY_LOGIN_LAST_TIME]（預設 0）
              │    isOverTime = now - loginLast > 30min
              │
              ├─ isFirstTime || isOverTime || force ?
              │    │
              │    ├─ YES ──► getMemberData(force)
              │    │            │
              │    │            ├─ force || 已登入 → fetch API_DOMAIN/api/member.php
              │    │            └─ 否則 → return undefined
              │    │
              │    │         data 為空？
              │    │            ├─ YES → return false
              │    │            └─ NO：
              │    │                 ├─ User.setLogin(isLogin, data)
              │    │                 ├─ 存 STORAGE_KEY_LOGIN_LAST_TIME
              │    │                 ├─ 存 username（如有）
              │    │                 ├─ setConfigFromServer（如有 extension_config）
              │    │                 └─ return isLogin
              │    │
              │    └─ NO ──► return !!JSON.parse(loginStatus)  ← 從 storage 讀取
              │
              └─► catch → return false
```

### 呼叫時序

`syncAccountToken` 和 `syncLogin` 通常成對呼叫：先取 token 再檢查登入。

| 觸發點 | syncAccountToken | syncLogin | 說明 |
|--------|-----------------|-----------|------|
| `firstStart()` (INSTALL) | `await`，無 force | `await`，**force=true** | 序列執行，確保安裝時立即檢查登入 |
| main IIFE | 無 force | 無 force | `.then()` chain，syncAccountToken 完成後才 syncLogin |

**INSTALL 時的並行問題：**

```
firstStart:  await syncAccountToken() → await syncLogin(true)
main IIFE:   syncAccountToken().then(() => syncLogin()).then(() => installContextMenu())
             ↑ 兩者並行，syncAccountToken 沒有 wrapQueue 保護
             ↑ syncLogin 有 wrapQueue("sync:login")，第二個會排隊
```
