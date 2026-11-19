biggo.internal.listener.js：注入 BigGo 自家網域（manifest 第二組 content_scripts，all_frames、document_start）的 content script，接收頁面 `postMessage` 的 `{source: "_biggo_", type, msg}`，交給 `client/handle.js` 對應的 handler 處理，回覆 `${type}_reply`。

biggo.internal.bundle.js：同一套訊息格式的註冊器 `listen(name, handle, target)`，可指定回覆目標視窗。使用者有兩個：
- popup（`pages/popmenu/script/popmenu.js`）：回應內嵌的遠端 popmenu iframe，註冊 `client/handle.js` 全部 handler 與 `swtich-tab`、`close`。
- 歷史價格浮窗（`js/content/dragIframe.js`，以 `addInternalListener` 匯入，跑在每個商品頁）：回應 `price_history/drag.php` iframe 的 `close`、`get-cache-pricehistory`、`set-def-days`。
