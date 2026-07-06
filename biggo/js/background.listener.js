import * as Region from "@shared/region"
import * as Sync from "./libs/sync"
import * as util from "./libs/util"
import * as Cashback from "./libs/cashback"
import * as Sites from "@shared/sites"
import { syncToServer } from "./libs/config"
import * as Config from "@shared/config"
import * as Popup from "./libs/popup"
import * as BigGo from "./libs/biggo"
import * as User from "./libs/user"
import { getCurrentTabId } from "@background/util"
import ga from "./libs/ga"
import * as storage from "@shared/storage"
import { base64ToArrayBuffer, i18n, isImageSearchSupportFormat } from "./util.shared"
import { getUserProfile } from "@shared/user"
import { isActivity } from "@shared/cashback"
import { getId } from "@background/domain"
import { installContextMenu } from "@background/contextMenu"
import { getUnionMapFromList } from "@core/union"

const receiver = {}

receiver.sync = (() => {
  return {
    sites() {
      return Sync.syncSites()
    },
    eclist() {
      return Sync.syncECList()
    },
    region() {
      return Sync.syncRegion()
    },
    login() {
      return Sync.syncLogin()
    },
  }
})()

receiver.get = (() => {
  return {
    async shopee(url) {
      const { nindex, pid } = await util.resolveTrueNindex("tw_bid_shopee", url)
      return { id: pid, nindex }
    },
    tabId(_, sender) {
      return getCurrentTabId(sender.tab?.id || "")
    },
    domainId(url) {
      return getId(url)
    }
  }
})()

receiver.util = (() => {
  return {
    async get_coupon(nindex) {
      // const couponObj = await Sync.syncCoupon(nindex)
      return []
    },
    is_shopee_mall(pid) {
      return util.detectShopeeMall(pid)
    },
    is_shopee_bid(pid) {
      return util.detectShopeeBid()
    },
    async resolve_true_nindex({nindex, url}) {
      return util.resolveTrueNindex(nindex, url)
    },
    update_url(url) {
      chrome.tabs.query({active: true}, (tab)=>{
        chrome.tabs.update(tab.id, {url})
      })
    },
    update_same_nindex_url({nindex, lb}) {
      BigGo.redirectActiveTab(nindex, lb)
    },
    update_nindex_url_with_login({nindex, lb}, sender) {
      const {url} = sender.tab
      BigGo.r(url, nindex, true, lb)
    },
    update_nindex_url_with_login_and_tab(nindex) {
      chrome.tabs.query({active: true, windowId: chrome.windows.WINDOW_ID_CURRENT}, tab => {
        if(tab && tab.length) {
          BigGo.r(tab[0].url, nindex, true)
        }
      })
    },
    update_select_menu_text(text) {
      const param = {
        title: i18n("SEARCH_WITH_BIGGO", [text]),
        visible: true
      }

      if(!text) {
        param.visible = false
      }

      chrome.contextMenus.update("biggosearch", param)
    },
    ga({label, action, desc}) {
      if(label && action) {
        ga(label, action, desc)
      }
    },
    create_tab(url) {
      chrome.tabs.create({
        active: true,
        url
      })
    },
    close_tab(_, {tab}) {
      const {id} = tab
      chrome.tabs.remove(id, () => {
        console.log(`remove tab ${id}`)
      })
    },
    is_product({nindex, pid}) {
      return util.isProduct(nindex, pid)
    },
    get_product({nindex, pid}) {
      return util.getProduct(nindex, pid)
    },
    async get_union_map() {
      return getUnionMapFromList(await storage.getItem(storage.STORAGE_UNION_LIST, {}))
    },
    social_login_window(param) {
      const lastUrl = globalThis.___login_u
      globalThis.___login_u = param.url

      const create = () => {
        chrome.windows.create(param, w => {
          globalThis.___login_w = w.id
        })
      }

      if(globalThis.___login_w) {
        return chrome.windows.get(globalThis.___login_w, {populate: true}, w => {
          if(!w) {
            return create()
          }

          // 跟上次開不同網址
          if(globalThis.___login_w && lastUrl != param.url) {
            // 只有在該視窗確定是「單一分頁」（登入 popup 本來就只有一頁）時才關，
            // 避免 window id 過期/被重用時誤關使用者的多分頁主視窗、連帶關掉整個 Chrome
            if(w.tabs && w.tabs.length === 1) {
              chrome.windows.remove(globalThis.___login_w)
            }
            return create()
          }

          chrome.windows.update(w.id, {
            focused: true
          })
        })
      }

      create()
    },
    get_price_history({item, days}) {
      return Sync.getPriceHistory(item, days)
    },
    get_last_login() {
      return Sync.getLastLoginList()
    },
    get_login_profile() {
      return getUserProfile()
    },
    logout() {
      BigGo.logoutHandle()
      return User.apiLogout()
    },
    new_tab({url, ...param}) {
      chrome.tabs.create({
        url,
        active: true,
        ...param
      })
    },
    set_cookie({key, value, url}, sender) {
      url = url || sender.url || sender?.tab?.url
      const param = {
        path: "/",
        name: key,
        value, url
      }

      return new Promise(resolve => chrome.cookies.set(param, resolve))
    },
    force_update_member() {
      Sync.syncLogin(true)
    },
    uninstall() {
      chrome.runtime.setUninstallURL("", () => {
        browser.management.uninstallSelf()
      })
    },
    get_current_tab() {
      return new Promise(resolve => {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
          resolve(tabs[0] || null)
        })
      })
    },
    save_permission(obj) {
      storage.setItem("permission", obj)
    },
    async get_nindex_from_url(url) {
      const nindex = await Sites.getNindexFromURL(url)
      const result = await util.resolveTrueNindex(nindex, url)
      return result.nindex
    },
  }
})()

