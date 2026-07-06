import { getCashbackDetail } from "@background/cashback"
import * as share from "../util.shared"
import { send } from "./messenger"
import { getECList, getNindexFromURL } from "@shared/sites"
import Eclist from "@shared/eclist"
import { getCurrentRegionDomain, getRegionDomain } from "@shared/region"
import { UNION_MAP } from "@core/union"

export async function isNindexCashback(nindex) {
  const list = await getCashbackDetail()
  return !!list[nindex]
}

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

export async function getNindexLocal(url) {
  return await getNindexFromURL(url)
}

export async function getProductIdFromUrl(url) {
  const nindex = await getNindexFromURL(url)
  const eclist = await getECList()
  return await Eclist.getProductId(eclist, nindex, url)
}

export async function getCoupon(nindex) {
  return await send("util", "get_coupon", nindex)
}

export function openOptionPage() {
  send("pop", "open_option_page")
}

export async function getMltData(nindex, id) {
  return await send("api", "get_mlt", {nindex, id})
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

export function updateUrl(url) {
  send("util", "update_url", url)
}

export function updateSameNindexUrl(nindex, lb="") {
  send("util", "update_same_nindex_url", {nindex, lb})
}

export function createTab(url) {
  send("util", "create_tab", url)
}

export function updateSelectText(text) {
  send("util", "update_select_menu_text", text)
}

export async function setupCoupon(code, title, content) {
  if (document.getElementById('cp_popup')) {
    document.getElementById('cp_popup').remove();
  }

  const coupon = document.createElement('div');
  coupon.id = 'cp_popup';
  coupon.innerHTML = await share.getFormatTemplate("coupon_pop.html", {
    title, content, code,
    copy: share.i18n("Copy"),
    discount_code: share.i18n("discount_code_full"),
    copied: share.i18n("COPIED_CHECKOUT")
  })

  share.copy(code)

  const script = document.createElement('script')
  script.text = `
    function clickCode() {
      var sctarget = document.getElementById('pop-copy');
      var ohtml = '<span>${share.i18n("Copy")}</span><span>${share.i18n("discount_code_full")}</span>';
      var nhtml = '<span>${share.i18n("Copied")}</span>';
      sctarget.innerHTML = nhtml;

      var el = document.getElementById('coupon-pop-code');
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();

      setTimeout(function() {
        sctarget.innerHTML = ohtml;
      }, 3000)
    }`

  document.body.appendChild(coupon)
  document.body.appendChild(script)
}

// 組 BigGo 自家 /r/ 導購連結（通用建構器，中性命名）；purl 逐字保留
export async function getBigGoRUrl(nindex, pid="biggo", url=window.location.href, lb="") {
  if(!pid) {
    pid = "biggo"
  }

  return await send("cashback", "get_r_url", {nindex, pid, url, domain: "extension.biggo.com", lb})
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

export async function cancelCashbackAndClearPopup(nindex) {
  send("popup", "clear", nindex)
  return cancelCashback(nindex)
}

export async function resolveTrueNindex(nindex, url=window.location.href) {
  return await send("util", "resolve_true_nindex", {nindex, url})
}

export async function updateIcon(nindex, id, options) {
  send("pop", "update_icon", {nindex, id, options})
}

export async function isProduct(nindex, pid) {
  return await send("util", "is_product", {nindex, pid})
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

export async function getFormatTemplateDom(path, format={}) {
  const html = await share.getFormatTemplate(path, format)
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

export async function closePageFeature(feature="def") {
  send("config", "close_page_feature", feature)
}

export async function shareCoupon({nindex, code, desc}) {
  return await send("api", "share_coupon", {nindex, code, desc})
}

export function openLoginWindow(url) {
  const height = 650
  const width = 600
  const left = (screen.width/2)-(width/2)
  const top = (screen.height/2)-(height/2)

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
