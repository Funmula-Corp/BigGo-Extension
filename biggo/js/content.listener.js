import Receiver from "./prototype/Receiver/content"
import { i18n, getSitesLang } from "./util.shared"
import { shareCoupon, getNindex } from "./content/util"
import { send } from "./content/messenger"
import ga from "@shared/ga"
import { getMLTFold, closeMLTFold, openMLTFold, isReviewed, setReviewed } from "@shared/status"
import { getRegion } from "@shared/region"
import { getSiteList } from "@shared/sites"

// TODO 之後有多種命名要改
;(() => {
  const rev = Receiver.getReceiver(Receiver)

  rev.onMessage("get_sites_list", async (_, reply) => {
    reply(await getSiteList())
  })

  rev.onMessage("get_region", async (_, reply) => {
    reply(await getRegion())
  })

  rev.onMessage("get_extension_url", ({path}, reply) => {
    reply(chrome.runtime.getURL(path))
  })

  rev.onMessage("i18n", ({key, param=[]}={}, reply) => {
    reply(i18n(key, param))
  })

  rev.onMessage("biggo_r", ({nindex, login=false, lb}) => {
    if(!login) {
      send("util", "update_same_nindex_url", {nindex, lb})
      return
    }

    send("util", "update_nindex_url_with_login", {nindex, lb})
  })

  rev.onMessage("get_mlt", async ({nindex, id}, reply) => {
    reply(await send("api", "get_mlt", {nindex, id}))
  })

  rev.onMessage("get_mlt_fold", async (_, reply) => {
    reply(await getMLTFold())
  })

  rev.onMessage("get_ui_lang", (_, reply) => {
    reply(getSitesLang())
  })

  rev.onMessage("set_mlt_close", () => {
    closeMLTFold()
    ga("more_like_this", "toggle", "close")
  })

  rev.onMessage("set_mlt_open", () => {
    openMLTFold()
    ga("more_like_this", "toggle", "open")
  })

  rev.onMessage("ga", ({label, action, desc}) => {
    ga(label, action, desc)
  })

  rev.onMessage("mlt_ready", () => {
    document.querySelector("biggo-mlt").style.display = ""
  })

  rev.onMessage("share_coupon", async ({code, desc, nindex}, reply) => {
    const _nindex = nindex || await getNindex(window.location.href)
    reply(await shareCoupon({nindex: _nindex, code, desc}))
  })

  rev.onMessage("hide_review", () => {
    setReviewed()
  })

  rev.onMessage("has_reviewed", async (_, reply) => {
    reply(await isReviewed())
  })

  rev.onMessage("to_setting_page", (anchor="") => {
    send("util", "create_tab", `https://extension.biggo.com/member/account.php${anchor!=""?"#" + anchor:""}`)
  })

  rev.listen()
})()