receiver.pop = (() => {
  return {
    update_icon({nindex, id, options}, sender) {
      Popup.setPopupMenu(
        sender.tab.id,
        sender.tab.url,
        nindex,
        id,
        options
      )
    },
    open_option_page() {
      chrome.runtime.openOptionsPage()
    },
    close() {
      if(!chrome.extension.getViews) {
        return
      }

      const windows = chrome.extension.getViews({type: "popup"})
      if(windows.length) {
        windows[0].close()
      }
    },
    get_history_click() {
      return storage.getItem("popup_history_click", [])
    },
    async set_history_click(obj) {
      await storage.setItem("popup_history_click", obj)
      return true
    },
    open_store_detail_popup({name, descHTML, image}) {
      util.sendMsgToCurrentPage("store_detail", {name, descHTML, image})
    },
    show_share_coupon({nindex}) {
      util.sendMsgToCurrentPage("share_coupon_popup", {nindex})
    },
    clear(nindex) {
      Status.clearPopuped(nindex)
    },
    async upload_image(src) {
      if(!src) {
        return ""
      }

      let blob
      if(!src.startsWith("http")) {
        const buffer = base64ToArrayBuffer(src)
        if(!isImageSearchSupportFormat(buffer)) {
          console.error("invalid image type")
          return ""
        }

        blob = new Blob([buffer])
      } else {
        blob = await fetch(src).then(res => res.blob()).catch(() => undefined)
        if(!["image/png", "image/jpg", "image/jpeg", "image/webp", "text/html"].includes(blob.type)) {
          console.error("invalid mimetype")
          return ""
        }
      }

      if(!blob) {
        console.error("empty blob")
        return ""
      }

      if(blob.size > 20 * 1024 * 1024) {
        console.error("image too large")
        return ""
      }

      const form = new FormData
      form.append("method", "upload_image")
      form.append("image", blob, "image.jpg")

      return fetch("https://biggo.com.tw/api/imagesearch.php", {
        method: "POST",
        body: form,
      })
        .then(res => res.json())
        .then(async res => {
          const url = `https://biggo.com.tw/imgsearch/${res.key}`
          chrome.tabs.create({ url })
          return res.key
        })
        .catch(() => "")
    }
  }
})()

