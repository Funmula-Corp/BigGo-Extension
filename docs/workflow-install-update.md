# 安裝與更新流程

### 第一次安裝 (INSTALL)

`chrome.runtime.onInstalled` 觸發時，`firstStart()` 和 main IIFE **並行**執行。

**firstStart()：**

```
chrome.runtime.onInstalled (reason: INSTALL)
  │
  └─► firstStart()
        │
        ├─ cacheCurrentVersion()                ← 存 manifest version 到 storage
        ├─ await syncAccountToken()             ← 取得 account token
        ├─ await syncLogin(true)                ← force 檢查登入狀態
        └─ chrome.tabs.create(url)              ← Firefox: 本地隱私頁 / 其他: 遠端歡迎頁
```

**main IIFE（同時執行）：**

```
main IIFE
  │
  ├─ Cashback.clear()                           ← 清除返現狀態
  │
  ├─ syncRegion()                               ← 取得使用者地區（3hr TTL）
  │
  ├─ syncAccountToken()                         ← 取得 account token
  │    → syncLogin()                            ← 非 force 檢查登入
  │    → installContextMenu()                   ← 安裝右鍵選單
  │
  ├─ bindSyncECThread()                         ← 啟動同步排程
  │    ├─ syncECThread()                        ← 立即執行
  │    │    ├─ update_site_last_time = 0 → 通過 1hr 檢查
  │    │    ├─ syncSites()                      ← ec_last_time 不存在 → isFirstTime → updateSites()
  │    │    └─ syncECList()                     ← 同理，首次會呼叫 updateECList()
  │    └─ chrome.alarms.create("syncECThread", 60min)
  │
  ├─ Icon.bindBlinkListener()                   ← 綁定 icon 閃爍事件
  ├─ bindIconSwitch()                           ← 綁定頁面導航時的 icon 更新
  ├─ bindSessionHandle()                        ← 綁定 cashback session 監聽
  ├─ BigGo.updateInstallCookie()                ← 更新安裝 cookie
  ├─ BigGo.bindAccountStatusListener()          ← 監聽登入/登出
  ├─ User.setGAUserId()                         ← 設定 GA user ID
  ├─ setUninstallEventHandle()                  ← 設定解除安裝回報 URL
  ├─ listenTabChange()                          ← 監聽 tab 切換 → 通知 popup
  ├─ bindDefPopup()                             ← 設定預設 popup URL
  ├─ updateAllPopMenu()                         ← 更新所有 tab 的 popup
  └─ bindPermissionRequest()                    ← 監聽權限變動
```

### 更新 (UPDATE)

更新時 `onInstalled` 以 `force=true` 觸發 sites 和 ECList 同步，確保版本更新後立即取得最新資料。

```
chrome.runtime.onInstalled (reason: UPDATE)
  │
  ├─ cacheCurrentVersion()                      ← 存新版號
  ├─ syncSites(true).catch(console.error)       ← force=true，繞過 6hr TTL
  └─ syncECList(true).catch(console.error)      ← force=true，繞過 3hr TTL
```

同時 main IIFE 也會執行（同上述流程）。`syncSites(true)` 和 `syncECThread()` 中的 `syncSites()` 都會進入 `wrapQueue("sync:sites")`，佇列確保只有一個實際執行，另一個排隊等待。由於 UPDATE 的呼叫帶 `force=true`，如果它先執行，會繞過 TTL 直接向 API 拉資料；排在後面的非 force 呼叫則會因為 `ec_last_time` 剛被更新而直接回傳快取。

### 時序重點

| 事件 | INSTALL | UPDATE |
|------|---------|--------|
| syncSites | main IIFE 的 syncECThread 觸發（非 force） | onInstalled **force=true** + main IIFE 的 syncECThread |
| syncECList | main IIFE 的 syncECThread 觸發（非 force） | onInstalled **force=true** + main IIFE 的 syncECThread |
| syncLogin | firstStart **force=true** + main IIFE 非 force | main IIFE 非 force |
