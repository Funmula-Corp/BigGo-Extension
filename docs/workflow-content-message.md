# Content Script 與 Message Passing

Content script 負責偵測頁面類型（電商 / Google 搜尋 / 一般頁面），注入對應的 UI 元件，並透過 message passing 與 background script 和 frontend (Svelte) 通訊。

## 相關檔案

| 檔案 | 角色 |
|------|------|
| `biggo/js/content.bundle.js` | Content script 進入點，頁面偵測、功能注入 |
| `biggo/js/content.listener.js` | 處理 frontend → content 的訊息 |
| `biggo/js/background.listener.js` | 處理 content → background 的訊息 |
| `biggo/js/frontend.bundle.js` | Svelte 前端，動態注入 |
| `biggo/js/prototype/Bridge.js` | 訊息包裝/驗證協定 |
| `biggo/js/prototype/Sender/` | 各 context 的訊息發送器 |
| `biggo/js/prototype/Receiver/` | 各 context 的訊息接收器 |
| `biggo/js/content/messenger.js` | chrome.runtime.sendMessage 封裝 |

---

## 一、Content Script 初始化

```
content.bundle.js IIFE
  │
  ├─ injectFrontendScript()
  │    ├─ 建立 ContentReceiver singleton
  │    ├─ 註冊 "ready" handler
  │    ├─ 注入 <script src="frontend.bundle.rollup.js">
  │    └─ 等待 "ready" 訊息（最多 3 秒 timeout）
  │
  ├─ bindRuntimeListener()
  │    └─ chrome.runtime.onMessage.addListener()
  │         處理 background → content 訊息：
  │         ├─ coupon_code → setupCoupon()
  │         ├─ store_detail → FrontendSender.send("open_store_detail")
  │         ├─ coupon_iframe_alert → 建立優惠券 modal
  │         ├─ share_coupon_popup → 開啟回報 popup
  │         └─ login_success → onLoginSuccess()
  │
  ├─ listenSimpleIframeEvent()
  │    └─ window.message listener
  │         ├─ IFRAME_FIT_CONTENT → 調整 iframe 高度
  │         └─ IFRAME_DESTROY → 移除 iframe DOM
  │
  └─ onceTrigger(buildPageFeature)
       └─ 頁面可見後執行一次
```

---

## 二、頁面功能建置（buildPageFeature）

### 2.1 Google 搜尋頁面

```
isGooglePage() && isGoogleFirstPage() && isGoogleTextSearchPage()
  │
  ├─ getSearchEngineQuery("google", url) → 提取搜尋關鍵字
  ├─ googleSearchPage.build(query, count) → 建置搜尋結果
  ├─ miniBar.inject(path) → 注入迷你搜尋列
  └─ googleSearchPage.pushSearchResult({query, region, ...})
```

### 2.2 電商頁面

```
getNindex(currentUrl)
  │
  ├─ 無 nindex → return（非電商）
  │
  └─ 有 nindex → handleNormalEC(nindex)
       │
       ├─ 結帳頁面偵測
       │    ├─ isCheckoutPage(checkout_url) → couponIframe.init(nindex)
       │    └─ isCheckoutPage(checkout_done_url) + isCashback
       │         → cancelCashbackAndClearPopup()
       │
       ├─ 返現商店資訊
       │    └─ isCashbackNindex → FrontendSender.send("open_store_desc")
       │
       └─ 商品頁面功能
            ├─ getProductId() → 取得商品 ID
            ├─ getProduct() → 驗證是否為商品頁
            ├─ mltIframe.build() → FrontendSender.send("open_mlt")
            └─ dragIframe.build() → 建立價格歷史 iframe + 拖拽功能
```

---

## 三、Message Passing 架構

### 3.1 三層通訊

```
┌────────────┐     chrome.runtime      ┌────────────┐
│  Content   │ ◄──────────────────────► │ Background │
│  Script    │     sendMessage          │  Script    │
└─────┬──────┘                          └────────────┘
      │
      │ window.postMessage
      │ (Bridge protocol)
      ▼
┌────────────┐
│  Frontend  │
│  (Svelte)  │
└────────────┘
```

### 3.2 Bridge 協定

訊息結構：
```javascript
{
  source: "__biggo__",              // 驗證常數
  target: "content" | "frontend",  // 目標 receiver 名稱
  type: "action.uuid-hash",        // 動作名 + 唯一 hash
  hash: "uuid",                    // 唯一訊息 ID
  data: { ... }                    // 資料
}
```

### 3.3 Sender / Receiver 模式

| 類別 | 用途 | 通訊方式 |
|------|------|----------|
| `ContentSender` | Content → Frontend | window.postMessage |
| `FrontendSender` | Frontend → Content | window.postMessage |
| `messenger.send()` | Content → Background | chrome.runtime.sendMessage |
| `PopupSender` | Background → Popup | chrome.runtime.sendMessage |