receiver.cashback = (() => {
  return {
    async mark_activity(nindex, sender) {
      if(await isActivity(nindex, sender.tab && sender.tab.id)) {
        Cashback.updateCashbackActivity(nindex, await getCurrentTabId(sender.tab.id))
      }
    },
    async cancel_cashback(nindex, sender) {
      return Cashback.cancelCashback(nindex, await getCurrentTabId(sender.tab && sender.tab.id || 0))
    },
    enable({nindex}) {
      BigGo.redirectActiveTab(nindex)
    },
    get_r_url({nindex, url, domain, pid="biggo"}) {
      return BigGo.getRUrl({nindex, url, domain, pid})
    },
    get_cashback_detail(nindex) {
      return Cashback.getCashbackDetail(nindex)
    }
  }
})()

receiver.config = (() => {
  return {
    async close_page_feature(feature) {
      await Config.setPageFeature({
        [feature]: false
      })
      syncToServer()
    },
    set_drag_config(config) {
      Config.setDragConfig(config)
    },
    async set_config_from_server(config) {
      await Config.setConfigFromServer(config)
      installContextMenu()
    }
  }
})()

receiver.api = (() => {
  return {
    get_hotlist_store(region) {
      const url = `https://${process.env.API_DOMAIN}/api/store.php?method=hot_store&region=${region||"us"}`
      return util.getJson(url)
    },
    async get_store_desc({nindex}) {
      const url = `https://${process.env.API_DOMAIN}/api/store.php?method=store_detail&id=${nindex}`
      return util.getJson(url)
    },
    search_store({q}) {
      const url = `https://${process.env.API_DOMAIN}/api/store.php?method=suggest_store_name&q=${q}`
      return util.getJson(url)
    },
    get_product_model_list({nindex, id}) {
      const url = `https://${process.env.API_DOMAIN}/api/product.php?method=get_model_id&nindex=${nindex}&oid=${id}`
      return util.getJson(url)
    },
    get_mlt({nindex, id}) {
      const url = `https://${process.env.API_DOMAIN}/api/mlt.php?online&i=${nindex}&id=${id}`
      return util.getJson(url)
    },
    share_coupon({nindex, code, desc}) {
      const url = `https://${process.env.API_DOMAIN}/api/shared_coupon.php?method=insert_coupon&store_id=${nindex}&coupon_code=${code}&coupon_text=${desc}`
      return util.getJson(url).catch(e => false)
    },
    async subscribe({nindex, id, type}) {
      const url = `https://${process.env.API_DOMAIN}/api/subscribe.php?method=${type?"add":"remove"}&nindex=${nindex}&oid=${id}`
      return util.getJson(url).then(() => true).catch(e => false)
    },
    async is_subscribe({nindex, id}) {
      const url = `https://${process.env.API_DOMAIN}/api/subscribe.php?method=found&nindex=${nindex}&oid=${id}`
      const { is_subscribe=false } = await util.getJson(url).catch(e => ({is_subscribe: false}))
      return is_subscribe
    }
  }
})()

function getHandle(name) {
  switch(name) {
    case "cashback": return receiver.cashback
    case "pop": return receiver.pop
    case "config": return receiver.config
    case "api": return receiver.api
    case "sync": return receiver.sync
    case "get": return receiver.get
    default: return receiver.util
  }
}

// once request
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(!request.name || !request.type) {
    sendResponse(false)
    return false
  }

  const {name, type} = request
  const handler = getHandle(name)
  if(handler && handler[type]) {
    Promise.resolve(handler[type](request.msg, sender, sender.tab)).then(sendResponse)
  } else {
    sendResponse(true)
  }

  return true
})
