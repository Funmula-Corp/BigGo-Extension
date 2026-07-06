import { getNindexFromURL } from "@shared/sites"
import * as BigGo from "./libs/biggo"
import * as Icon from "./libs/icon"
import * as Sync from "./libs/sync"
import * as util from "./libs/util"
import * as Cashback from "./libs/cashback"
import * as User from "./libs/user"
import * as CashbackSession from "./libs/cashbackSession"
import { isFirefox } from "./util.shared"
import { send as PopupSender } from "./prototype/Sender/popup"
import { updateAllPopMenu } from "./libs/popup"
import Eclist from "@shared/eclist"
import { setPopupMenu } from "./libs/popup"
import * as env from "@shared/env"
import * as storage from "@shared/storage"
import { installContextMenu } from "./libs/contextMenu"
import "./background.listener"

function cacheCurrentVersion() {
  storage.setItem("version", chrome.runtime.getManifest().version)
}

async function firstStart() {
  const url = isFirefox()
    ? chrome.runtime.getURL("/pages/privacy/index.html")
    : `https://${process.env.API_DOMAIN}/welcome.php?is_install=true`

  cacheCurrentVersion()
  await Sync.syncAccountToken()
  await Sync.syncLogin(true)
  chrome.tabs.create({url})
}

async function syncECThread() {
  const LOOP_TIME = 1000 * 60 * 60
  const lastUpdate = await storage.getItem("update_site_last_time", 0)
  await storage.setItem("update_site_last_time", Date.now())

  if(lastUpdate && (Date.now() - +lastUpdate) < LOOP_TIME) {
    return
  }

  Sync.syncSites().catch(console.error)
  Sync.syncECList().catch(console.error)
}

function bindSyncECThread() {
  syncECThread()
  chrome.alarms.create("syncECThread", {periodInMinutes: 60})
}

/**
 * 綁定判斷返現狀態是否經過其他網站 是的話要移除返現狀態
 */
async function bindSessionHandle() {
  chrome.tabs.onRemoved.addListener(CashbackSession.onTabClosed)

  // Safari 18.4 起 webNavigation 行為與 Chrome 對齊，三個瀏覽器統一走 webNavigation。
  // 舊版 Safari 用 webRequest 會看到每個 302 中繼 hop，導致離站取消返現過度觸發。
  chrome.webNavigation.onCommitted.addListener(CashbackSession.listenOtherSite)
  chrome.webNavigation.onCompleted.addListener(CashbackSession.landingSite)
  // Safari 18.4 的 onBeforeNavigate 帶宣告式 URL filter 時 listener 不會觸發，
  // 故不使用宣告式 filter，改為無 filter + 在 listenBigGoR 內手動判斷 /r/
  chrome.webNavigation.onBeforeNavigate.addListener(CashbackSession.listenBigGoR)
}

/**
 * 如果使用者降低權限 需要跳出說明表示需要最低權限
 */
async function bindPermissionRequest() {
  const minimalPermission = {
    origins: [
      `https://${process.env.API_DOMAIN}/*`,
      "https://account.biggo.com/*",
      "https://biggo.com.tw/*"
    ]
  }

  chrome.permissions.onRemoved.addListener(permission => {
    chrome.permissions.contains(minimalPermission, async (res) => {
      if(!res) {
        // 這東西5秒內只會跳一次
        const lastTime = await storage.getItem("permission_page_last", 0)
        if(Date.now() - +lastTime < 5000) {
          return
        }
        await storage.setItem("permission_page_last", Date.now())

        chrome.windows.create({
          focused: true,
          height: 265,
          width: 540,
          left: (screen.width / 2) - 300,
          top: (screen.height / 2) - 300,
          url: chrome.runtime.getURL("/pages/permission/index.html"),
          type: "panel"
        })
      }
    })
  })
}

async function setUninstallEventHandle() {
  chrome.runtime.setUninstallURL(`https://${process.env.API_DOMAIN}/uninstall.php`, ()=>{})
}

function listenTabChange() {
  chrome.tabs.onActivated.addListener(info => {
    PopupSender("tab_changed", info)
  })
}

function bindDefPopup() {
  env.browserAction.setPopup({
    popup: chrome.runtime.getURL(
      `pages/popmenu/popmenu.html#nindex=&tabId=&purl=&cbi=0&itemId=`
    ),
  })
}

function bindIconSwitch() {
  chrome.webNavigation.onCommitted.addListener(async (detail) => {
    if(detail.parentFrameId !== -1) {
      return
    }

    const { url } = detail

    let nindex = await getNindexFromURL(url)

    const resolved = await util.resolveTrueNindex(nindex, url)
    nindex = resolved.nindex
    let pid = resolved.pid

    if(!pid) {
      const eclist = await Sync.syncECList()
      pid = Eclist.getProductId(eclist, nindex, url)
    }

    setPopupMenu(detail.tabId, url, nindex, pid, {
      animation: false
    })
  })
}

/** 安裝後事件 */
chrome.runtime.onInstalled.addListener(reason => {
  switch(reason.reason) {
    case chrome.runtime.OnInstalledReason.INSTALL:
      firstStart()
      break
    case chrome.runtime.OnInstalledReason.UPDATE:
      cacheCurrentVersion()
      Sync.syncSites(true).catch(console.error)
      Sync.syncECList(true).catch(console.error)
      break
  }
})

/** 定時事件 */
chrome.alarms.onAlarm.addListener(alarm => {
  switch(alarm.name) {
    case "syncECThread":
      syncECThread()
      break
  }
})

// main process IIFE
// @async
;(async () => {
  // MV2: background page 首次啟動時清除返現狀態
  // MV3: session 已透過 chrome.storage.session 持久化，不需要清除
  if (process.env.MANIFEST_VERSION === "2") {
    Cashback.clear()
  }
  // 同步地區設定
  Sync.syncRegion().catch(console.error)
  // 每次開都檢查登入狀態
  Sync.syncAccountToken()
    .then(() => Sync.syncLogin())
    // 確認登入狀態後綁定右鍵選單事件
    .then(() => installContextMenu())
    .catch(console.error)
  // 開始一段時間更新ec列表
  bindSyncECThread()
  // 綁定取消閃爍的事件 可能換tab或關閉時要做清除
  Icon.bindBlinkListener()
  // 綁定更改icon的事件
  bindIconSwitch()
  // 綁定cashback session相關處理
  bindSessionHandle().catch(console.error)
  // update all domain install cookie
  BigGo.updateInstallCookie()
  // 綁定監聽登入登出路徑
  BigGo.bindAccountStatusListener()
  // 設定ga的userid
  User.setGAUserId().catch(console.error)
  // 綁定處理解除安裝的事件
  setUninstallEventHandle().catch(console.error)
  listenTabChange()
  bindDefPopup()
  updateAllPopMenu()
  // 綁定權限變化的處理方法
  bindPermissionRequest().catch(console.error)
})()
