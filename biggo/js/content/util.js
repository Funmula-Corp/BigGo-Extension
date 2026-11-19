import * as share from "../util.shared"
import { send } from "./messenger"
import { getECList, getNindexFromURL } from "@shared/sites"
import Eclist from "@shared/eclist"
import { getCurrentRegionDomain, getRegionDomain } from "@shared/region"
import { UNION_MAP } from "@core/union"

export async function getDomain(region="") {
  return !region ? await getCurrentRegionDomain() : await getRegionDomain(region)
}

export async function getProductId(url, nindex) {
  const eclist = await getECList()
  return Eclist.getProductId(eclist, nindex, url)
}

export async function getNindex(url) {
  const nindex = await getNindexFromURL(url)
  const result = await resolveTrueNindex(nindex, url)
  return result.nindex
}

export async function markCashbackActivity(nindex) {
  send("cashback", "mark_activity", nindex)
}

export function ga(label, action, desc) {
  try{
    send("util", "ga", {
      label, action, desc
    })
  }catch(e) {}
}

export function updateSelectText(text) {
  send("util", "update_select_menu_text", text)
}

export function isCheckoutPage(urlList, url=window.location.href) {
  for (const checkoutUrl of urlList) {
    if((url+"").indexOf(checkoutUrl) > -1) {
      return true
    }
  }
  return false
}

export async function cancelCashback(nindex) {
  return await send("cashback", "cancel_cashback", nindex)
}

export async function resolveTrueNindex(nindex, url=window.location.href) {
  return await send("util", "resolve_true_nindex", {nindex, url})
}

export async function updateIcon(nindex, id, options) {
  send("pop", "update_icon", {nindex, id, options})
}

export async function getProduct(nindex, pid) {
  return await send("util", "get_product", {nindex, pid})
}

export async function getUnionMap() {
  return await send("util", "get_union_map") || UNION_MAP
}

export async function getTemplateDom(path) {
  const html = await share.getTemplate(path)
  return document.createRange().createContextualFragment(html)
}

export async function injectStyle(path) {
  const style = document.createElement("link")
  style.rel = "stylesheet"
  style.type = "text/css"
  style.href = chrome.runtime.getURL(`/style/${path}`)

  document.body.append(style)
}

export async function getPriceHistory(item, days) {
  if(!Array.isArray(item)) {
    item = [item]
  }

  return await send("util", "get_price_history", {
    item, days
  })
}

export function openLoginWindow(url) {
  const height = 650
  const width = 600
  const left = Math.floor((screen.width/2)-(width/2))
  const top = Math.floor((screen.height/2)-(height/2))

  send("util", "social_login_window", {
    url, height, width, left, top,
    type: "popup"
  })
}

export function emailLogin(method="login", param={}) {
  send("util", "set_cookie", {key: "loginUrl", value: "/auth.php", url: `https://${process.env.API_DOMAIN}/`})
  const reUrl = encodeURIComponent(`https://${process.env.API_DOMAIN}/auth.php`)
  openLoginWindow(`https://${process.env.ACCOUNT_DOMAIN}/?source=extension&app=extension&url=${reUrl}&method=${method}${param.email&&"&email="+param.email||""}`)
}
