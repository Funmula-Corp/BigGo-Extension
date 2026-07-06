import * as util from "../content/util"
import msg from "../content/messenger"
import { getSiteList } from "@shared/sites"
import { getRegion, getRegionDomain } from "@shared/region"
import { isLogin, getUserProfile } from "@shared/user"
import { isOverShowPopupDoc, increasePopupDocShow, isReviewed, setReviewed, getMLTFold, openMLTFold, closeMLTFold } from "@shared/status"
import { isActivity } from "@shared/cashback"
import { getConfig } from "@shared/config"
import { arrayBufferToBase64, copy, getNindexRegion } from "@/util.shared"
import * as storage from "@shared/storage"

async function getHistoryClick() {
  return msg.post("pop", "get_history_click")
}

async function setHistoryClick(obj) {
  await msg.post("pop", "set_history_click", obj)
}

function newTab(url, ...param) {
  msg.send("util", "new_tab", {url, ...param})
}

/**
 * @param {{send: (key: string, method: any, data?: any)=>void, post: (key: string, method: any, data?: any)=>Promise<any>}} msg 跟bg溝通的物件
 * @returns {Record<string, (data: any, reply: (msg: any):void)=>any}
 */
export default function(){
  return {
    async auth_login({status}, postMessage) {},
    async close_page() {
      msg.send("util", "close_tab")
    },
    close() {
      window.close()
    },
    async social_login({type}) {
      msg.send("util", "set_cookie", {key: "loginUrl", value: "/auth.php", url: `https://${process.env.API_DOMAIN}/`})
      const reUrl = encodeURIComponent(`https://${process.env.API_DOMAIN}/auth`)
      const url = `https://${process.env.ACCOUNT_DOMAIN}/?app=extension&url=${reUrl}&method=${type}`
      util.openLoginWindow(url)
    },
    async email_login({method, ...param}) {
      util.emailLogin(method, param)
    },
    async open_option_page() {
      msg.send("pop", "open_option_page")
    },
    async get_extension_config(_, postMessage) {
      postMessage(await getConfig())
    },
    async get_last_login(_, postMessage) {
      postMessage(await msg.post("util", "get_last_login"))
    },
    async get_login_profile(_, postMessage) {
      postMessage(await getUserProfile())
    },
    open_setting() {
      msg.send("pop", "open_option_page")
    },
    async logout_user(_, postMessage) {
      postMessage(await msg.post("util", "logout"))
    },
    async get_coupon(nindex, postMessage) {
      postMessage(await msg.post("util", "get_coupon", nindex))
    },
    async set_coupon({code, title, content}) {
      copy(code)
      util.setupCoupon(code, title, content)
    },
    async enable_cashback({nindex}) {
      msg.send("cashback", "enable", {nindex, lb: "extension_logobutton"})
    },
    async goto_store_overview() {
      newTab(`https://${process.env.API_DOMAIN}/store/overview.php`)
    },
    async goto_store_desc(nindex) {
      newTab(`https://${process.env.API_DOMAIN}/store/?nindex=${nindex}`)
    },
    async new_tab(url) {
      newTab(url)
    },
    async new_tab_with_param({ url, ...param }) {
      newTab(url, ...param)
    },
    async get_sites(_, postMessage) {
      postMessage(await getSiteList())
    },
    async get_site(nindex, postMessage) {
      const sites = await getSiteList()
      postMessage(sites && sites[nindex] || false)
    },
    async is_activity(nindex, postMessage) {
      postMessage(await isActivity(nindex))
    },
    async get_history(_, postMessage) {
      postMessage(await getHistoryClick())
    },
    async put_history(param, postMessage) {
      const history = await getHistoryClick()
      for (const obj of history) {
        if(param.id === obj.id) {
          return postMessage(history)
        }
      }

      history.push(param)
      setHistoryClick(history)
      postMessage(history)
    },
    async rm_history(id, postMessage) {
      const history = await getHistoryClick()
      for (let i=0; i<history.length; i++) {
        if(id === history[i].id) {
          history.splice(i, 1)
          setHistoryClick(history)
        }
      }
      postMessage(history)
    },
    async is_login(_, postMessage) {
      postMessage(await isLogin())
    },
    async get_mlt_fold(_, postMessage) {
      postMessage(await getMLTFold())
    },
    async set_mlt_fold(status) {
      if(status === "open") {
        openMLTFold()
      }else{
        closeMLTFold()
      }
    },
    async is_over_show_doc(_, postMessage) {
      postMessage(isOverShowPopupDoc())
    },
    async show_doc() {
      increasePopupDocShow()
    },
    set_config(config) {
      msg.send("config", "set_config_from_server", config)
    },
    async get_hotlist_store(region, postMessage) {
      postMessage(await msg.post("api", "get_hotlist_store", region))
    },
    async get_store_desc({nindex}, postMessage) {
      postMessage(await msg.post("api", "get_store_desc", {nindex}))
    },
    async search_store({q}, postMessage) {
      postMessage(await msg.post("api", "search_store", {q}))
    },
    async get_region(_, postMessage) {
      postMessage(await getRegion())
    },
    open_store_detail_popup({name, descHTML, image}) {
      msg.send("pop", "open_store_detail_popup", {name, descHTML, image})
    },
    async get_cashback_detail(nindex, postMessage) {
      postMessage(await msg.post("cashback", "get_cashback_detail", nindex))
    },
    open_biggo_cashback_detail(nindex) {
      newTab(`https://${getRegionDomain(getNindexRegion(nindex))}/store/?i=${nindex}`)
    },
    async get_domain(_, postMessage) {
      postMessage(getRegionDomain(await getRegion()))
    },
    // 確認是否有安裝用的
    hello(_, postMessage) {
      postMessage(true)
    },
    force_update_member() {
      msg.send("util", "force_update_member")
    },
    uninstall() {
      msg.send("util", "uninstall")
    },
    has_feature(f, postMessage) {
      postMessage([
        "share_coupon",
        "login_and_active",
        "review",
        "block_setting",
        "get_domain",
        "image_search_context",
        "image_search_page",
        "image_search_popup_v2",
      ].includes(f))
    },
    open_share_coupon(nindex) {
      msg.send("pop", "show_share_coupon", {nindex})
    },
    r_with_login(nindex) {
      msg.send("util", "update_nindex_url_with_login_and_tab", nindex)
    },
    hide_review() {
      setReviewed()
    },
    async has_reviewed(_, postMessage) {
      postMessage(await isReviewed())
    },
    ga(obj=[]) {
      util.ga(...obj)
    },
    async get_price_history(item, postMessage) {
      const key = `price-history:${item}`
      const res = await storage.getItem(`price-history:${item}`, false)
      postMessage(res)
      res && storage.removeItem(key)
    },
    async upload_image(buffer, postMessage) {
      postMessage(await msg.post("pop", "upload_image", typeof buffer != "string" ? arrayBufferToBase64(buffer) : buffer))
    }
  }
}
