# Popup 選單與 Icon 系統

Popup 選單和 Icon 狀態根據目前分頁的網站類型、返現狀態、登入狀態動態決定。每次頁面導航都會觸發重新判斷。

## 相關檔案

| 檔案 | 角色 |
|------|------|
| `biggo/js/libs/popup.js` | setPopupMenu 決策邏輯、updateAllPopMenu |
| `biggo/js/libs/icon.js` | Icon 設定、閃爍動畫 |
| `biggo/js/background.bundle.js` | bindIconSwitch 導航監聽 |
| `biggo/pages/popmenu/` | Popup 頁面（HTML + JS） |

---

## 一、Icon 狀態

| Icon | 常數 | 檔案 | 條件 |
|------|------|------|------|
| 灰色 | `ICON_GRAY` | `ic_B_nocashback@2x.png` | 非電商網站 |
| 綠色 | `ICON_GREEN` | `ic_B_enabled@2x.png` | 電商但無返現（或有優惠券） |
| 黃色 | `ICON_YELLOW` | `ic_B_disabled@2x.png` | 有返現但未啟用（未登入 / 未活動） |
| 紫色 | `ICON_MURASAKI` | `ic-b-p@2x.png` | 返現活動中 |
| 黃紅框 | `ICON_YELLOW_RED_BORDER` | `ic-b-erro@2x.png` | Firefox 閃爍動畫用 |

---

## 二、setPopupMenu 決策流程

每次頁面導航時由 `bindIconSwitch()` 觸發：

```
chrome.webNavigation.onCommitted (main frame only)
  │
  └─► setPopupMenu(tabId, url, nindex, pid, {animation})
        │
        ├─ 取得 sites 資料：getSiteList()
        ├─ site = sites[nindex]
        ├─ isEC = site && site.item
        ├─ isCashback = isEC && site.detail.desc
        │
        ├─ isLogin = await syncLogin()
        ├─ isAct = isLogin && isCashback && await Cashback.isActivity(nindex, tabId)
        │
        ├─ region = await getRegion()
        ├─ isCbRegion = isCashbackRegion(region)
        │
        ├─ couponList = await syncCoupon(nindex)
        ├─ hasCoupon = couponList && couponList.length > 0
        │
        │  ┌─ Icon 決策 ──────────────────────────────────┐
        │  │                                               │
        ├─ !isEC                                           │
        │    └─ ICON_GRAY                                  │
        │                                                  │
        ├─ (isEC || hasCoupon) && !isCashback               │
        │    └─ ICON_GREEN                                 │
        │                                                  │
        ├─ isCashback && isCbRegion && (!isLogin || !isAct) │
        │    ├─ animation=true → startAnimation(tabId)     │
        │    └─ animation=false → ICON_YELLOW              │
        │                                                  │
        ├─ isAct                                           │
        │    └─ ICON_MURASAKI                              │
        │  └──────────────────────────────────────────────┘
        │
        └─ 設定 popup URL：
             popmenu.html#nindex=...&tabId=...&purl=...&cbi={0|1}&itemId=...
```

---

## 三、觸發時機

| 觸發點 | 位置 | animation |
|--------|------|-----------|
| 頁面導航 | `bindIconSwitch()` → `webNavigation.onCommitted` | false |
| Popup 請求更新 | `receiver.pop.update_icon()` | 自訂 |
| 啟動時全部更新 | `updateAllPopMenu()` | — |

---

## 四、Icon 閃爍動畫

### Chrome（Vite build）

```
startAnimation(tabId)
  └─ startFlash(tabId)
       └─ 循環 115 張動畫幀
            icons/animation/00000.png → 00114.png
            每幀 32ms（總計 ~3.68 秒）
            有 debounce（1000ms 內不重複觸發）
```

### Firefox

```
startAnimation(tabId)
  └─ startBlink(tabId)
       └─ ICON_YELLOW ↔ ICON_YELLOW_RED_BORDER 交替
            200ms 間隔
            1200ms 後停止（~6 幀）
```

### 清理

```
bindBlinkListener()
  ├─ chrome.tabs.onRemoved → stopAnimation(tabId)
  └─ webNavigation.onBeforeNavigate (main frame) → stopAnimation(tabId)
```

---

## 五、Popup 頁面架構

### URL 參數

```
popmenu.html#nindex=${nindex}&tabId=${tabId}&purl=${purl}&cbi=${0|1}&itemId=${itemId}
```

| 參數 | 用途 |
|------|------|
| `nindex` | 站台 ID，空字串表示非電商 |
| `tabId` | 目前 tab ID |
| `purl` | 編碼後的頁面 URL |
| `cbi` | 返現活動旗標（0=未啟用, 1=啟用中） |
| `itemId` | 商品 ID（選填） |

### 內容路由

```
popmenu.js
  │
  ├─ nindex 包含 "_"（有站台）
  │    └─ iframe.src = API_DOMAIN/popmenu/store.php?nindex=...
  │
  └─ 無站台
       └─ iframe.src = API_DOMAIN/popmenu/home.php?...
```

### 導航分頁

| 分頁 | 載入頁面 |
|------|----------|
| home | `API_DOMAIN/popmenu/home.php` |
| search | `API_DOMAIN/popmenu/search.php` |
| account | `API_DOMAIN/popmenu/account.php` 或 `login.php` |

### Background 通訊

Popup 透過 `Receiver/popup.js` 監聽 background 推送：

| 訊息 | 動作 |
|------|------|
| `tab_changed` | 重新檢查頁面 |
| `cashback_changed` | 比對 tabId 後 reload |
| `login` | reload |
| `logout` | reload |

### 頁面驗證（checkPage）

Popup 開啟時和 `visibilitychange` 時檢查：
- tabId 變了？
- URL 變了？
- 返現狀態（cbi）變了？

任一為 true → 重建 hash 參數並 reload。