**Request-Reply 模式（post）：**
```
sender.post(type, data)
  ├─ 註冊 receiver listener 等待 {type}_reply
  ├─ 發送訊息
  └─ return Promise → 收到 reply 時 resolve
```

---

## 四、Content → Background 訊息協定

透過 `messenger.js` 的 `send(name, type, msg)` 發送：

```javascript
chrome.runtime.sendMessage({ name, type, msg }, callback)
```

### 處理器對照（background.listener.js）

| name | type | 用途 |
|------|------|------|
| `get` | `domainId` | 查詢 URL 對應的 nindex |
| `get` | `shopee` | 解析 Shopee URL |
| `get` | `tabId` | 取得目前 tab ID |
| `sync` | `sites` | 同步 sites 資料 |
| `sync` | `eclist` | 同步 ECList |
| `sync` | `region` | 同步地區 |
| `sync` | `login` | 同步登入狀態 |
| `util` | `get_coupon` | 取得優惠券列表 |
| `util` | `get_product` | 驗證商品頁面 |
| `util` | `get_price_history` | 取得價格歷史 |
| `util` | `resolve_true_nindex` | 解析真實 nindex |
| `util` | `ga` | 發送 GA 事件 |
| `util` | `create_tab` | 開新分頁 |
| `api` | `get_mlt` | 取得 MLT 推薦 |
| `api` | `get_store_desc` | 取得商店描述 |
| `api` | `search_store` | 搜尋商店 |
| `cashback` | `update_cookie` | 更新返現活動 timestamp |
| `cashback` | `cancel_cashback` | 取消返現 |
| `cashback` | `get_r_url` | 取得導流 URL |
| `config` | `close_page_feature` | 關閉頁面功能 |
| `config` | `set_drag_config` | 儲存拖拽位置 |
| `pop` | `update_icon` | 更新 icon |

---

## 五、Frontend ↔ Content 訊息

### Content → Frontend（FrontendSender）

| type | 用途 |
|------|------|
| `open_mlt` | 開啟 MLT 推薦元件 |
| `open_store_desc` | 開啟商店資訊 |
| `open_store_detail` | 開啟商店詳情 |

### Frontend → Content（content.listener.js）

| type | 用途 |
|------|------|
| `get_sites_list` | 取得 sites 資料 |
| `get_region` | 取得地區 |
| `get_extension_url` | 取得 extension 資源 URL |
| `i18n` | 取得翻譯字串 |
| `biggo_r` | 導流到 BigGo |
| `get_mlt` | 取得 MLT 資料（轉發到 background） |
| `get_mlt_fold` | 取得 MLT 摺疊狀態 |
| `set_mlt_close` / `set_mlt_open` | 設定 MLT 摺疊 |
| `ga` | GA 事件 |
| `share_coupon` | 分享優惠券 |
| `mlt_ready` | MLT 元件就緒 |

---

## 六、Iframe 注入

### 價格歷史（dragIframe）

```
dragIframe.build(nindex, pid)
  │
  ├─ 檢查設定：config.pageFeature.priceHistory
  ├─ 取得商品型號列表：get_product_model_list
  ├─ 取得價格歷史：get_price_history (90 天)
  ├─ 注入 CSS + HTML 模板
  │
  ├─ 建立 iframe：
  │    src = API_DOMAIN/price_history/drag.php?i=${nindex}&id=${pid}&...
  │    id = "_biggo_drag_iframe"
  │
  └─ 綁定拖拽功能：
       ├─ Drag.bindEvent() → mouseenter / mouseleave / mousedown
       ├─ Drag.dragMouseDown() → 80ms hold 開始拖拽
       └─ Drag.closeDragElement() → 儲存位置到 config
```

### MLT 推薦（mltIframe）

```
mltIframe.build(nindex, id)
  └─ FrontendSender.send("open_mlt", {nindex, id})
       └─ Svelte 元件建立 <biggo-mlt> custom element
```

### 優惠券（couponIframe）

```
couponIframe.init(nindex)
  └─ iframe.src = chrome.runtime.getURL(pages/popmenu/couponIframe.html#nindex=...)
```

### 商店資訊（storeIframe）

```
storeIframe.init(nindex, purl, isBuied)
  └─ iframe.src = chrome.runtime.getURL(pages/popmenu/storeIframe.html#nindex=...&purl=...&buied=...)
```

---

## 七、SPA 路由監聽

Content script 監聽 SPA 路由變化，重新執行頁面功能：

```
SPA.listen(callback)
  └─ 偵測 URL 變化（pushState / popState / hashChange）
       └─ callback()
            └─ 重新執行 buildPageFeature()
```
